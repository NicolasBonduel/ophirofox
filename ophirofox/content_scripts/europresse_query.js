// Construction de la requête Europresse, partagée entre europresse_search.js (recherche
// dans l'onglet Europresse) et le mode « Lire ici » (recherche en arrière-plan)

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
