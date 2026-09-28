// L'Humanité : les articles abonnés affichent les premiers paragraphes puis le bloc
// d'abonnement (#poool-paywall), rempli par Poool

ophirofoxInlineSite({
    name: "humanite",
    sources: ["L'Humanité (site web)", "L'Humanité"],
    title: "h1.t-article-h1, h1",
    content: "#post-content",
    paragraph: "#post-content > p",
    heading: "#post-content > h2, #post-content > h3",
    // Les intertitres du site sont des paragraphes en gras (<p><strong>)
    newHeading: { tag: "p", className: "ophirofox-inline-heading" },
    // Dans les entretiens, le premier paragraphe est une question (wp-block-huma-question)
    newParagraph: "",
    // Liens vers d'autres articles, ajoutés dans le texte
    skip: /^sur le même thème/i,
    paywall: "#poool-paywall",

    // Le bloc d'abonnement dessine un fondu (::before) sur la fin du texte
    uncover() {
        document.getElementById("poool-paywall")?.classList.add("ophirofox-inline-uncovered");
    },
});
