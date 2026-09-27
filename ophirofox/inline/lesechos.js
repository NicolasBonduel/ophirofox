// Les Échos : les articles abonnés affichent les premiers paragraphes (div.post-paywall) puis
// « Ce contenu est réservé aux abonnés » (#paywall)

ophirofoxInlineSite({
    name: "lesechos",
    sources: ["Les Echos (site web)", "Les Echos"],
    title: "h1",
    content: ".post-paywall",
    paragraph: ".post-paywall > p",
    heading: ".post-paywall > h2, .post-paywall > h3",
    newHeading: { tag: "h2", className: "ophirofox-inline-heading" },
    paywall: "#paywall",
    offer: "#paywall",

    // Le texte est recouvert d'un fondu (.post-paywall::after)
    uncover() {
        document.querySelector(".post-paywall")?.classList.add("ophirofox-inline-uncovered");
    },
});
