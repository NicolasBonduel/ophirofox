// Courrier international : les articles abonnés affichent les premiers paragraphes puis
// « Pour lire la suite de cet article, abonnez-vous » (#bloc_paywall)

ophirofoxInlineSite({
    name: "courrier-international",
    sources: ["Courrier International (site web)", "Courrier International"],
    title: "h1.article-title, h1",
    content: ".article-text",
    paragraph: ".article-text > p",
    heading: ".article-text > h2, .article-text > h3",
    newHeading: { tag: "h2", className: "ci-subtitle" },
    paywall: "#bloc_paywall",
    // Avant le bloc d'abonnement, pas dedans (il est au-dessous du fondu du texte)
    offer: ".article-secondary",
});
