async function createLink() {
    return await ophirofoxEuropresseLink();
}

async function onLoad() {
    const statusElem = document.querySelector(".article-abo-tag");
    if (!statusElem) return;
    // À droite de l'étiquette « Abonnés », sur la même ligne : les deux flottent à droite, le
    // premier dans la page le plus à droite
    const buttons = document.createElement("span");
    buttons.className = "ophirofox-buttons";
    buttons.appendChild(await createLink());
    statusElem.before(buttons);
}

onLoad().catch(console.error);