# Lire les motifs, choisir les correctifs

## Motifs de non-indexation (Search Console)

| Motif | Ce que ça veut dire | Que faire |
|---|---|---|
| **Explorée, actuellement non indexée** | Google a lu la page et l'a jugée sans intérêt. Sur un site jeune, ce jugement est porté sur tout le site à partir d'un échantillon. | Regarder la composition du sitemap et les gabarits les plus nombreux. Pages maigres → `noindex, follow` + hors sitemap, ou vrai contenu. Vérifier le poids de la page (l'outil de Google peut échouer dessus). |
| **Détectée, actuellement non indexée** | Connue (sitemap, liens) mais pas encore explorée : Google n'y met pas de priorité. | Moins d'URL dans le sitemap, des liens internes vers les pages importantes, des liens entrants. |
| **Page en double : Google n'a pas choisi la même URL canonique** | Google pense qu'une autre URL porte le même contenu. | Vérifier que chaque langue sert vraiment sa langue, que les hreflang sont réciproques, qu'aucun hôte en double ne répond en 200. |
| **Page avec redirection** | L'URL redirige. | Normal pour une racine qui redirige vers une langue, ou un ancien chemin. Anormal si une URL du sitemap redirige : corriger le sitemap. |
| **Introuvable (404)** | L'URL n'existe plus. | Normal pour des pages supprimées. Si c'étaient des pages indexées, rediriger en 308 vers l'équivalent. |
| **Exclue par la balise « noindex »** | Voulu ou non. | Vérifier que la liste correspond aux pages qu'on a choisi d'exclure. |
| **Bloquée par le fichier robots.txt** | | Vérifier `robots.txt` et l'en-tête `X-Robots-Tag`. |

La colonne **Validation** indique si une « validation de la correction » a été lancée. « Échec »
veut dire que Google a réexaminé les pages et maintenu son verdict : le correctif tenté n'était
pas le bon.

## Vérifications côté HTML

`scripts/seo_check.py page <url>` couvre l'essentiel. Ce qu'il faut voir :

- **statut 200** sur l'URL canonique, pas de chaîne de redirections ;
- **`X-Robots-Tag`** absent (ou `index`) dans les en-têtes, et `<meta name="robots">` à
  `index, follow` ;
- **canonical, hreflang, robots, title, description dans le `<head>`** : certaines versions
  de Next.js diffusent les métadonnées en streaming dans le `<body>` pour les robots qui
  exécutent le JavaScript, et Google ignore un canonical hors du `<head>` ;
- **hreflang** : une entrée par langue en codes BCP 47, plus un `x-default` ;
- **description** entre 50 et 160 caractères (au-delà, Bing la classe en erreur ; les langues
  CJK sont plus denses, une description courte y est normale) ;
- **préchargements d'images** (`<link rel="preload" as="image">`) : quelques-uns pour l'image
  principale, pas des dizaines ;
- **contenu présent dans la réponse** : avec React et Suspense, le HTML peut commencer par un
  « Chargement… » suivi du vrai contenu, streamé dans la même réponse (`<div hidden id="S:0">`).
  C'est lisible par Google. Ce qui ne l'est pas : un contenu chargé seulement après une
  requête côté client.

## Composition du sitemap

`scripts/seo_check.py sitemap <url>` compte les URL par section. Sur le site d'origine :

```
6643  cosmetics, profondeur 3   ← 92 % du sitemap, ~100 mots par page
 224  characters, profondeur 2
 112  map, profondeur 2
 ...
```

Un sitemap liste **ce qu'on demande d'indexer**. Si une section énorme est faite de pages
maigres, elle dilue tout le reste. La retirer a fait passer le sitemap de 7 224 à 665 URL.

Pas de `lastmod` plutôt qu'un `lastmod` faux (horodatage de build ou `new Date()`).

## Catalogue des correctifs

| Problème | Correctif | Pourquoi |
|---|---|---|
| Pages maigres en masse | `robots: { index: false, follow: true }` sur le gabarit, et retrait du sitemap | Elles restent explorables et leurs liens suivis, mais ne pèsent plus sur le jugement du site |
| Pages riches absentes du sitemap | Les ajouter | Calendrier, théâtre, commissions manquaient sur le site d'origine |
| Alias d'hébergement en 200 (`*.vercel.app`) | Redirection permanente sur l'**hôte exact** (`has: [{ type: 'host', value: '…' }]` dans `next.config`) | Contenu en double ; un motif trop large attraperait les previews |
| Page trop lourde pour l'outil de Google | Mesurer (`page-weight.js`), puis réduire ce qui domine | Accueil du site d'origine : 18,6 Mo → 6,3 Mo, le test en ligne est passé |
| Images servies en pleine taille | `next/image` avec `sizes`, ou une vignette dédiée ; `unoptimized` pour les URL externes non déclarées | L'optimiseur sert la taille d'affichage |
| Image chargée par du JavaScript (`new Image()`) pour un calcul | Charger une vignette (`/_next/image?url=…&w=64&q=75`) | Sur le site d'origine, un calcul de couleur dominante sur 24×24 px téléchargeait 56 originaux |
| Dizaines de `<link rel="preload" as="image">` | `loading="lazy"` sur les `<img>` hors de l'écran initial | React 19 précharge toute `<img>` rendue côté serveur sans `loading="lazy"` |
| Meta description trop longue | ≤ 160 caractères, dans chaque langue | Erreur dans Bing ; tronquée dans les résultats |
| Bing et moteurs associés lents à découvrir | IndexNow (`scripts/indexnow.mjs`) | Prévient Bing, Yandex, Seznam, Naver ; DuckDuckGo, Ecosia, Yahoo et Qwant s'appuient sur Bing. Pas Google |

## Liens entrants : vérifier avant de démarcher

Un lien n'aide Google que s'il est sur une page **publique** qu'il explore. Un message Discord
ne compte pas (serveurs privés, jamais explorés) : il amène des visiteurs, pas un signal.

**Wikis Fandom** : tous leurs liens externes sont en `rel="nofollow"` (vérifié sur le wiki du
jeu de DNA en octobre 2026). Google s'en sert au mieux pour découvrir des pages, pas pour
classer le site. Avant de proposer un lien, mesurer l'activité du wiki par son API, depuis
un onglet ouvert dessus (`fetch` vers `/api.php?format=json&origin=*&…`) :

- `meta=siteinfo&siprop=statistics` : `activeusers` (contributeurs des 30 derniers jours) ;
- `list=allusers&augroup=sysop|bureaucrat` puis `list=usercontribs&uclimit=1&ucuser=<nom>` :
  date de la dernière contribution de chaque administrateur ;
- `prop=info&inprop=protection&titles=<page d'accueil>` : l'accueil est souvent réservé aux
  administrateurs ;
- `list=exturlusage&euquery=<domaine>` : le wiki cite-t-il déjà des outils de fans ?
- la page `<Wiki>:Wiki rules` : la règle Fandom par défaut interdit l'autopromotion et renvoie
  vers un administrateur.

Sur DNA : 3 contributeurs actifs, administrateurs muets depuis 7 mois, accueil protégé,
aucun outil externe cité, liens `nofollow`. Gain pour Google à peu près nul : ne pas y passer
de temps. Les guides Steam du jeu, publics et bien explorés, sont un meilleur candidat.

## Délais à connaître

| Quoi | Délai observé |
|---|---|
| Rapport « Indexation des pages » | mis à jour tous les quelques jours ; il avait 8 jours de retard sur le site d'origine |
| Performances Google | 2 à 3 jours |
| Sitemap relu après envoi | le jour même |
| Bing : sitemap importé → premières impressions | 2 jours |
| Bing : explorateur de site | plusieurs jours après que l'inspection d'URL dit « Indexed » |
| Effet d'un correctif sur l'indexation Google | 2 à 4 semaines |
