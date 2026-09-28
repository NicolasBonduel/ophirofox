// Mode « Lire ici » : construit l'adaptateur d'un site à partir de sa description
// (sélecteurs et éditions Europresse), voir inline/lemonde.js et inline/lefigaro.js

/**
 * Déclare un site pris en charge par le mode « Lire ici » et le démarre
 * @param {object} site
 * @param {string} site.name - nom court, repris dans les messages de la console
 * @param {string[]} site.sources - éditions Europresse à privilégier, par ordre de préférence
 * (début du nom de la source, l'édition web en premier : elle correspond le mieux au site)
 * @param {string} site.title - titre de l'article
 * @param {string} site.content - conteneur du texte de l'article
 * @param {string} site.paragraph - paragraphes du texte (aussi utilisé pour ceux ajoutés)
 * @param {string} site.heading - intertitres du texte
 * @param {RegExp} [site.skip] - paragraphes qui ne font pas partie de l'article (liens
 * « Lire aussi »…), ignorés sur la page comme dans le texte d'Europresse
 * @param {{tag:string, className:string}} site.newHeading - intertitre ajouté quand la page
 * n'en a pas pour servir de modèle
 * @param {string} [site.newParagraph] - classes des paragraphes ajoutés, quand celles du premier
 * paragraphe de la page ne conviennent pas (classe propre au premier paragraphe…)
 * @param {string} site.paywall - éléments du paywall, retirés une fois le texte complété
 * @param {RegExp} [site.paywallText] - si présent, seuls les éléments de site.paywall dont le
 * texte correspond comptent
 * @param {string|null} [site.offer] - conteneur en haut duquel placer le bandeau ; par défaut,
 * le premier élément de site.paywall ; null pour le placer après le texte visible
 * @param {() => void} [site.uncover] - retire ce qui recouvre la fin du texte visible (fondu,
 * paywall remonté…), appelé avant d'afficher le bandeau ou l'état du chargement
 * @param {object} [site.override] - méthodes de l'adaptateur à remplacer pour un site qui ne
 * suit pas ce schéma (voir ophirofoxInlineStart pour la liste), par exemple render,
 * visibleParagraphs ou placeLink ; `this` y désigne l'adaptateur
 */
function ophirofoxInlineSite(site) {
    ophirofoxInlineSiteName = site.name;
    const content = () => document.querySelector(site.content);
    const title = () => document.querySelector(site.title);
    const blocks = () => content().querySelectorAll(`${site.paragraph}, ${site.heading}`);
    const paywall = () => Array.from(document.querySelectorAll(site.paywall))
        .filter(elem => !site.paywallText || site.paywallText.test(elem.textContent));

    const adapter = {
        isArticle: () => !!title() && !!content(),

        isPaywalled: () => paywall().length > 0,

        article: () => ({
            // Sert à classer les résultats ; la recherche utilise les mots clés d'Ophirofox
            title: title().textContent.replace(/\s+/g, " ").trim(),
            sources: site.sources,
        }),

        captions: () => Array.from(document.querySelectorAll("figcaption")).map(elem => elem.textContent),

        ignore: text => !!site.skip && site.skip.test(text.trim()),

        visibleParagraphs: () => Array.from(blocks()).map(elem => elem.textContent)
            .filter(text => !adapter.ignore(text)),

        insertionPoint() {
            const all = blocks();
            return all[all.length - 1] || content().lastElementChild;
        },

        placeOffer(offer) {
            const container = site.offer === undefined ? paywall()[0] :
                site.offer && document.querySelector(site.offer);
            adapter.uncover();
            if (container) container.prepend(offer);
            else adapter.insertionPoint().after(offer);
        },

        // « Lire ici » à côté du lien d'Ophirofox, avec les mêmes classes
        placeLink: (europresseLink, link) => europresseLink.after(link),

        uncover: site.uncover || (() => { }),

        unlock() {
            paywall().forEach(elem => elem.remove());
            content().classList.add("ophirofox-inline-unlocked");
        },

        replaceLastParagraph(text) {
            const paragraphs = content().querySelectorAll(site.paragraph);
            if (paragraphs.length) paragraphs[paragraphs.length - 1].textContent = text;
        },

        render(block) {
            let elem;
            if (block.type === "heading") {
                // Selon le gabarit, les intertitres ne sont pas toujours les mêmes : on reprend
                // ceux de la page s'il y en a
                const pageHeading = content().querySelector(site.heading);
                elem = document.createElement(pageHeading?.tagName || site.newHeading.tag);
                elem.className = pageHeading?.className || site.newHeading.className;
            } else {
                const pageParagraph = content().querySelector(site.paragraph);
                elem = document.createElement(pageParagraph?.tagName || "p");
                elem.className = site.newParagraph ?? pageParagraph?.className ?? "";
            }
            elem.textContent = block.text;
            return elem;
        },
    };

    Object.assign(adapter, site.override);
    ophirofoxInlineStart(adapter).catch(console.error);
}
