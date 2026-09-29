// Sciences et Avenir : les articles abonnés affichent le début du texte (.amorce) puis le bloc
// d'abonnement (#poool-widget). La suite de la page (.user-paying-content) est masquée : elle
// est retirée, le texte vient d'Europresse

ophirofoxInlineSite({
    name: "sciencesetavenir",
    sources: ["Sciences et Avenir (site web)", "Sciences et Avenir"],
    title: "h1",
    content: ".corps > .amorce",
    paragraph: ".corps > .amorce > p",
    heading: ".corps > .amorce > h2",
    newHeading: { tag: "h2", className: "" },
    paywall: "#poool-widget, .corps > .user-paying-content",
    // En haut du bloc d'abonnement, pas dans la suite masquée
    offer: "#poool-widget",

    // « Abonnés » reste sur la ligne de l'auteur : les deux liens passent en dessous
    links: { after: ".article-abo-tag" },
});
