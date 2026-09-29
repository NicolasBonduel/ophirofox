// Sud Ouest : les articles abonnés affichent le chapeau et le premier paragraphe, puis le
// bloc d'abonnement (#poool-widget), rempli par Poool

ophirofoxInlineSite({
    name: "sudouest",
    sources: ["Sud Ouest (site web)", "Sud Ouest"],
    title: "h1.page-title, h1",
    content: ".poool-content",
    // Le texte est en double : .visible-not-premium est masqué
    paragraph: ".poool-content .excerpt p, .poool-content .visible-premium > p",
    heading: ".poool-content .visible-premium > h2",
    newHeading: { tag: "h2", className: "article-subtitle" },
    paywall: "#poool-widget",
    // Sous la pastille « Réservé aux abonnés », pas dedans
    links: { after: ".badge-premium" },
});
