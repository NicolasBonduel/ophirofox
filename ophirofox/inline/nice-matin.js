// Nice-Matin : les articles abonnés affichent les premiers paragraphes, coupés par une
// hauteur fixe, puis le bloc d'abonnement (#paywall-container). La suite de la page
// (.article-blocks-deferred) est masquée : elle est retirée, le texte vient d'Europresse

ophirofoxInlineSite({
    name: "nice-matin",
    sources: ["Nice Matin (site web)", "Nice Matin"],
    title: "h1",
    content: ".qiota_reserve",
    paragraph: ".qiota_reserve > p",
    heading: ".qiota_reserve > h2",
    newHeading: { tag: "h2", className: "fs-4 fs-sm-4 text-primary fw-semibold mb-3" },
    // .qiota contient le bloc d'abonnement et le fondu (.qiota_hidden::before)
    paywall: ".qiota_reserve > .article-blocks-deferred, .qiota",

    // Les deux liens sortent de l'étiquette « Réservé aux abonnés » : à la fin de sa ligne,
    // après « Voir nos offres »
    links: { append: "div:has(> .tag-premium)" },

    override: {
        // Entre le texte et le bloc d'abonnement : le site remplace le contenu de .qiota
        // après le chargement de la page
        placeOffer(offer) {
            document.querySelector(".qiota_reserve").after(offer);
        },
    },
});
