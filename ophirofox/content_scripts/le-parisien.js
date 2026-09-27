function extractKeywords() {
    return document.querySelector("h1").textContent;
}

async function createLink() {
    const a = await ophirofoxEuropresseLink(extractKeywords());
    a.classList.add();
    return a;
}

async function addEuropresseButton() {
    const head = document.querySelector("h1");
    head.after(await createLink());
}

async function onLoad() {
    // Le Parisien construit la page après le chargement : le paywall arrive plus tard, et
    // l'en-tête est recréé, ce qui retire le lien. On (ré)ajoute le lien tant qu'il manque,
    // pendant les premières secondes.
    let adding = false;
    const addIfMissing = async () => {
        if (adding || document.querySelector("a.ophirofox-europresse")) return;
        if (!document.querySelector(".article-section .paywall-abo, .btn-subscribe")) return;
        adding = true;
        try {
            await addEuropresseButton();
        } finally {
            adding = false;
        }
    };
    const observer = new MutationObserver(addIfMissing);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    setTimeout(() => observer.disconnect(), 15000);
    await addIfMissing();
}

onLoad().catch(console.error);