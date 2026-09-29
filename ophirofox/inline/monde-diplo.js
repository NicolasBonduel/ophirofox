// Le Monde diplomatique : les articles abonnés affichent un aperçu (.enapercu) puis « Cet
// article est réservé aux abonnés » (.promo_dispo_article)

ophirofoxInlineSite({
    name: "monde-diplo",
    sources: ["Le Monde diplomatique (site web)", "Le Monde diplomatique"],
    title: "h1",
    content: ".texte .enapercu",
    paragraph: ".texte .enapercu > p",
    heading: ".texte .enapercu > h3",
    // Intertitres des articles de SPIP, le logiciel du site
    newHeading: { tag: "h3", className: "spip" },
    paywall: ".promo_dispo_article",
});
