// L'Opinion : les articles abonnés affichent les premiers paragraphes puis le bloc
// d'abonnement (div.paywall-premium). Attention : div.paywall, lui, contient tout l'article

ophirofoxInlineSite({
    name: "lopinion",
    sources: ["L'Opinion (site web)", "L'Opinion"],
    title: "h1.Article-title, h1",
    content: ".RichTextArticleBody",
    paragraph: ".RichTextArticleBody > p",
    heading: ".RichTextArticleBody > h2, .RichTextArticleBody > h3",
    newHeading: { tag: "h2", className: "RichTextHeading" },
    // Liens vers d'autres articles, ajoutés dans le texte
    skip: /^a lire aussi\s*:/i,
    // Avec le bloc d'abonnement de Piano, en bas de la page
    paywall: ".paywall-premium, #piano_wrapper",

    // Le bloc d'abonnement dessine un fondu (::before) sur la fin du texte
    uncover() {
        document.querySelector(".paywall-premium")?.classList.add("ophirofox-inline-uncovered");
    },
});
