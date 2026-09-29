// Challenges : les articles abonnés affichent le premier paragraphe puis « La suite de cet
// article est réservée aux abonnés » (#poool-widget)

ophirofoxInlineSite({
    name: "challenges",
    sources: ["Challenges (site web)", "Challenges"],
    title: "h1",
    content: ".domain-ui-node-content--article > div",
    paragraph: ".domain-ui-node-content--article > div > p",
    heading: ".domain-ui-node-content--article > div > h2",
    newHeading: { tag: "h2", className: "" },
    // Le premier paragraphe a une lettrine (upper-letter)
    newParagraph: "",
    paywall: "#poool-widget",
});
