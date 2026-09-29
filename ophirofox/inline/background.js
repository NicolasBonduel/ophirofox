// Mode « Lire en place » : les requêtes vers le proxy Europresse partent de la page
// d'arrière-plan pour porter les cookies de session de l'établissement. Le HTML est
// analysé par le script de contenu.

/**
 * @param {{url:string, method?:string, body?:string, contentType?:string}} request
 */
async function proxyFetch({ url, method = "GET", body, contentType }) {
  const headers = contentType ? { "Content-Type": contentType } : {};
  const options = { method, body, headers, credentials: "include" };
  try {
    const response = await fetch(url, { ...options, redirect: "follow" });
    return { status: response.status, url: response.url, html: await response.text() };
  } catch (err) {
    // Sans session, le proxy redirige vers le domaine de connexion de l'établissement, pour
    // lequel l'extension n'a pas de permission : la redirection échoue comme une erreur réseau.
    // On rejoue la requête sans suivre la redirection pour la distinguer d'une vraie panne.
    const response = await fetch(url, { ...options, redirect: "manual" });
    if (response.type === "opaqueredirect") return { status: 302, url, html: "", redirectBlocked: true };
    throw err;
  }
}

/**
 * Ouvre la connexion de l'établissement dans un onglet à côté de l'article (un onglet normal,
 * pour que les gestionnaires de mots de passe restent accessibles), et répond quand il arrive
 * sur le proxy Europresse (la session existe alors : l'onglet est fermé et on revient à
 * l'article) ou quand le lecteur le ferme. L'URL des onglets n'est visible que sur les
 * domaines autorisés, c'est-à-dire justement le proxy.
 * @param {{url:string, proxyBase:string}} request
 * @param {chrome.tabs.Tab} articleTab
 */
function loginTab({ url, proxyBase }, articleTab) {
  return new Promise(accept => {
    const done = () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      accept({ done: true });
    };
    let tabId = null;
    const onUpdated = (id, changeInfo, tab) => {
      if (id !== tabId || changeInfo.status !== "complete") return;
      if (!tab.url || !tab.url.startsWith(proxyBase)) return;
      done();
      chrome.tabs.update(articleTab.id, { active: true });
      chrome.tabs.remove(tabId);
    };
    const onRemoved = (id) => {
      if (id === tabId) done();
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    chrome.tabs.create({ url, index: articleTab.index + 1, openerTabId: articleTab.id }, (tab) => {
      tabId = tab.id;
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let task;
  if (message.type === "ophirofox-inline-fetch") {
    task = proxyFetch(message).catch(err => ({ status: 0, error: String(err) }));
  } else if (message.type === "ophirofox-inline-login") {
    task = loginTab(message, sender.tab);
  } else {
    return false;
  }
  task.then(sendResponse);
  return true;
});
