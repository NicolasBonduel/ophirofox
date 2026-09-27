// Sites du groupe Centre France (La République du Centre, La Montagne), même plateforme :
// « Article réservé aux abonnés » sous le titre, premiers paragraphes, puis un encadré
// (div.bg-premium-2) qui propose l'abonnement ou demande de désactiver le bloqueur de publicité

const ophirofoxInlineCentreFranceSources = {
    "www.larep.fr": ["La République du Centre (site web)", "La République du Centre"],
    "www.lamontagne.fr": ["La Montagne (site web)", "La Montagne"],
};

ophirofoxInlineSite({
    name: "centre-france",
    sources: ophirofoxInlineCentreFranceSources[window.location.hostname] || [],
    title: "h1.typo-h1, h1",
    content: "section.article",
    paragraph: "section.article > div > p.typo-p1-paragraph",
    heading: "section.article > div > h2, section.article > div > h3",
    newHeading: { tag: "h2", className: "typo-h3" },
    paywall: "div.bg-premium-2.border-premium-6",
    offer: "div.bg-premium-2.border-premium-6",

    override: {
        // L'encadré peut aussi n'être qu'un message sur le bloqueur de publicité, même sur un
        // article gratuit : on se fie à la mention sous le titre, comme la-montagne.js
        isPaywalled() {
            return Array.from(document.querySelectorAll(".typo-p2-paragraph p"))
                .some(elem => elem.textContent.trim() === "Article réservé aux abonnés");
        },
    },
});
