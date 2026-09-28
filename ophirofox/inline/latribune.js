// La Tribune : les articles abonnés affichent les premiers paragraphes puis le bloc
// d'abonnement (#poool-widget), rempli par Poool

// Chaque paragraphe et intertitre est dans son propre div (BodyText-module…__body-text),
// et l'espace entre eux vient de ces div
const OPHIROFOX_LATRIBUNE_BLOCK = "div.contents.paywall > div[class*='body-text']";

ophirofoxInlineSite({
    name: "latribune",
    sources: ["La Tribune (site web)", "La Tribune"],
    title: "h1#article-title, h1",
    content: "div.contents.paywall",
    paragraph: `${OPHIROFOX_LATRIBUNE_BLOCK} > p`,
    heading: `${OPHIROFOX_LATRIBUNE_BLOCK} > h2`,
    newHeading: { tag: "h2", className: "" },
    // Liens vers d'autres articles, ajoutés dans le texte
    skip: /^a lire aussi/i,
    paywall: "#poool-widget",

    // Le bloc d'abonnement est remonté sur la fin du texte, avec un dégradé blanc : on le
    // remet à sa place
    uncover() {
        const widget = document.getElementById("poool-widget");
        if (!widget) return;
        Object.assign(widget.style, { top: "0", marginBottom: "0", paddingTop: "0", background: "none" });
    },

    override: {
        // Après le div du dernier paragraphe, pas dedans
        insertionPoint() {
            const blocks = document.querySelectorAll(OPHIROFOX_LATRIBUNE_BLOCK);
            return blocks[blocks.length - 1];
        },

        render(block) {
            const wrapper = document.querySelector(OPHIROFOX_LATRIBUNE_BLOCK).cloneNode(false);
            wrapper.removeAttribute("id");
            const elem = document.createElement(block.type === "heading" ? "h2" : "p");
            elem.textContent = block.text;
            wrapper.appendChild(elem);
            return wrapper;
        },
    },
});
