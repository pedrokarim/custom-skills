# Piloter la Search Console et Bing Webmaster Tools avec le MCP `brave`

Tout ce qui suit a été vérifié en octobre 2026, interface de la Search Console en français.
Les interfaces de Google et de Microsoft changent : si un sélecteur ne trouve plus rien,
prendre un `take_snapshot` et chercher l'élément par son libellé.

## Mise en route

- Outils : `mcp__brave__*` (`new_page`, `navigate_page`, `evaluate_script`, `take_snapshot`,
  `fill`, `click`, `press_key`, `wait_for`, `take_screenshot`, `emulate`, `list_pages`,
  `close_page`, `list_network_requests`).
- Ouvrir un onglet **en arrière-plan** : `new_page { url, background: true }`. La première
  navigation dépasse souvent le délai de 10 s ; `list_pages` montre que l'onglet est quand
  même ouvert, avec son identifiant.
- Préférer `evaluate_script` pour lire (`document.body.innerText`) : plus court qu'un
  `take_snapshot`. Garder le snapshot pour trouver un `uid` à remplir ou cliquer, et
  l'écrire dans un fichier (`filePath`) puis le parcourir avec `grep` : il est long.
- **`sourcePath` ne marche pas pour les scripts du skill** : le MCP refuse tout fichier hors
  des dossiers de travail de la session (« not within any of the configured workspace
  roots »). Lire le fichier, puis passer son contenu tel quel dans `function`.
- Passer `waitForStableDom: false` aux scripts qui attendent eux-mêmes (boucles avec
  `setTimeout`) : sinon l'outil attend en plus une stabilité qui ne vient jamais sur ces
  applications.
- Refermer l'onglet à la fin. Ne jamais toucher aux autres onglets de l'utilisateur.

## Search Console

### Le compte

Les adresses portent un index de compte : `https://search.google.com/u/<N>/search-console…`.
`N` dépend de l'ordre des comptes Google connectés dans le navigateur. Si la page affiche « Bienvenue » ou une liste vide, essayer un autre `N` avant de
conclure qu'il n'y a pas de propriété, puis demander à l'utilisateur.

### Adresses directes

`<R>` = identifiant de propriété encodé : `https%3A%2F%2Fexemple.com%2F` (préfixe d'URL) ou
`sc-domain%3Aexemple.com` (domaine).

| Rapport | Adresse |
|---|---|
| Vue d'ensemble | `/u/N/search-console?resource_id=<R>` |
| Indexation des pages | `/u/N/search-console/index?resource_id=<R>` |
| Pages indexées (historique) | `/u/N/search-console/index/drilldown?resource_id=<R>&pages=ALL_URLS` |
| Sitemaps | `/u/N/search-console/sitemaps?resource_id=<R>` |
| Performances | `/u/N/search-console/performance/search-analytics?resource_id=<R>&num_of_days=28` |
| Liens | `/u/N/search-console/links?resource_id=<R>` |
| Actions manuelles | `/u/N/search-console/manual-actions?resource_id=<R>` |
| Suppressions | `/u/N/search-console/removals?resource_id=<R>` |

**L'inspection d'URL ne s'ouvre pas par adresse** : `/search-console/inspect?…&id=<url>`
renvoie une 404. Passer par le champ de recherche en haut de page.

### Inspecter, tester, demander l'indexation

Le champ : `input[aria-label^="Inspecter"]`. Le remplir puis envoyer `Enter`. Les boutons se
trouvent par leur texte : « TESTER L'URL ACTIVE », « Demander une indexation ».

`scripts/gsc-batch.js` enchaîne ces gestes sur une liste d'URL. Deux appels :

```js
// 1. poser la tâche (evaluate_script, format "function")
() => { window.__gscJob = { mode: "test", urls: ["https://exemple.com/", "https://exemple.com/about"] }; }
// mode : "test" (Tester l'URL active) ou "request" (Demander une indexation)

// 2. lancer le script : evaluate_script avec le CONTENU de gsc-batch.js dans `function`,
//    waitForStableDom: false. Il rend { url: verdict } pour chaque URL.
```

Le test en ligne prend 30 s à 2 min par URL ; la demande d'indexation commence par le même
test. Compter large.

Réponses possibles :

| Message | Sens |
|---|---|
| « Google a accès à cette URL » | la page est lisible et indexable |
| « Indexation demandée … file d'attente d'exploration prioritaire » | c'est fait ; renvoyer la même URL ne change rien |
| « Un problème est survenu. Si le problème persiste, réessayez dans quelques heures » | sur **une seule page, à chaque fois** : la page (poids, rendu). Tester une page légère pour trancher |
| un message de quota (libellé exact non relevé) | environ 10 demandes par jour et par propriété ; attendre le lendemain |

### Ce qu'on ne peut pas faire

- Les lignes du tableau des motifs n'ont pas de lien (`tr[data-rowid]`, action au clic) :
  le `click` du MCP devrait les ouvrir, mais ce n'est pas encore vérifié. Pour un motif
  précis, sinon, inspecter quelques URL connues du gabarit concerné.
- Les graphiques n'ont pas de données lisibles dans le DOM : `take_screenshot` pour les lire.
- `get_network_request` sur ces pages recopie les cookies de session dans la conversation : ne
  pas l'appeler, ou écrire la réponse dans un fichier (`responseFilePath`) et n'en lire que
  le corps. La réponse brute du test en ligne (RPC `MrNfbc`) ne donne de toute façon qu'un
  code d'état, pas la raison.

## Bing Webmaster Tools

### Ajouter un site

Écran d'accueil : **« Import from Google Search Console »**. Se connecter avec le compte Google
qui porte la Search Console (le même index `N` que plus haut), cocher la propriété du site
seulement. Bing reprend la vérification et les sitemaps, sans DNS ni balise.

### Adresses directes

`<S>` = `https%3A%2F%2Fexemple.com%2F`.

| Écran | Adresse |
|---|---|
| Accueil (clics, impressions) | `https://www.bing.com/webmasters/home?siteUrl=<S>` |
| Sitemaps | `/webmasters/sitemaps?siteUrl=<S>` |
| IndexNow | `/webmasters/indexnow?siteUrl=<S>` (fenêtre des 15 dernières heures seulement) |
| Explorateur de site | `/webmasters/siteexplorer?siteUrl=<S>` (plusieurs jours de retard) |
| Inspection d'URL | `/webmasters/urlinspection?siteUrl=<S>&urlToInspect=<URL encodée deux fois>` |

Exemple d'URL encodée deux fois : `https%253A%252F%252Fexemple.com%252Fen`.

Une adresse inconnue (`/webmasters/searchperf`) renvoie silencieusement à l'écran
d'accueil « Welcome » : ce n'est pas une déconnexion.

### Lire une inspection

Les pages sont des applications lentes à se remplir : attendre que `main` contienne le
verdict. Chercher : `Indexed successfully`, `URL is not on Bing`, `Discovered but not
crawled`, `Crawled but not indexed`. Sous le verdict, Bing liste ses remarques SEO
(« Meta Description too long or too short » = erreur, « Alt attribute for images is
missing » = simple remarque).

« Error encountered while inspecting URL » ou « This might be a momentary issue » : cliquer
**Re-try** une fois, ça passe en général.

## Mesurer une page comme Googlebot

```
new_page        { url: "about:blank", background: true, isolatedContext: "mesure-<unique>" }
emulate         { pageId, viewport: "412x9000x1,mobile,touch",
                  userAgent: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
navigate_page   { pageId, type: "url", url: "https://exemple.com/", timeout: 60000 }
evaluate_script { pageId, function: <contenu de scripts/page-weight.js>, waitForStableDom: false }
```

Le contexte isolé est vierge : pas de cache, pas de cookie, comme Googlebot. **Un nom neuf à
chaque mesure** : réutiliser un contexte réutilise son cache.
