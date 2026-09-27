// Ouest-France : les articles premium affichent les premiers paragraphes puis
// « Lisez la suite de l'article… » (div.mur)

ophirofoxInlineSite({
    name: "ouestfrance",
    sources: ["Ouest-France (site web)", "Ouest-France"],
    title: "h1",
    content: "#article-detail .su-article",
    paragraph: "#article-detail .su-article > p:not(.chapeau)",
    heading: "#article-detail .su-article > h2, #article-detail .su-article > h3",
    newHeading: { tag: "h2", className: "" },
    // Liens vers d'autres articles, insérés entre les paragraphes
    skip: /^(à )?lire aussi\s*:/i,
    paywall: "#article-detail .mur",
    offer: "#article-detail .mur",

    // Le texte est recouvert d'un fondu (.su-article::after)
    uncover() {
        document.querySelector("#article-detail .su-article")?.classList.add("ophirofox-inline-uncovered");
    },
});
