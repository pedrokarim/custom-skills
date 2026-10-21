---
name: site-indexing
description: Faire indexer un site par Google et Bing en travaillant directement dans la Search Console et Bing Webmaster Tools, pilotées depuis le navigateur Brave de l'utilisateur via le MCP `brave`. Diagnostic de l'indexation réelle (rapports, inspection d'URL, test en ligne), mesure de ce que Googlebot charge, correctifs côté code (pages maigres, sitemap, hôtes en double, poids de page, meta descriptions, IndexNow), puis demandes d'indexation. À utiliser dès qu'on parle de SEO, d'indexation, de référencement, de Search Console, de Bing Webmaster, de sitemap, ou qu'un site « n'apparaît nulle part sur Google », même si la demande ne cite aucun de ces mots.
---

# Faire indexer un site, en travaillant dans les consoles

Ce skill vient d'un site (Next.js 16 sur Vercel) qui a reçu plusieurs passes
« SEO » sur ses balises pendant des mois, alors qu'**aucune de ses pages n'était indexée**. Les
balises étaient bonnes. Les vrais blocages étaient ailleurs, et ils se lisaient en dix minutes
dans la Search Console :

- 92 % du sitemap était fait de fiches de ~100 mots, déclinées en 7 langues : Google explorait
  un échantillon, tombait sur ces pages et refusait tout le site, accueil compris ;
- la page d'accueil pesait 18,6 Mo à la façon de Googlebot : l'outil de Google échouait sur elle
  à chaque test (« Un problème est survenu »), depuis le premier jour.

## La règle mère

**Mesurer l'indexation réelle avant de toucher une balise.** Le rapport « Indexation des pages »
de la Search Console dit combien de pages sont indexées et pourquoi les autres ne le sont pas.
Tant qu'on ne l'a pas lu, tout correctif est une supposition.

## L'outil : le MCP `brave`

Les consoles se pilotent dans **le navigateur Brave de l'utilisateur**, avec ses sessions déjà
ouvertes, via le MCP `brave` (`chrome-devtools-mcp --autoConnect --userDataDir <profil Brave>`).
On y lit les rapports, on y tape dans les champs, on y clique, on y demande l'indexation. On le
fait soi-même : ne pas renvoyer l'utilisateur cliquer à sa place.

- **Brave, jamais Chrome.** Le serveur `chrome-devtools` de la config n'est pas le bon.
- **Ne pas contourner avec Playwright ou Puppeteer** si le MCP ne répond pas.
- S'il est en `CONNECT_TIMEOUT` au démarrage (lancement `npx …@latest` trop lent), demander à
  l'utilisateur `/mcp` puis **Reconnect** : un MCP ne se rattache pas depuis la session.
- Travailler dans un onglet ouvert en arrière-plan (`new_page` avec `background: true`), et le
  refermer à la fin. Les identifiants d'onglet changent, et l'utilisateur ferme parfois
  l'onglet : relancer `list_pages` en cas de « No page found ».

Le mode d'emploi détaillé des deux consoles (adresses, sélecteurs, quotas, erreurs connues)
est dans `references/brave-mcp-consoles.md`. Le lire avant la première action.

## Procédé

### 1. État des lieux, en lecture seule (≈ 15 min)

1. **Demander ou retrouver les propriétés** avant de conclure quoi que ce soit. Une propriété
   « Domaine » (`sc-domain:exemple.com`) compte **tous les sous-domaines** : ses chiffres ne
   sont pas ceux du site. Lire la propriété « Préfixe de l'URL » du site lui-même.
2. Search Console, propriété du site :
   - **Pages** : nombre indexé, motifs de non-indexation, **date de « Dernière mise à jour »**
     (le rapport peut avoir plus d'une semaine de retard) ;
   - **Sitemaps** : dernière lecture, nombre d'URL ;
   - **Performances** (2 à 3 jours de retard), **Liens** (liens externes), **Actions manuelles** ;
   - **Inspection de l'URL** sur l'accueil : date de « Dernière exploration ». Sur le site d'origine, Google
     n'était pas revenu sur l'accueil depuis trois mois.
3. Bing Webmaster Tools : accueil, Sitemaps, IndexNow, inspection d'URL de l'accueil.
4. Les analytics du site : visites venues des moteurs, par référent.

Consigner l'état dans la mémoire du projet, avec les dates : c'est la base de comparaison.

### 2. Lire les motifs

Le tableau des motifs et de ce qu'ils imposent est dans `references/diagnostics.md`. Le plus
fréquent sur un site jeune est **« Explorée, actuellement non indexée »** : Google a lu les
pages et a jugé qu'elles ne valaient pas l'index. Ce n'est pas un problème de balise, c'est un
jugement sur le contenu, souvent porté sur tout le site à partir d'un échantillon.

### 3. Tester ce que Google peut lire

Dans l'inspection d'URL, **« Tester l'URL active »** sur un échantillon qui sépare les causes :

| URL testée | Si elle échoue |
|---|---|
| `/robots.txt` | problème de compte, de propriété ou d'accès au serveur |
| une page légère (`/about`) | problème commun à toutes les pages (gabarit, en-têtes) |
| chaque gabarit lourd (accueil, listes) | **page trop lourde ou cassée pour l'outil de Google** |

Un « Un problème est survenu, réessayez dans quelques heures » **systématique sur une page
précise** n'est pas une panne de Google : c'est la page. Ne pas l'annoncer comme passager.

### 4. Vérifier le HTML servi

`scripts/seo_check.py page <url>` : statut, `X-Robots-Tag`, robots, canonical, hreflang,
présence dans le `<head>`, longueur de la description, préchargements d'images, poids du HTML.
`scripts/seo_check.py sitemap <url>` : composition du sitemap par section. Si une section
pèse la majorité des URL, regarder une de ses pages : combien de mots propres ?

### 5. Mesurer le poids à la façon de Googlebot

Googlebot rend la page dans une **fenêtre très haute** : le chargement différé ne le soulage
pas, il charge tout. Mesurer ainsi, avec le MCP :

1. `new_page` avec un **`isolatedContext` neuf** (nom jamais utilisé) : sinon le cache fausse
   la mesure, on a vu 18,6 Mo s'afficher « 1,8 Mo » ;
2. `emulate` : viewport `412x9000x1,mobile,touch`, user-agent Googlebot smartphone ;
3. `navigate_page`, puis `evaluate_script` avec **le contenu** de `scripts/page-weight.js`
   collé dans `function` (attend 20 s, puis regroupe les octets par dossier).

Repère observé, pas une limite documentée par Google : l'accueil du site d'origine échouait à 18,6 Mo
et passait à 6,3 Mo ; les pages qui passaient pesaient moins de 1 Mo.

### 6. Corriger

Catalogue des correctifs, avec le pourquoi de chacun : `references/diagnostics.md`. Les plus
rentables :

- pages trop maigres en **`noindex, follow`** et **retirées du sitemap** (un sitemap liste ce
  qu'on demande d'indexer, rien d'autre) ;
- pages riches absentes du sitemap, ajoutées ;
- **un seul hôte en 200** : redirection 301/308 des alias (`*.vercel.app`) ;
- poids de page : images à la taille d'affichage, rien de chargé « en douce » en pleine taille ;
- meta descriptions **≤ 160 caractères** (Bing les classe en erreur au-delà).

Déployer en production : l'outil de Google n'inspecte que le vrai domaine.

### 7. Agir dans les consoles

1. Retester la page qui échouait (« Tester l'URL active »).
2. **Demander l'indexation** des pages clés, accueil en premier. Quota d'environ 10 par jour et
   par propriété : choisir.
3. Renvoyer le sitemap s'il a changé.
4. Lancer IndexNow pour Bing et les moteurs associés (`scripts/indexnow.mjs`). **Google ne lit
   pas IndexNow.**

### 8. Suivre

Compter deux à quatre semaines avant de juger le rapport « Indexation des pages ». Premiers
signes : le nombre de « Explorée, actuellement non indexée » qui baisse, des pages qui passent
dans l'index. Côté Bing, l'inspection d'URL répond avant l'explorateur de site. Noter chaque
point d'étape daté dans la mémoire du projet.

## Les pièges, déjà payés

Chacun a coûté du temps ou de la confiance sur le site d'origine. Les relire avant de conclure quoi que ce
soit.

1. **Affirmer « il n'y a pas de Search Console »** sans avoir regardé dans le navigateur.
   Elle existait, vérifiée par DNS, ce qui expliquait pourquoi la balise meta avait disparu.
2. **Se fier à l'outil de recherche web de l'assistant** pour un `site:` : ce n'est pas Google.
   Faire la requête dans Brave.
3. **Lire les chiffres de la propriété Domaine** : ses 1 280 pages indexées étaient celles des
   autres sous-domaines. La propriété du site en avait zéro.
4. **« Réparer » une migration de domaine** sans demander : l'ancien sous-domaine avait été
   abandonné exprès, sans trafic. Il a fallu tout défaire. Demander pourquoi avant de rétablir
   quoi que ce soit, et ne proposer « Changement d'adresse » que si la migration est voulue.
5. **Corriger une cause supposée avant de l'avoir isolée** : les 106 `<link rel="preload">` de
   l'accueil ont été corrigés et déployés, sans effet sur le test. Le vrai poids venait
   d'ailleurs. Isoler d'abord (étapes 3 et 5), corriger ensuite.
6. **Mesurer avec le cache plein** : chiffres faux, conclusions fausses. Un contexte isolé
   neuf par mesure.
7. **Croire que `loading="lazy"` protège Googlebot** : sa fenêtre haute charge tout. Et un
   `new Image()` lancé par du JavaScript (calcul de couleur dominante) télécharge
   l'original quoi qu'il arrive : 56 images, jusqu'à 1,2 Mo chacune, pour un échantillon de
   24×24 pixels.
8. **React 19** transforme chaque `<img>` rendue côté serveur **sans** `loading="lazy"` en
   `<link rel="preload" as="image">` dans le `<head>`.
9. **`get_network_request` sur une page Google ou Microsoft** recopie les cookies de session
   dans la conversation. Ne lire que la liste (`list_network_requests`) ; si un corps de
   réponse est indispensable, l'écrire dans un fichier avec `responseFilePath`.
10. **Insister sur une erreur** : relancer trois fois « Demander une indexation » consomme du
    quota et n'apprend rien. Changer d'URL de test plutôt (étape 3).
11. **Conclure « aucun effet »** sur un rapport dont la date de mise à jour précède le
    correctif.
12. **IndexNow** : le premier envoi répond `403 SiteVerificationNotCompleted` tant que le
    service n'a pas lu le fichier de clé. Il faut que la clé soit déployée, puis réessayer
    quelques minutes plus tard (le script de suivi le fait). Et il ne sert à rien pour Google.
13. **`lastmod` à `new Date()`** dans le sitemap : il annonce que tout change à chaque lecture,
    Google finit par ignorer le champ. Ne rien mettre plutôt qu'une date fausse.
14. **Codes hreflang** : les locales internes ne sont pas forcément des codes BCP 47 (`jp` →
    `ja`, `kr` → `ko`, `tc` → `zh-Hant`). Et un `x-default` cohérent avec la redirection de
    la racine.
15. **Alias d'hébergement** : `projet.vercel.app` sert le site en 200. Rediriger sur l'hôte
    exact, pas sur un motif qui attraperait les URL de preview.
16. **Vérifier en local une page qui dépend d'une base injoignable** : 500, temps perdu. Le test
    qui compte se fait de toute façon en production.

## Ce que ce skill ne fait pas

- Il n'écrit pas de contenu « pour le SEO ». Si des pages sont trop maigres, on les retire de
  l'index ou on les enrichit avec du vrai contenu, jamais avec du remplissage.
- Il ne crée pas de liens entrants. C'est souvent le facteur manquant d'un site jeune (la
  Search Console du site d'origine n'en comptait aucun) : le signaler à l'utilisateur, c'est lui qui décide.
