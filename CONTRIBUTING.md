# Essayer l'extension dans Firefox

Pour essayer l'extension en cours de développement, suivre ce guide :

https://developer.mozilla.org/fr/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#essai

# Ajout du support d'un site de presse

- Dans le fichier `ophirofox/manifest.json`, ajouter une nouvelle entrée dans le tableau `content_scripts`.

```json
    {
      "matches": [
        "https://www.mon-nouveau-site-de-presse.fr/*"
      ],
      "js": [
        "content_scripts/config.js",
        "content_scripts/mon-nouveau-site-de-presse.js"
      ],
      "css": [
        "content_scripts/mon-nouveau-site-de-presse.css"
      ]
    },
```
- Créer les fichiers js et css correspondant, dans le répertoire `ophirofox/content_scripts`

Vous pouvez par exemple copier-coller `ophirofox/content_scripts/lemonde.js` pour servir de base.

- Trouver les mots clés du titre

Dans la méthode `extractKeywordsFromTitle`, modifier le querySelector pour correspondre au titre de l'article

- Trouver les mots clés dans l'url

Tester la regex de la méthode `extractKeywordsFromUrl` pour récupérer les mots clés de l'URL, la modifier si besoin

- Ajouter le bouton Lire sur Europress dans l'entête de l'article

Dans la méthode `onLoad`, modifier le premier querySelector pour trouver la zone où ajouter le bouton, par exemple une div d'informations sous le titre

- Ajouter un second bouton dans le paywall (fenêtre d'abonnement)

S'il y a une fenêtre paywall qui s'affiche, essayer de récupérer le bouton d'abonnement avec un querySelector et ajouter un second lien Europress avant

# Ajout du mode « Lire ici » à un site de presse

Le mode « Lire ici » complète l'article directement dans la page. Il ne fonctionne qu'avec les partenaires EZproxy (`AUTH_URL` en `…/login?url=…`), et suppose que le site a déjà son lien « Lire sur Europresse » (section précédente) : il en reprend les mots clés.

- Dans l'entrée du site dans `ophirofox/manifest.json`, ajouter après le script du site :

```json
      "js": [
        "content_scripts/config.js",
        "content_scripts/mon-nouveau-site-de-presse.js",
        "content_scripts/europresse_query.js",
        "inline/europresse.js",
        "inline/inline.js",
        "inline/site.js",
        "inline/mon-nouveau-site-de-presse.js"
      ],
      "css": [
        "content_scripts/mon-nouveau-site-de-presse.css",
        "inline/inline.css"
      ]
```

- Créer `ophirofox/inline/mon-nouveau-site-de-presse.js`, qui décrit le site avec `ophirofoxInlineSite` (voir `inline/lefigaro.js` pour un exemple simple) : sélecteurs du titre, du texte, des paragraphes, des intertitres et du paywall, éditions Europresse à privilégier. La liste complète est documentée dans `inline/site.js`.

- Si le site ne suit pas ce schéma, décrire ce qui diffère dans le même fichier : `uncover` quand le paywall recouvre la fin du texte (voir `inline/lemonde.js`), ou `override` pour remplacer n'importe quelle étape.

- Pour retirer le mode d'un site, supprimer son fichier dans `inline/` et ces lignes du manifeste.

Pour déboguer un site, filtrer la console de la page sur `Ophirofox inline · nom-du-site` (niveau « Debug » / « Verbose ») : chaque requête Europresse, les résultats classés et l'alignement du texte y sont affichés.








