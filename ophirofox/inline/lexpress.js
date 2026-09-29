// L'Express : les articles abonnés affichent le premier paragraphe puis le bloc d'abonnement
// (#container-subscribe), rempli par Piano

ophirofoxInlineSite({
    name: "lexpress",
    sources: ["L'Express (site web)", "L'Express"],
    title: "h1.article__title, h1",
    content: ".article__text > article",
    paragraph: ".article__text > article p.article-body-paragraph",
    heading: ".article__text > article > h2, .article__text > article > h3",
    newHeading: { tag: "h2", className: "article-body-subheading" },
    // Le premier paragraphe a aussi une classe qui lui est propre (article-body-paragraph--first)
    newParagraph: "paragraph article-body-paragraph article__item",
    // Avec la barre d'abonnement en bas de l'écran, qui est aussi sur les articles gratuits :
    // ceux-ci n'ont pas de lien Ophirofox, donc pas de « Compléter »
    paywall: "#container-subscribe.paywall-container--active, .piano-bottom-bar-container",
    // Piano dessine son bloc par-dessus le haut de #container-subscribe : le bandeau va après
    // le dernier paragraphe, avant ce bloc
    offer: null,

    // Le bloc d'abonnement dessine un fondu (::before) sur la fin du texte
    uncover() {
        document.getElementById("container-subscribe")?.classList.add("ophirofox-inline-uncovered");
    },
});
