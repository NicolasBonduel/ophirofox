// La Voix du Nord : les articles abonnés affichent le premier paragraphe, sous un fondu, puis
// « Article réservé aux abonnés » (.qiota_reserve)

ophirofoxInlineSite({
    name: "lavdn",
    sources: ["La Voix du Nord (site web)", "La Voix du Nord"],
    title: "h1",
    content: "r-article--section.-has-paywall",
    paragraph: "r-article--section.-has-paywall > p",
    heading: "r-article--section.-has-paywall > h2",
    newHeading: { tag: "h2", className: "" },
    // .qiota contient le fondu du bloc d'abonnement (.qiota_hidden), qui déborde vers le haut
    paywall: ".qiota_reserve, .qiota",
    // Après le texte : le bloc d'abonnement est coupé par une hauteur fixe
    offer: null,

    override: {
        // L'en-tête est une grille, un bouton par ligne : les deux liens partagent un conteneur
        // pour être côte à côte
        placeLink(europresseLink, link) {
            const box = document.createElement("div");
            europresseLink.before(box);
            box.append(europresseLink, link);
        },
    },
});
