// Construction de la requête Europresse, partagée entre europresse_search.js (recherche
// dans l'onglet Europresse) et le mode « Lire en place » (recherche en arrière-plan)

/**
 * Nettoie les mots clés pour le moteur de recherche d'Europresse
 * @param {string} search_terms
 * @returns {string}
 */
function ophirofoxSearchKeywords(search_terms) {
    const stopwords = new Set(['d', 'l', 'et', 'sans', 'or', 'par']);
    /*
        L = { Lu , Ll , Lt , Lm , Lo }
        M = { Mn , Mc , Me }
        Nd: a decimal digit
        Unicode specification: https://www.unicode.org/reports/tr44/#General_Category_Values
        Categories browser: https://www.compart.com/fr/unicode/category
    */
    return search_terms
        .replace(/œ/g, 'oe')
        .split(/[^\p{L}\p{M}\p{Nd}]+/u)
        .filter(w => !stopwords.has(w))
        .join(' ');
}

/**
 * Valeur du filtre de date d'Europresse (DateFilter.DateRange) couvrant la date de publication
 * @param {string} published_time - date de publication (i.e. 2024-08-27), ou vide
 * @returns {number}
 */
function ophirofoxDateRange(published_time) {
    if (!published_time) return 9; // Full expand the time range

    const publishedDate = new Date(published_time);
    publishedDate.setUTCHours(0, 0, 0, 0); // Europresse saves the exact UTC date, but "depuis X jours" is based on midnight
    const currentDate = new Date();

    const timeDifference = currentDate.getTime() - publishedDate.getTime();
    // Rounds up for tolerance to be sure to not filtering badly
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    switch (true) {
        case (daysDifference <= 1):
            return 2; // Depuis hier
        case (daysDifference <= 3):
            return 11; // Depuis 3 jours
        case (daysDifference <= 7):
            return 3; // Depuis 7 jours
        case (daysDifference <= 30):
            return 4; // Depuis 30 jours
        case (daysDifference <= 90):
            return 5; // Depuis 3 mois
        case (daysDifference <= 180):
            return 6; // Depuis 6 mois
        case (daysDifference <= 365):
            return 7; // Depuis 1 an
        case (daysDifference <= 730):
            return 8; // Depuis 2 ans
        default:
            return 9; // Dans toutes les archives
    }
}

/**
 * Premiers mots significatifs du chemin d'une URL d'article, sans les identifiants
 * (…-mortifere_6783475_3232.html, …-20260925, …-5a440ca0-b1a6-11f1-926d-8837bd37b66e).
 * L'URL garde souvent le titre d'origine, celui d'Europresse, quand le site a changé le sien.
 * @param {string} url
 * @returns {string} vide si l'URL n'en contient pas assez
 */
function ophirofoxUrlKeywords(url) {
    let pathname = "";
    try {
        pathname = new URL(url).pathname;
    } catch (_) {
        return "";
    }
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    const words = slug
        .replace(/\.html?$/, "")
        .replace(/-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/, "")
        .replace(/(_\d+)+$|-\d{6,}$/, "")
        .split("-")
        // Mots courts : Europresse ne les trouve pas. Une requête courte est aussi plus sûre : un
        // mot absent du titre suffit à ne rien trouver.
        .filter(word => word.length > 3 && !/^\d+$/.test(word))
        .slice(0, 5)
        // Article élidé collé au mot (« leglise ») ou mot entier (« lison ») : les deux formes
        .map(word => /^[ld][aeiouy]/.test(word) ? `(${word} OU ${word.slice(1)})` : word);
    return words.length >= 3 ? words.join(" ") : "";
}
