// Le Monde : les articles abonnés affichent les premiers paragraphes puis
// « Il vous reste X % de cet article à lire »

ophirofoxInlineSite({
    name: "lemonde",
    sources: ["Le Monde (site web)", "Le Monde"],
    title: "h1.ds-title, h1.article__title",
    content: "article.article__content, .article__content",
    paragraph: "p.article__paragraph",
    heading: "h2.article__sub-title, h3.article__chapter-title",
    newHeading: { tag: "h2", className: "article__sub-title" },
    // Le reste de section.paywall (« Nos lecteurs ont lu ensuite », publicités…) est conservé
    paywall: "p.reading-mode-only, section.paywall .lmd-paywall, #js-paywall-content .lmd-paywall",
    paywallText: /il vous reste|réservée (aux|à nos) abonnés/i,
    offer: "section.paywall .paywall__container",

    // « Article réservé aux abonnés » partage sa ligne avec « Lire plus tard » : les deux liens
    // passent sur leur propre ligne, en dessous
    links: { after: ".article__meta:has(.ds-article-status--premium)" },

    // Le paywall est remonté sur la fin de l'article (top: -57px en format long) : on ajoute
    // autant d'espace sous le texte, sans déplacer le paywall
    uncover() {
        const paywall = document.querySelector("section.paywall");
        const overlap = paywall ? -parseFloat(getComputedStyle(paywall).top) || 0 : 0;
        const content = document.querySelector("article.article__content, .article__content");
        if (overlap > 0 && content) content.style.paddingBottom = overlap + "px";
    },
});
