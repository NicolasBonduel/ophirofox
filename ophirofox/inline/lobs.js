// L'Obs : les articles abonnés affichent les premiers paragraphes puis le bloc
// « Article réservé aux abonnés. » (div.paywall2025)

ophirofoxInlineSite({
    name: "lobs",
    sources: ["Le Nouvel Obs (site web)", "Le Nouvel Obs", "L'Obs"],
    title: "h1",
    content: ".article-page__body .content",
    paragraph: ".article-page__body .content > p.node__paragraphe",
    heading: ".article-page__body .content > h2, .article-page__body .content > h3",
    newHeading: { tag: "h2", className: "node__heading latino-800m latino-lg-1400e text-grey-800 pb-8 pb-md-16" },
    paywall: ".paywall2025",
    // L'en-tête est une colonne, un lien par ligne : les deux liens partagent un conteneur
    // pour être côte à côte
    links: {},

    // Le bloc d'abonnement dessine un fondu (::before) sur la fin du texte
    uncover() {
        document.querySelector(".paywall2025")?.classList.add("ophirofox-inline-uncovered");
    },
});
