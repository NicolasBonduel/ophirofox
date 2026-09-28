async function createLink() {
    const a = await ophirofoxEuropresseLink();
    a.classList.add("btn", "btn-warning", "rounded-2", "text-nowrap", "text-uppercase", "fw-bold", "fs-9", "p-05");
    return a;
}

function findPremiumBanner() {
    const title = document.querySelector('.tag-premium');
    if (!title) return null;
    return title;
}

async function onLoad() {
    const premiumBanner = findPremiumBanner();
    if (!premiumBanner) return;
    premiumBanner.appendChild(await createLink());
}

onLoad().catch(console.error);
