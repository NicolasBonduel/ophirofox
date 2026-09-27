// Adaptateur Le Figaro : les articles abonnés affichent les premiers paragraphes puis
// « Cet article est réservé aux abonnés. Il vous reste X % à découvrir. »

const ophirofoxInlineLefigaro = {
    content() {
        return document.querySelector(".fig-content-body");
    },

    title() {
        return document.querySelector("h1.fig-headline, h1");
    },

    paywall() {
        return document.getElementById("fig-premium-paywall");
    },

    blocks() {
        return this.content().querySelectorAll("p.fig-paragraph, h2, h3");
    },

    isArticle() {
        return !!this.title() && !!this.content();
    },

    isPaywalled() {
        return !!this.paywall();
    },

    article() {
        return {
            // Sert à classer les résultats ; la recherche utilise les mots clés d'Ophirofox
            title: this.title().textContent.replace(/\s+/g, " ").trim(),
            // L'édition web correspond le mieux au texte du site
            sources: ["Le Figaro (site web)", "Le Figaro"],
        };
    },

    captions() {
        return Array.from(document.querySelectorAll("figcaption")).map(elem => elem.textContent);
    },

    visibleParagraphs() {
        return Array.from(this.blocks()).map(elem => elem.textContent);
    },

    insertionPoint() {
        const blocks = this.blocks();
        return blocks[blocks.length - 1] || this.content().firstElementChild;
    },

    // Juste avant le bloc d'abonnement, qui ne recouvre pas le texte
    placeOffer(offer) {
        const paywall = this.paywall();
        if (paywall) paywall.before(offer);
        else this.insertionPoint().after(offer);
    },

    uncover() { },

    unlock() {
        this.paywall()?.remove();
    },

    replaceLastParagraph(text) {
        const paragraphs = this.content().querySelectorAll("p.fig-paragraph");
        if (paragraphs.length) paragraphs[paragraphs.length - 1].textContent = text;
    },

    render(block) {
        let elem;
        if (block.type === "heading") {
            // Intertitre de la page s'il y en a un, sinon celui des articles du Figaro
            const pageHeading = this.content().querySelector("h2, h3");
            elem = document.createElement(pageHeading?.tagName || "h2");
            elem.className = pageHeading?.className || "fig-body-heading ophirofox-inline-heading";
        } else {
            elem = document.createElement("p");
            elem.className = "fig-paragraph";
        }
        elem.textContent = block.text;
        return elem;
    },
};

ophirofoxInlineStart(ophirofoxInlineLefigaro).catch(console.error);
