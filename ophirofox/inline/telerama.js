// Télérama : les articles abonnés affichent les premiers paragraphes puis
// « Cet article est réservé aux abonnés » (section.paywall)

ophirofoxInlineSite({
    name: "telerama",
    sources: ["Télérama (site web)", "Télérama"],
    title: "h1#title_article, h1",
    content: "section.article-body",
    paragraph: "section.article-body > p.paragraph",
    heading: "section.article-body > h2, section.article-body > h3",
    newHeading: { tag: "h3", className: "heading" },
    // Lien ajouté par Europresse dans le texte des articles du site
    skip: /^mettre télérama en favori/i,
    paywall: "section.paywall",

    // Le bloc d'abonnement dessine un fondu (::before) sur la fin du texte
    uncover() {
        document.querySelector("section.paywall")?.classList.add("ophirofox-inline-uncovered");
    },
});
