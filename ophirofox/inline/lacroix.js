// La Croix : les articles abonnés affichent les premiers paragraphes puis le bloc
// d'abonnement (div.paywall), rempli par Poool

ophirofoxInlineSite({
    name: "lacroix",
    sources: ["La Croix (site web)", "La Croix"],
    title: "h1.article-title, h1",
    content: ".article-content",
    paragraph: ".article-content > p.article-paragraph",
    heading: ".article-content > h2, .article-content > h3",
    newHeading: { tag: "h2", className: "heading" },
    // Dans les entretiens, le premier paragraphe est une question (article-paragraph--question)
    newParagraph: "article-paragraph",
    paywall: ".article-content > .paywall",

    // Le fondu est sur le dernier paragraphe du texte coupé (article-content--excerpt) : il
    // passerait sur le dernier paragraphe ajouté
    uncover() {
        document.querySelector(".article-content--excerpt")?.classList.remove("article-content--excerpt");
    },
});
