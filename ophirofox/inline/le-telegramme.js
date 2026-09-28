// Le Télégramme : les articles abonnés affichent les premiers paragraphes puis le bloc
// d'abonnement (#tlg-paywall-container). La suite de la page (.tlg-paywalled) est masquée :
// on ne s'en sert pas, le texte vient d'Europresse

const OPHIROFOX_TELEGRAMME_TEXT = ".tlg-detail-article--content:not(.tlg-paywalled)";

ophirofoxInlineSite({
    name: "le-telegramme",
    sources: ["Le Télégramme (Bretagne) (site web)", "Le Télégramme"],
    title: "h1.tlg-h1, h1",
    content: OPHIROFOX_TELEGRAMME_TEXT,
    paragraph: `${OPHIROFOX_TELEGRAMME_TEXT} > p`,
    heading: `${OPHIROFOX_TELEGRAMME_TEXT} > h2`,
    newHeading: { tag: "h2", className: "" },
    paywall: "#tlg-paywall-container",
});
