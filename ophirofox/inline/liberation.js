// Libération : les articles abonnés affichent le premier paragraphe puis
// « Cet article est réservé aux abonnés » (#article-body-paywall), ajouté après le chargement

ophirofoxInlineSite({
    name: "liberation",
    sources: ["Libération (site web)", "Libération"],
    title: "h1",
    content: "article[data-datawall-status]",
    paragraph: "article[data-datawall-status] p.text-element",
    heading: "article[data-datawall-status] h2.article-title",
    newHeading: { tag: "h2", className: "article-title ophirofox-inline-heading" },
    paywall: "#article-body-paywall",
    paywallText: /réservé aux abonnés/i,

    // Un bloc vide juste avant le paywall, remonté sur la fin du texte (margin-top négatif),
    // dessine le fondu et recouvre le bandeau
    uncover() {
        const fade = document.getElementById("article-body-paywall")?.previousElementSibling;
        if (fade && !fade.id && !fade.textContent.trim()) fade.style.display = "none";
    },
});
