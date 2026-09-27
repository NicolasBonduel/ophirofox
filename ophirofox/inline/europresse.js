// Mode « Lire ici » : recherche l'article sur Europresse via le proxy de l'établissement
// et en extrait le texte. Chargé après content_scripts/config.js (ophirofox_config,
// permissionForPartner) et content_scripts/europresse_query.js. Le HTML d'Europresse
// n'est pas documenté : les sélecteurs correspondent au site tel qu'il était en septembre 2026.

// Seuls les partenaires EZproxy (« …/login?url=<url europresse> ») sont pris en charge :
// ils servent tous Europresse sur leur propre domaine réécrit, avec les mêmes pages.
const OPHIROFOX_INLINE_EZPROXY_LOGIN = /\/login\?q?url=/i;

// Code d'erreur d'Europresse pour une session expirée (cf. europresse_search.js)
const OPHIROFOX_INLINE_SESSION_EXPIRED = "4000112";

class OphirofoxInlineLoginRequired extends Error { }

function ophirofoxInlineDebug(...args) {
    console.debug("(Ophirofox inline)", ...args);
}

/**
 * Configuration du partenaire pour le mode « Lire ici »
 * @returns {Promise<{name:string, proxyBase:string, loginUrl:string, sessionPath:string} | null>}
 * null si le partenaire n'est pas un proxy EZproxy
 */
async function ophirofoxInlineConfig() {
    const partner = await ophirofox_config;
    if (!partner || !OPHIROFOX_INLINE_EZPROXY_LOGIN.test(partner.AUTH_URL)) return null;

    // Le domaine Europresse du proxy est celui de la permission déjà demandée par Ophirofox
    const permission = partner.PROXY_URL || permissionForPartner(partner);
    if (!permission) return null;
    const proxyBase = new URL(permission).origin;
    if (/^https?:\/\/nouveau\.europresse\.com$/.test(proxyBase)) return null;

    // AUTH_URL cible par exemple https://nouveau.europresse.com/access/ip/default.aspx?un=…
    // Demander ce chemin sur le domaine du proxy ouvre la session Europresse.
    const params = new URL(partner.AUTH_URL).searchParams;
    let sessionPath = "/Search/Reading";
    try {
        const target = new URL(params.get("url") || params.get("qurl"));
        if (target.pathname.startsWith("/access/")) sessionPath = target.pathname + target.search;
    } catch (_) { }

    return { name: partner.name, proxyBase, loginUrl: partner.AUTH_URL, sessionPath };
}

// ======== REQUÊTES VERS LE PROXY ========

/**
 * Sans session, le proxy redirige vers la connexion de l'établissement (pour la BnF :
 * login.bnf.idm.oclc.org, un formulaire SAML, puis la page CAS). Toutes nos requêtes
 * visent le domaine du proxy : arriver ailleurs signifie qu'il faut se connecter.
 * @returns {string|null} la page de connexion atteinte, ou null
 */
function ophirofoxInlineLoginPage(requestedUrl, response, doc) {
    const url = new URL(response.url);
    const offHost = url.host !== new URL(requestedUrl).host;
    const loginForm = /^\/login/i.test(url.pathname) ||
        doc.querySelector('input[type="password"], input[name="SAMLRequest"], input[name="SAMLResponse"]');
    const expired = url.searchParams.get("ErrorCode") === OPHIROFOX_INLINE_SESSION_EXPIRED;
    return (offHost || loginForm || expired) ? url.host + url.pathname : null;
}

/**
 * Requête vers le proxy, faite par la page d'arrière-plan pour porter les cookies de session
 * @returns {Promise<{response: object, doc: Document}>}
 */
async function ophirofoxInlineGet(url, options = {}) {
    const response = await new Promise(accept =>
        chrome.runtime.sendMessage({ type: "ophirofox-inline-fetch", url, ...options }, accept));
    if (!response || response.status === 0) {
        throw new Error(`réseau : ${response?.error || "pas de réponse"}`);
    }
    if (response.redirectBlocked) {
        throw new OphirofoxInlineLoginRequired("redirigé hors d'Europresse");
    }
    const doc = new DOMParser().parseFromString(response.html, "text/html");
    ophirofoxInlineDebug("GET", url, "→", response.status, response.url, `« ${doc.title} »`);
    const loginPage = ophirofoxInlineLoginPage(url, response, doc);
    if (loginPage) throw new OphirofoxInlineLoginRequired(`redirigé vers ${loginPage}`);
    return { response, doc };
}

// ======== COMPARAISON DE TEXTES ========

function ophirofoxInlineNormalize(text) {
    return (text || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[’‘`]/g, "'")
        .replace(/[«»“”"]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function ophirofoxInlineBigrams(text) {
    const normalized = ophirofoxInlineNormalize(text).replace(/[^a-z0-9 ]/g, "");
    const bigrams = new Map();
    for (let i = 0; i < normalized.length - 1; i++) {
        const bigram = normalized.slice(i, i + 2);
        bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
}

/**
 * Similarité entre deux textes (coefficient de Dice sur les bigrammes)
 * @returns {number} entre 0 et 1
 */
function ophirofoxInlineSimilarity(a, b) {
    const bigramsA = ophirofoxInlineBigrams(a);
    const bigramsB = ophirofoxInlineBigrams(b);
    let common = 0;
    let total = 0;
    for (const [bigram, count] of bigramsA) {
        common += Math.min(count, bigramsB.get(bigram) || 0);
        total += count;
    }
    for (const count of bigramsB.values()) total += count;
    return total ? (2 * common) / total : 0;
}

// ======== RECHERCHE ========

function ophirofoxInlineFormFields(form) {
    const fields = new URLSearchParams();
    for (const input of form.querySelectorAll("input[name], select[name], textarea[name]")) {
        if (["submit", "button", "file"].includes(input.type)) continue;
        if ((input.type === "checkbox" || input.type === "radio") && !input.checked) continue;
        if (input.tagName === "SELECT") {
            const option = input.querySelector("option[selected]") || input.querySelector("option");
            if (option) fields.append(input.name, option.value);
        } else {
            fields.append(input.name, input.value ?? "");
        }
    }
    return fields;
}

function ophirofoxInlineParseResults(doc, baseUrl) {
    const results = [];
    for (const item of doc.querySelectorAll(".docListItem")) {
        const link = item.querySelector("a.docList-links");
        if (!link) continue;
        results.push({
            title: link.textContent.replace(/\s+/g, " ").trim(),
            source: item.querySelector(".source-name")?.textContent.trim() || "",
            href: new URL(link.getAttribute("href"), baseUrl).href,
        });
    }
    return results;
}

// Europresse préfixe les titres par les auteurs (« Adam Baczko et … Penser la guerre… ») :
// un résultat qui contient le titre de la page est considéré comme exact.
function ophirofoxInlineTitleScore(pageTitle, resultTitle) {
    const a = ophirofoxInlineNormalize(pageTitle).replace(/[^a-z0-9 ]/g, "");
    const b = ophirofoxInlineNormalize(resultTitle).replace(/[^a-z0-9 ]/g, "");
    if (a && b.includes(a)) return 1;
    return ophirofoxInlineSimilarity(a, b);
}

/**
 * Page de recherche d'Europresse, en réutilisant la session en cours ou en en ouvrant une.
 * Quand la session Europresse a expiré (celle du proxy restant valide), Europresse répond
 * par une page qui redirige en JavaScript vers ErrorCode=4000112, même à l'ouverture de
 * session : il faut d'abord la fermer via /Default.aspx?ErrorCode=4000112, comme le fait
 * un onglet (voir ophirofoxRealoadOnExpired dans europresse_search.js).
 * @returns {Promise<{page: {response: object, doc: Document}, form: HTMLFormElement}>}
 */
async function ophirofoxInlineSearchForm(config) {
    const open = async (path) => {
        try {
            const page = await ophirofoxInlineGet(config.proxyBase + path);
            return { page, form: page.doc.querySelector('input[name="Keywords"]')?.form };
        } catch (err) {
            // Session Europresse expirée : les étapes suivantes la recréent, et ne renvoient vers
            // la connexion de l'établissement que si celle du proxy a expiré aussi
            if (!(err instanceof OphirofoxInlineLoginRequired)) throw err;
            return { page: null, form: null };
        }
    };
    const isExpired = ({ page }) => !!page && page.response.html.length < 500 &&
        page.response.html.includes("ErrorCode=" + OPHIROFOX_INLINE_SESSION_EXPIRED);

    let result = await open("/Search/Reading");
    if (!result.form && !isExpired(result)) result = await open(config.sessionPath);
    if (!result.form && isExpired(result)) {
        ophirofoxInlineDebug("session Europresse expirée, réouverture");
        await open("/Default.aspx?ErrorCode=" + OPHIROFOX_INLINE_SESSION_EXPIRED);
        result = await open(config.sessionPath);
    }
    if (result.form) return result;

    // Sans page, la dernière requête a été redirigée vers la connexion : on la refait sans
    // intercepter l'erreur, qui indique où elle a été redirigée
    let page = result.page;
    if (!page) {
        page = await ophirofoxInlineGet(config.proxyBase + config.sessionPath);
        const form = page.doc.querySelector('input[name="Keywords"]')?.form;
        if (form) return { page, form };
    }
    // Autre page (message d'information…) : se reconnecter recrée la session
    const path = new URL(page.response.url).pathname;
    throw new OphirofoxInlineLoginRequired(`page reçue : « ${page.doc.title || "sans titre"} » (${path})`);
}

/**
 * Recherche l'article sur Europresse et classe les résultats
 * @param {string} field - "TIT_HEAD=" (titre et chapeau) ou "TEXT=" (texte intégral)
 * @param {{keywords:string, publishedTime:string, title:string, sources:string[]}} article
 * keywords et publishedTime : ceux du lien « Lire sur Europresse » ; sources : éditions à
 * privilégier, par ordre de préférence (début du nom de la source)
 * @param {{proxyBase:string, sessionPath:string}} config
 * @returns {Promise<{title:string, source:string, href:string, score:number}[]>}
 */
async function ophirofoxInlineSearch(field, { keywords, publishedTime, title, sources = [] }, config) {
    const { page, form } = await ophirofoxInlineSearchForm(config);

    const fields = ophirofoxInlineFormFields(form);
    const dateRange = form.querySelector('select[name="DateFilter.DateRange"]');
    if (dateRange) fields.set(dateRange.name, String(ophirofoxDateRange(publishedTime)));
    const action = new URL(form.getAttribute("action") || page.response.url, page.response.url).href;

    fields.set("Keywords", field + ophirofoxSearchKeywords(keywords));
    await ophirofoxInlineGet(action, {
        method: "POST",
        body: fields.toString(),
        contentType: "application/x-www-form-urlencoded",
    });
    // /Search/ResultMobile est une page vide : la liste vient de GetPage, pour la recherche
    // enregistrée dans la session
    const list = await ophirofoxInlineGet(config.proxyBase + "/Search/GetPage?pageNo=0&docPerPage=50");
    const found = ophirofoxInlineParseResults(list.doc, list.response.url);

    // Europresse ajoute l'édition au nom de la source (« Le Monde (site web) - Edition principale »)
    const preferred = sources.map(ophirofoxInlineNormalize);
    const results = found.map(result => {
        const source = ophirofoxInlineNormalize(result.source);
        const rank = preferred.findIndex(name => source.startsWith(name));
        const bonus = rank === -1 ? 0 : 0.1 * (1 - rank / preferred.length);
        return { ...result, score: ophirofoxInlineTitleScore(title, result.title) + bonus };
    });
    results.sort((a, b) => b.score - a.score);
    ophirofoxInlineDebug(field, "résultats", results);
    return results;
}

// ======== TEXTE DE L'ARTICLE ========

// Intertitres : <p><em style="font-weight:bold;">…</em></p> dans l'édition papier,
// paragraphe court sans ponctuation finale dans l'édition web
function ophirofoxInlineIsHeading(paragraph, text) {
    if (text.length > 120) return false;
    const bold = paragraph.querySelector('b, strong, em[style*="bold"]');
    if (bold && bold.textContent.trim() === text) return true;
    return !/[.!?…:;»")\]]$/.test(text) && !/[.!?] /.test(text);
}

/**
 * Télécharge un résultat et découpe son texte en blocs
 * @returns {Promise<{type: "heading"|"paragraph", text:string}[]>}
 */
async function ophirofoxInlineFetchArticle(result) {
    const { doc } = await ophirofoxInlineGet(result.href);
    const body = doc.querySelector(".docOcurrContainer") || doc.querySelector(".DocText");
    if (!body) throw new Error("texte de l'article introuvable sur Europresse");

    const blocks = [];
    for (const paragraph of body.querySelectorAll("p")) {
        const text = paragraph.textContent.replace(/\s+/g, " ").trim();
        if (!text || /^(cet article est paru dans|©)/i.test(text)) continue;
        blocks.push({ type: ophirofoxInlineIsHeading(paragraph, text) ? "heading" : "paragraph", text });
    }
    ophirofoxInlineDebug("article", result.href, blocks);
    if (blocks.length === 0) throw new Error("texte de l'article vide sur Europresse");
    return blocks;
}
