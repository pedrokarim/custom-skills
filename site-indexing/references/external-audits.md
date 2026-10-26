# Audits externes  les lire, les trier, les vérifier

Les outils d'audit en ligne donnent un score et une liste rouge. L'utilisateur arrive souvent
avec l'un d'eux en demandant « c'est vrai  . Réponse type  **une moitié est juste, l'autre
est fausse ou hors sujet**, et chaque point se vérifie en une commande. Ne jamais corriger un
point sans l'avoir reproduit sur le vrai site.

Ces rapports **ne remplacent pas** la Search Console  ils ne savent pas ce que Google a indexé.
Ils servent à repérer des défauts de page (poids, 404, en-têtes) qu'on vérifie ensuite.

## Les lire avec le MCP `brave`

Les deux outils ci-dessous affichent leur rapport sur une URL publique, sans compte 

- SEO Site Checkup  `https://seositecheckup.com/seo-audit/<domaine>` 
- Is Agentic (Vercel, moteur Ora)  `https://is-agentic.com/scan/<domaine>`.

Les ouvrir dans un **onglet à soi** (`new_page`, `background: true`), même si l'utilisateur a
déjà le rapport ouvert, puis récupérer le texte d'un coup plutôt que de lire des captures 

```js
() => { document.querySelectorAll('details').forEach(d => d.open = true);
        return document.body.innerText.replace(/\n{2,}/g, '\n'); }
```

avec `filePath` pour l'écrire dans un fichier. Les `<details>` fermés d'Is Agentic contiennent
le détail de chaque test (valeurs mesurées)  sans les ouvrir, on n'a que les conseils.
Refermer ses onglets à la fin.

## SEO Site Checkup  ce qui tient, ce qui ne tient pas

Fiable et utile 

- **Poids de la page par type de contenu** (images, JS, polices) et nombre de requêtes  bon
  point d'entrée. Le confirmer avec `scripts/page-weight.js` dans un contexte isolé neuf.
- **Taille du HTML** compressé et brut, **nombre de nœuds DOM**  chiffres exacts.
- **Erreurs de console**  vraies, mais à relire soi-même (`list_console_messages`, types
  `error`, `warn`, `issue`). On y a trouvé un logo téléchargé trois fois (préchargement sans
  `crossorigin` alors que l'`<img>` en avait un) et une directive CSP ignorée.
- **Images trop grandes pour leur affichage**  vrai en général (icônes 256 px affichées en
  48 px servies telles quelles, hors `next/image`).

Faux ou hors sujet le plus souvent 

- **« URL canonicalization  www / sans www** sur un **sous-domaine**  `www.sous.domaine.tld`
  n'existe en général pas du tout (pas de DNS). Rien à faire. Vérifier 
  `nslookup www.<hôte>`.
- **« Pas de Google Analytics **  ce n'est pas un critère de classement  ignorer si le site
  a déjà ses propres statistiques.
- **« Meta description de 150 à 220 caractères **  contredit Bing, qui classe en erreur
  au-delà de 160. Garder ≤ 160.
- **« Pas de favicon ** alors qu'une `<link rel="icon">` existe  faux positif fréquent
  quand l'URL porte un paramètre (`/favicon.ico?…`). Vérifier dans le `<head>`.
- **« Images sans alt **  le test compte aussi les `alt=""`, qui sont **corrects** pour une
  image décorative. Compter séparément les `alt` absents (seuls vrais défauts) 
  `[...document.images].filter(i => !i.hasAttribute('alt')).length`.
- **« Images déformées **  compte les images en `object-fit: cover`, qui ne sont pas
  déformées. Ne retenir que celles en `object-fit: fill` dont le ratio diffère.
- **« Pas de SPF ** sur un sous-domaine qui n'envoie pas de courrier  regarder le SPF du
  domaine parent. Un `v=spf1 -all` sur le sous-domaine est un bonus, pas un correctif SEO.
- **Temps de chargement, FCP, TTFB** mesurés depuis la Virginie, une seule fois, sur un serveur
  européen  ordre de grandeur seulement. Un FCP de 12 s avec un LCP de 0 s est une mesure
  ratée, pas un diagnostic.
- **Score « AI visibility **  estimation commerciale, rien à corriger.

Le test **« Custom 404 ** est en revanche à prendre au sérieux, voir plus bas.

## Is Agentic  ce qui tient, ce qui ne tient pas

Il évalue ce qu'un agent (ChatGPT-User, Claude-User, PerplexityBot…) peut lire et comprendre.
Utile, avec un tri 

- **« Agent-friendly 404s ** et **« Content is available without JavaScript **  les
  mesures (statut 404, nombre de caractères, ratio contenu / balisage) sont exactes. Un ratio
  de 2,5 % signifie que le HTML est surtout du balisage et de la charge utile React (RSC),
  pas un manque de texte.
- **« Trust anchor pages **  il cherche `/about`, `/contact` et `/privacy` **à ces adresses
  exactes**. Une page de confidentialité à un autre chemin (`/confidentialite`) est comptée
  absente  une redirection `/privacy` → la vraie page règle le point.
- **JSON-LD `Organization` sans `description`**  correctif d'une ligne, utile aussi aux
  moteurs.
- **« Organization sans `address` **  n'a de sens que pour une entreprise qui a une adresse.
  Ne jamais en inventer une pour le score.
- **« Markdown content negotiation ** (`Accept: text/markdown` → réponse Markdown +
  `Vary: Accept`)  convention récente, sans effet sur Google. À ne faire que si l'utilisateur
  veut viser les agents  et alors penser au `Vary`, sans quoi un cache (Cloudflare) servirait
  le Markdown aux navigateurs.
- **`lang` signalé dans une autre langue que prévu**  l'outil suit la redirection de la racine
  selon son propre `Accept-Language`. Vérifier `<html lang>` page par page avant de conclure.
- Le parcours de l'agent (« Task , « View journey ) montre quelles pages il a lues pour
  répondre « que fait ce site    bon test de la page À propos.

## Le piège Next.js trouvé par ces audits  la 404 sans habillage

Avec un App Router découpé par langue (`app/[locale]/…`), un `not-found.tsx` posé dans
`[locale]` **ne sert qu'aux `notFound()` appelés dans ce segment**. Une adresse qui ne
correspond à aucune route (`/en/page-inexistante`) tombe sur la 404 brute de Next
(« 404: This page could not be found. , sans le site autour), alors qu'une autre 404 du même
site est habillée. Les deux audits le signalent, chacun à sa façon.

Remède  une route attrape-tout `app/[locale]/[...rest]/page.tsx` qui appelle `notFound()`.
Tester **deux** 404  une adresse sous une langue valide et une adresse inventée.

Au passage  un `title` de 404 qui répète déjà le nom du site, combiné au gabarit
`%s | Nom du site` du layout, produit « … | Nom du site | Nom du site .

Et en habillant cette 404 : Next garde le `not-found` en réserve dans **chaque** page. Une `<img>` sans `loading="lazy"` dans la 404 est donc préchargée dans le `<head>` de tout le site (React 19, voir le piège 8 de `SKILL.md`). Mettre `loading="lazy"` : sur la 404 elle-même, l'image est à l'écran et se charge aussitôt. Et `metadata` n'est lu que dans `global-not-found` : dans un `not-found` de segment, le client remet le titre du layout. Un `<title>` rendu dans le composant (React 19 le hisse dans le `<head>`) règle le titre de l'onglet.
