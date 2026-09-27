// Le Figaro : les articles abonnés affichent les premiers paragraphes puis
// « Cet article est réservé aux abonnés. Il vous reste X % à découvrir. »

ophirofoxInlineSite({
    name: "lefigaro",
    sources: ["Le Figaro (site web)", "Le Figaro"],
    title: "h1.fig-headline, h1",
    content: ".fig-content-body",
    paragraph: "p.fig-paragraph",
    heading: ".fig-content-body h2, .fig-content-body h3",
    newHeading: { tag: "h2", className: "fig-body-heading ophirofox-inline-heading" },
    paywall: "#fig-premium-paywall",
    offer: "#fig-premium-paywall",

    // Le bloc d'abonnement dessine un fondu (::before) sur la fin du texte
    uncover() {
        document.getElementById("fig-premium-paywall")?.classList.add("ophirofox-inline-uncovered");
    },
});
