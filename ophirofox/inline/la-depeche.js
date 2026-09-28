// La Dépêche du Midi : les articles abonnés affichent les premiers paragraphes, coupés par
// une hauteur maximale, puis « Cet article est réservé aux abonnés » (div.paywall)

ophirofoxInlineSite({
    name: "la-depeche",
    sources: ["La Dépêche du Midi (site web)", "La Dépêche du Midi"],
    title: "h1.article-full__title, h1",
    content: ".article-full__body-content",
    paragraph: ".article-full__body-content > p",
    heading: ".article-full__body-content > h2",
    newHeading: { tag: "h2", className: "txt-int" },
    paywall: ".article-full__body > div.paywall",

    // Le texte est coupé par une hauteur maximale (max-height, overflow: hidden)
    uncover() {
        const content = document.querySelector(".article-full__body-content");
        if (content) content.style.maxHeight = "none";
    },
});
