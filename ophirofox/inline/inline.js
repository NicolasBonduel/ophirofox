// Mode « Lire ici » : ajoute un lien à côté de « Lire sur Europresse » qui complète
// l'article dans la page. Chaque site fournit un adaptateur (voir inline/lemonde.js).
// Rien n'est demandé à Europresse avant le clic : chaque recherche et chaque article
// consulté comptent comme une consultation sur le compte de l'établissement.

// Score de titre minimal pour ouvrir un résultat. En texte intégral, le titre d'Europresse
// peut être reformulé : on est plus tolérant, la vérification du texte tranche ensuite.
// Deux titres français sans rapport obtiennent déjà environ 0,35.
const OPHIROFOX_INLINE_MIN_SCORE = { "TIT_HEAD=": 0.55, "TEXT=": 0.45 };

// Europresse reprend les articles avec un délai : un article récent peut ne pas y être encore
const OPHIROFOX_INLINE_RECENT_DAYS = 2;

// Chaque clic (« Lire ici », puis « Élargir la recherche ») fait au plus une recherche et ouvre
// au plus un article : titre et chapeau d'abord, puis texte intégral, puis son résultat suivant
const OPHIROFOX_INLINE_STEPS = ["TIT_HEAD=", "TEXT=", "TEXT="];

function ophirofoxInlineEscape(text) {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
    return String(text).replace(/[&<>"]/g, char => entities[char]);
}

/**
 * Encadré d'état, placé là où le texte visible s'arrête
 */
function ophirofoxInlineStatus(adapter) {
    let box = document.getElementById("ophirofox-inline-status");
    if (!box) {
        box = document.createElement("div");
        box.id = "ophirofox-inline-status";
        adapter.insertionPoint().after(box);
    }
    return {
        element: box,
        set(html, kind = "info") {
            box.className = `ophirofox-inline-status ophirofox-inline-${kind}`;
            box.innerHTML = html;
        },
    };
}

/**
 * Trouve où reprendre le texte d'Europresse après ce qui est déjà affiché. C'est aussi la
 * vérification que l'article est le bon : son texte doit contenir un paragraphe de la page.
 * @param {string[]} pageParagraphs paragraphes visibles sur la page
 * @param {{text:string}[]} blocks blocs de l'article Europresse
 * @returns {{start:number, replaceIndex:number|null} | null} start : premier bloc à ajouter ;
 * replaceIndex : bloc complet qui remplace le dernier paragraphe visible, s'il est tronqué ;
 * null si aucun paragraphe de la page n'est dans l'article
 */
function ophirofoxInlineAlign(pageParagraphs, blocks) {
    const normalizedBlocks = blocks.map(block => ophirofoxInlineNormalize(block.text));
    const visible = pageParagraphs.map(ophirofoxInlineNormalize).filter(text => text.length > 20);

    // On remonte depuis le dernier paragraphe visible jusqu'à en retrouver un dans Europresse
    for (let v = visible.length - 1; v >= 0; v--) {
        const paragraph = visible[v].replace(/[.…\s]+$/, "");
        const index = normalizedBlocks.findIndex(block =>
            block.includes(paragraph.slice(0, 60)) || ophirofoxInlineSimilarity(block, paragraph) > 0.8);
        if (index === -1) continue;
        const truncated = v === visible.length - 1 && normalizedBlocks[index].length > paragraph.length + 20;
        return { start: index + 1, replaceIndex: truncated ? index : null };
    }
    return null;
}

/**
 * Étape suivante de la recherche : une recherche (sauf si déjà faite), puis le meilleur
 * résultat pas encore essayé, gardé seulement si son texte contient celui de la page
 * @param {{search:object, step:number, tried:Set<string>, results:object}} attempt
 * état conservé entre les clics
 * @returns {Promise<boolean>} true si le texte a été complété
 */
async function ophirofoxInlineLoad(adapter, config, attempt) {
    document.getElementById("ophirofox-inline-offer")?.remove();
    adapter.uncover();
    const status = ophirofoxInlineStatus(adapter);
    status.set("Recherche de l'article complet sur Europresse…");
    // Le lien est dans l'en-tête de l'article : on descend là où le texte va apparaître
    status.element.scrollIntoView({ behavior: "smooth", block: "center" });
    document.documentElement.classList.add("ophirofox-inline-loading");

    try {
        const field = OPHIROFOX_INLINE_STEPS[attempt.step];
        if (!attempt.results[field]) {
            attempt.results[field] = await ophirofoxInlineSearch(field, { ...adapter.article(), ...attempt.search }, config);
        }
        const candidate = attempt.results[field].find(result =>
            !attempt.tried.has(result.href) && result.score >= OPHIROFOX_INLINE_MIN_SCORE[field]);

        if (candidate) {
            // Certaines éditions reprennent la légende et le crédit de la photo, déjà présents sur la page
            const captions = adapter.captions().map(ophirofoxInlineNormalize);
            const blocks = (await ophirofoxInlineFetchArticle(candidate)).filter(block =>
                !captions.some(caption => caption.includes(ophirofoxInlineNormalize(block.text))));
            attempt.tried.add(candidate.href);
            const alignment = ophirofoxInlineAlign(adapter.visibleParagraphs(), blocks);
            ophirofoxInlineDebug("alignement", candidate.title, alignment);
            if (alignment) {
                adapter.unlock();
                if (alignment.replaceIndex !== null) adapter.replaceLastParagraph(blocks[alignment.replaceIndex].text);
                status.element.before(...blocks.slice(alignment.start).map(block => adapter.render(block)));
                status.set(
                    `Texte complété via <a href="${ophirofoxInlineEscape(candidate.href)}" target="_blank">` +
                    `Europresse (${ophirofoxInlineEscape(candidate.source)})</a> · ${ophirofoxInlineEscape(config.name)}`,
                    "done"
                );
                document.querySelectorAll("a.ophirofox-inline-link").forEach(link => link.remove());
                return true;
            }
        }

        attempt.step++;
        const age = (Date.now() - new Date(attempt.search.publishedTime)) / (1000 * 60 * 60 * 24);
        const recent = age < OPHIROFOX_INLINE_RECENT_DAYS ?
            " Cet article est récent : il n'est peut-être pas encore sur Europresse, réessayez plus tard." : "";
        if (attempt.step < OPHIROFOX_INLINE_STEPS.length) {
            status.set(
                `Article pas encore trouvé sur Europresse.${recent} ` +
                `<button type="button" class="ophirofox-inline-button">Élargir la recherche</button>`,
                "error"
            );
            status.element.querySelector("button").onclick = () => ophirofoxInlineLoad(adapter, config, attempt);
        } else {
            status.set(`Article introuvable sur Europresse.${recent}`, "error");
        }
        return false;
    } catch (err) {
        if (err instanceof OphirofoxInlineLoginRequired) {
            ophirofoxInlineAskLogin(adapter, config, attempt, status, err.message);
            return false;
        }
        console.error("(Ophirofox inline)", err);
        status.set(`Erreur Europresse : ${ophirofoxInlineEscape(err.message)}`, "error");
        return false;
    } finally {
        document.documentElement.classList.remove("ophirofox-inline-loading");
    }
}

function ophirofoxInlineAskLogin(adapter, config, attempt, status, detail) {
    const name = ophirofoxInlineEscape(config.name);
    status.set(
        `Connexion requise (${name}) pour compléter l'article. ` +
        `<button type="button" class="ophirofox-inline-button">Se connecter</button>` +
        (detail ? `<small class="ophirofox-inline-detail">${ophirofoxInlineEscape(detail)}</small>` : ""),
        "login"
    );
    status.element.querySelector("button").onclick = async () => {
        status.set(`Connexion en cours dans l'onglet ${name}…`, "login");
        // Répond quand l'onglet de connexion arrive sur Europresse (il est alors fermé)
        // ou quand le lecteur le ferme : dans les deux cas, on réessaie
        await new Promise(accept => chrome.runtime.sendMessage({
            type: "ophirofox-inline-login",
            url: config.loginUrl,
            proxyBase: config.proxyBase,
        }, accept));
        ophirofoxInlineLoad(adapter, config, attempt);
    };
}

/**
 * Mots clés et date calculés par le script du site pour « Lire sur Europresse »
 * @param {HTMLAnchorElement} [europresseLink] - à défaut, le premier lien de la page
 */
function ophirofoxInlineSearchTerms(europresseLink) {
    europresseLink = europresseLink || document.querySelector("a.ophirofox-europresse:not(.ophirofox-inline-link)");
    return {
        keywords: europresseLink?.dataset.keywords,
        publishedTime: europresseLink?.dataset.publishedTime,
    };
}

/**
 * Bandeau en bas du texte visible, là où le paywall coupe l'article. Rien n'est demandé à
 * Europresse avant le clic : le bandeau ne sait pas si l'article y est.
 */
function ophirofoxInlineOffer(adapter, config, onClick) {
    const offer = document.createElement("div");
    offer.id = "ophirofox-inline-offer";
    offer.className = "ophirofox-inline-status ophirofox-inline-offer";
    offer.innerHTML =
        `Chercher la suite de cet article sur Europresse (${ophirofoxInlineEscape(config.name)}) ` +
        `<button type="button" class="ophirofox-inline-button">Lire ici</button>`;
    offer.querySelector("button").onclick = () => onClick(ophirofoxInlineSearchTerms());
    adapter.placeOffer(offer);
}

/**
 * Ajoute « Lire ici » après chaque lien « Lire sur Europresse » d'Ophirofox, avec les mêmes
 * classes pour que les deux se ressemblent
 */
function ophirofoxInlineAddLinks(config, onClick) {
    for (const europresseLink of document.querySelectorAll("a.ophirofox-europresse:not(.ophirofox-inline-link)")) {
        if ("ophirofoxInline" in europresseLink.dataset) continue;
        europresseLink.dataset.ophirofoxInline = "";
        const a = document.createElement("a");
        a.href = "#";
        a.className = europresseLink.className + " ophirofox-inline-link";
        a.textContent = "Lire ici";
        a.title = `Afficher la suite de l'article dans la page, via Europresse (${config.name})`;
        a.onclick = function (evt) {
            evt.preventDefault();
            onClick(ophirofoxInlineSearchTerms(europresseLink));
        };
        europresseLink.after(a);
    }
}

/**
 * Point d'entrée des adaptateurs de site
 * @param {{isArticle: () => boolean, isPaywalled: () => boolean,
 *   article: () => {title:string, sources:string[]}, captions: () => string[],
 *   visibleParagraphs: () => string[], insertionPoint: () => Element,
 *   placeOffer: (offer:Element) => void, uncover: () => void, unlock: () => void,
 *   replaceLastParagraph: (text:string) => void,
 *   render: (block:{type:string, text:string}) => Element}} adapter
 */
async function ophirofoxInlineStart(adapter) {
    if (!adapter.isArticle()) return;
    const config = await ophirofoxInlineConfig();
    ophirofoxInlineDebug("partenaire", config);
    // Partenaire non pris en charge : seul le lien habituel est affiché
    if (!config) return;

    let loading = false;
    let attempt = null;
    const load = async (search) => {
        if (loading) return;
        loading = true;
        const links = () => document.querySelectorAll("a.ophirofox-inline-link");
        links().forEach(link => link.textContent = "Chargement…");
        // En cas de succès, ophirofoxInlineLoad retire les liens
        // Un nouveau clic sur « Lire ici » reprend là où la recherche s'est arrêtée
        if (!attempt || attempt.step >= OPHIROFOX_INLINE_STEPS.length) {
            attempt = { search, step: 0, tried: new Set(), results: {} };
        }
        if (!await ophirofoxInlineLoad(adapter, config, attempt)) {
            links().forEach(link => link.textContent = "Lire ici");
        }
        loading = false;
    };

    // Le paywall et les liens d'Ophirofox apparaissent après le chargement de la page
    let offered = false;
    const addLinks = () => {
        if (!adapter.isPaywalled()) return;
        if (!offered) {
            offered = true;
            ophirofoxInlineOffer(adapter, config, load);
        }
        ophirofoxInlineAddLinks(config, load);
    };
    const observer = new MutationObserver(addLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
    addLinks();
}
