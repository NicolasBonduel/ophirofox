// Le Parisien : les articles abonnés affichent les premiers paragraphes, répartis dans
// plusieurs section.content, puis « S'abonner pour lire la suite » (div.paywall)

ophirofoxInlineSite({
    name: "le-parisien",
    sources: ["Le Parisien (site web)", "Le Parisien", "Aujourd'hui en France"],
    title: "h1",
    content: ".article-section",
    paragraph: ".article-section section.content > p",
    heading: ".article-section section.content > h2, .article-section section.content > h3",
    newHeading: { tag: "h2", className: "ophirofox-inline-heading" },
    paywall: ".article-section div.paywall",
    offer: ".article-section div.paywall",
});
