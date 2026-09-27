async function consumeRequestType() {
    return new Promise((accept, reject) => {
        chrome.storage.local.get("ophirofox_request_type",
            (r) => {
                accept(r.ophirofox_request_type);
                chrome.storage.local.remove("ophirofox_request_type");
            });
    })
}

async function consumeReadRequest() {
    return new Promise((accept, reject) => {
        chrome.storage.local.get("ophirofox_read_request",
            (r) => {
                accept(r.ophirofox_read_request);
                chrome.storage.local.remove("ophirofox_read_request");
            });
    })
}

async function consumeReadPDFRequest() {
    return new Promise((accept, reject) => {
        chrome.storage.local.get("ophirofox_readPDF_request",
            (r) => {
                accept(r.ophirofox_readPDF_request);
                chrome.storage.local.remove("ophirofox_readPDF_request");
            });
    })
}

async function hasConsumable() {
    return new Promise((accept, reject) => {
        chrome.storage.local.get(
            ["ophirofox_request_type", "ophirofox_readPDF_request"],
            (result) => {
                // Vérifie si l'une des deux clés existe et contient une valeur
                const hasRequestType = result.ophirofox_request_type !== undefined;
                const hasReadPDFRequest = result.ophirofox_readPDF_request !== undefined;
                
                // Retourne true si au moins une des clés existe avec une valeur
                accept(hasRequestType || hasReadPDFRequest);
            }
        );
    });
}

async function loadRead(){
    const path = window.location.pathname;
    const { search_terms, published_time } = await consumeReadRequest();
    if (!search_terms) return;
    
    const keywords = ophirofoxSearchKeywords(search_terms);
    const keyword_field_id = path.startsWith("/Search/Result") ? "NativeQuery" : "Keywords";
    const keyword_field = document.getElementById(keyword_field_id);
    keyword_field.value = 'TIT_HEAD=' + keywords;

    // Looking for a time range
    const date_filter = document.getElementById("DateFilter_DateRange");

    if (date_filter) {
        date_filter.value = ophirofoxDateRange(published_time);
    }
    keyword_field.form.submit();
}

async function loadReadPDF(){
    const { media_id, published_time } = await consumeReadPDFRequest();
    window.location = window.location.origin + `/PDF/EditionDate?sourceCode=${media_id}&singleDate=${published_time}&useFuzzyDate=false`;
}

async function onLoad() {
    await getSettings();
    await ophirofoxRealoadOnExpired();
    const path = window.location.pathname;

    if (!(
        path.startsWith("/Search/Reading") ||
        path.startsWith("/Search/Advanced") ||
        path.startsWith("/Search/AdvancedMobile") ||
        path.startsWith("/Search/Express") ||
        path.startsWith("/Search/Simple") ||
        path.startsWith("/Search/Result") ||
        path.startsWith("/Search/ResultMobile") || 
        path === "/Pdf"
    )) return;

    // Vérifier si on a un origin_url récent dans le tracking (non-consumé)
    const originTracking = await new Promise(resolve => {
        chrome.storage.local.get("ophirofox_origin_tracking", (r) => resolve(r.ophirofox_origin_tracking));
    });
    
    if (originTracking && originTracking.origin_url && originTracking.timestamp) {
        const age = Date.now() - originTracking.timestamp;
        const TTL = 60 * 1000; // 60 secondes
        
        if (age < TTL) {
            // Timestamp encore valide, injecter origin_url dans le <head>
            const meta = document.createElement('meta');
            meta.name = 'ophirofox-origin-url';
            meta.content = originTracking.origin_url;
            document.head.appendChild(meta);
        } else {
            // Expiré, nettoyer
            chrome.storage.local.remove("ophirofox_origin_tracking");
        }
    }

    if (!await hasConsumable()) {
        console.log("(Ophirofox) No consumable found.");
        if (path.startsWith("/Search/Result")) {
            const numberOfResul = document.querySelector('.resultOperations-count').textContent;
            if (numberOfResul === '1') {
                if (current_settings.auto_open_link) {
                    await readWhenOnlyOneResult();
                }
            } else if (numberOfResul === '0') {
                const query = document.querySelector('#Keywords');
                if (query.value.startsWith('TIT_HEAD=')) {
                    query.value = query.value.replace('TIT_HEAD=', 'TEXT=');
                    const butonSearch = document.querySelector('#btnSearch');
                    butonSearch.click();
                }
            }
        }
        return;
    }

    if (path === '/Pdf') {
        window.location.pathname = '/Search/Reading';
        return;
    }

    const request = await consumeRequestType();
    if (request && request.type) {
        const { type } = request;
        console.log("request_type", type);
        if (type === "readPDF") {
            await loadReadPDF();
        } else {
            await loadRead();
        }
    } else {
        console.error("consumeRequestType() returned undefined or an object without a 'type' property.");
    }
}
async function ophirofoxRealoadOnExpired() {
    const params = new URLSearchParams(window.location.search)
    if (params.get("ErrorCode") === "4000112") {
        // session expiréele
        window.location = current_settings.partner_AUTH_URL;
    }
}

async function waitForElement(selector, callback, attempts = 0, maxAttempts = 10) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
        return true; // Indique que l'élément a été trouvé
    } else if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Attendre 0.5 seconde avant de réessayer
        return waitForElement(selector, callback, attempts + 1, maxAttempts);
    } else {
        console.error('Element not found after maximum attempts');
        return false; // Indique que l'élément n'a pas été trouvé
    }
}

function readWhenOnlyOneResult() {
    const observer = new MutationObserver(async () => {
        const found = await waitForElement('a.docList-links', (linkElement) => {
            console.log("linkElement", linkElement);
            linkElement.click();
        });
        if (found) {
            observer.disconnect(); // Arrêter l'observation une fois l'élément trouvé et cliqué
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

const DEFAULT_SETTINGS = {
    partner_name: "Pas d'intermédiaire",
    partner_AUTH_URL: "https://nouveau.europresse.com/Login",
    open_links_new_tab: false,
    auto_open_link: false,
    add_search_menu: false,
};

let current_settings = DEFAULT_SETTINGS;

const OPHIROFOX_SETTINGS_KEY = "ophirofox_settings";

/**
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
async function getSettings() {
    const key = OPHIROFOX_SETTINGS_KEY;
    return new Promise((accept) => {
        chrome.storage.local.get([key], function (result) {
            if (result.hasOwnProperty(key)) {
                current_settings = JSON.parse(result[key]);
                accept(current_settings);
            }
            else accept(DEFAULT_SETTINGS);
        });
    });
}

onLoad();
