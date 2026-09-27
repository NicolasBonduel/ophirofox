// Adaptateur Le Monde : les articles abonnés affichent les premiers paragraphes puis
// « Il vous reste X % de cet article à lire »

const ophirofoxInlineLemonde = {
    content() {
        return document.querySelector("article.article__content, .article__content");
    },

    title() {
        return document.querySelector("h1.ds-title, h1.article__title");
    },

    // « Il vous reste X % de cet article à lire » et les blocs d'abonnement. Le reste de
    // section.paywall (« Nos lecteurs ont lu ensuite », publicités…) est conservé.
    teasers() {
        const remaining = Array.from(document.querySelectorAll("p.reading-mode-only"))
            .filter(elem => /il vous reste|réservée aux abonnés/i.test(elem.textContent));
        const subscribe = Array.from(document.querySelectorAll("section.paywall .lmd-paywall, #js-paywall-content .lmd-paywall"));
        return remaining.concat(subscribe);
    },

    blocks() {
        return this.content().querySelectorAll("p.article__paragraph, h2.article__sub-title, h3.article__chapter-title");
    },

    isArticle() {
        return !!this.title() && !!this.content();
    },

    isPaywalled() {
        return this.teasers().length > 0;
    },

    article() {
        return {
            // Sert à classer les résultats ; la recherche utilise les mots clés d'Ophirofox
            title: this.title().textContent.replace(/\s+/g, " ").trim(),
            // L'édition web correspond le mieux au texte du site
            sources: ["Le Monde (site web)", "Le Monde"],
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
        return blocks[blocks.length - 1] || this.content().lastElementChild;
    },

    // En haut du paywall, redescendu pour ne pas recouvrir la fin du texte visible
    placeOffer(offer) {
        const paywall = document.querySelector("section.paywall .paywall__container");
        if (paywall) {
            this.uncover();
            paywall.prepend(offer);
        } else {
            this.insertionPoint().after(offer);
        }
    },

    // Le paywall est remonté sur la fin de l'article (top: -57px en format long) : on ajoute
    // autant d'espace sous le texte pour que l'état du chargement, puis le texte ajouté,
    // restent visibles, sans déplacer le paywall
    uncover() {
        const paywall = document.querySelector("section.paywall");
        const overlap = paywall ? -parseFloat(getComputedStyle(paywall).top) || 0 : 0;
        if (overlap > 0) this.content().style.paddingBottom = overlap + "px";
    },

    unlock() {
        this.teasers().forEach(elem => elem.remove());
        this.content().classList.add("ophirofox-inline-unlocked");
    },

    replaceLastParagraph(text) {
        const paragraphs = this.content().querySelectorAll("p.article__paragraph");
        if (paragraphs.length) paragraphs[paragraphs.length - 1].textContent = text;
    },

    render(block) {
        let elem;
        if (block.type === "heading") {
            // Selon le gabarit : h2.article__sub-title ou h3.article__chapter-title
            const pageHeading = this.content().querySelector("h2.article__sub-title, h3.article__chapter-title");
            elem = document.createElement(pageHeading?.tagName || "h2");
            elem.className = pageHeading?.className || "article__sub-title";
        } else {
            elem = document.createElement("p");
            elem.className = "article__paragraph";
        }
        elem.textContent = block.text;
        return elem;
    },
};

ophirofoxInlineStart(ophirofoxInlineLemonde).catch(console.error);
