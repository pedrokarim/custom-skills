---
name: no-ai-slop
description: Concevoir ou relire une page, un écran d'application ou un visuel sans les tics des interfaces générées (« AI slop ») : monospace et surtitres décoratifs, pilules, verre dépoli, points lumineux, fausses fenêtres, cartes imbriquées ou identiques, tuiles d'icônes, textes sur un motif, images toutes faites. Donne les textes (catégorie nommée, fait dur, boutons verbe + objet), le plan et le rythme, les règles des écrans d'application (tableau de bord, collection, boutique, inventaire, back-office, formulaires, tableaux, états vides et d'erreur), la composition des images à partir de l'officiel et un script qui détecte ces motifs. À utiliser dès qu'on crée, refait ou critique une page, un écran, un composant visible, une maquette ou une illustration, qu'on écrit les textes d'une interface, ou que l'utilisateur dit « AI slop », « générique », « ça fait IA », « trop template », « les espacements sont chelous », même pour « une landing », « un hero » ou « une iframe pour Top.gg ».
---

# Pas d'AI slop

Une interface « AI slop » se reconnaît en une seconde : les mêmes surtitres, les mêmes pilules,
les mêmes cartes à icône, empilés dans le même ordre que mille autres pages. Elle peut être propre,
alignée, sans débordement, et être refusée quand même, parce qu'elle ne dit rien du produit.

Le principe qui remplace tous les autres : **chaque élément est conçu pour son contenu**. Avant de
poser un composant, se demander ce qu'il montre de vrai. S'il n'est là que pour « faire design »
(un surtitre, une pastille, un trait, une étincelle), il part.

## Le catalogue des motifs refusés

Chaque ligne a été refusée au moins une fois sur un vrai produit. La liste longue, avec ce qu'il
faut faire à la place, est dans [`references/catalog.md`](references/catalog.md).

**Typographie**
- Police **monospace** hors affichage réel de code : surtitres, numéros, étiquettes, taux,
  légendes, « commandes » décoratives. Pour des chiffres alignés : `font-variant-numeric:
  tabular-nums` dans la police du texte.
- **Surtitre** en capitales espacées au-dessus de chaque titre, surtout numéroté
  (« 01 · TOUT PILOTER »), ou précédé d'une étincelle (« ✦ … »).
- **Titres en dégradé**, et le **trait surligneur** sous un mot de chaque titre de section : une
  fois peut être un choix, à chaque section c'est un tic.
- Rangée de **puces à point coloré** en capitales (« • GRATUIT • FR + EN • SLASH »).
- **Un seul mot** en italique, en sérif ou en couleur dans un titre ; une **phrase entière** en
  taille d'affichage ; une hiérarchie plate où tout tient entre 14 et 18 px.

**Composants**
- **Badge pilule** au-dessus du hero (« Discord, mais mieux organisé »), pilules de **verre
  dépoli**, onglets en verre translucide, pastilles de stats en verre.
- **Point lumineux** « en ligne » / « toujours disponible » posé comme décor.
- **Fausse fenêtre** de navigateur ou d'application (trois points rouge-jaune-vert, barre
  d'adresse en monospace) et **faux tableau de bord** aux données inventées.
- **Stickers flottants** de commandes (`/play`, `/help`) collés autour d'une image.
- La **grille de cartes identiques** icône-carrée + titre + phrase, répétée section après section.
- Flèches « → » décoratives, étincelles ✦, emojis de décoration.
- **Barres, bandes ou rails colorés** autour d'une carte ou d'une section sans fonction.
- **Le liseré latéral coloré « façon embed Discord »** sur une carte, une ligne de liste, une
  récompense ou une alerte, qu'il soit en `border-left` ou dessiné par un `::before` : jamais.
  C'est le tic le plus reconnaissable des interfaces générées. La couleur d'un élément passe
  par son visuel, son icône ou un fond léger. Seule exception : un aperçu qui reproduit
  fidèlement un vrai embed Discord.
- **Cartes dans des cartes**, carte à trait fin et grande ombre floue, **tuile teintée** autour de
  l'icône au-dessus de chaque titre.

**Mouvement**
- `transition: all`, cartes qui grossissent au survol, rebonds, même entrée animée sur chaque
  section, contenu masqué tant que l'animation ne part pas.

**Mise en page**
- Le gabarit hero → trois atouts → grille de fonctionnalités → bandeau d'appel, chaque bloc avec
  son surtitre, son titre surligné et son paragraphe centré.
- **Textes posés sur un motif de fond** (semis, points, grille) : le motif vit dans les marges ou
  derrière une surface pleine, jamais sous une ligne de texte.
- Changements de fond **en bandes** qui coupent la page à des hauteurs arbitraires.
- Une **image énorme** sans rôle : la taille d'un visuel suit ce qu'il raconte, pas la place libre.

**Couleur**
- Pastels arc-en-ciel pour distinguer des rubriques, dégradé violet-bleu « tech », lueurs néon.
- Couleurs écrites en dur qui cassent un des deux thèmes : chaque couleur passe par un jeton
  défini en clair **et** en sombre, et une page embarquée (iframe) fixe son propre
  `color-scheme` au lieu de subir celui de l'hôte.

## Raconter la page

Le fond d'une bonne page tient à deux choses, qu'on règle **avant** le visuel :

- **Les textes** ([`references/copy.md`](references/copy.md)) : le h1 nomme la catégorie, le premier
  écran porte un fait dur, chaque titre nomme une chose, chaque bouton est un verbe et ce qu'on
  obtient, peu de mots par écran, aucune preuve ni donnée inventée.
- **Le plan** ([`references/page-plan.md`](references/page-plan.md)) : une ligne par section, une
  idée et une vraie image chacune, des dispositions qui varient, une fin de page calme. Puis le
  **rythme** : une seule échelle d'espacement, rien d'orphelin, des colonnes qui s'équilibrent.

Écrire tous les textes et le plan d'abord, dans un fichier à côté de la maquette ; construire
ensuite.

## Concevoir à la place

1. **Partir du contenu réel** : les vraies commandes, les vrais écrans, les vrais visuels du
   produit. Une preuve (une vraie réponse du bot, une vraie carte) vaut mieux que trois atouts.
2. **Une idée de mise en page par page**, pas un empilement de sections au même gabarit. Varier
   l'échelle : un grand moment, puis du texte serré, puis une liste dense.
3. **Typographie** : deux familles au plus (titres, texte), hiérarchie par la taille, la graisse
   et l'espace. Les étiquettes s'écrivent en casse normale.
4. **Décor** : il appartient à la scène (un objet, une illustration, une texture de surface), pas
   à l'interface (pastilles, points, traits).
5. **Navigation lisible** : chaque rubrique porte son libellé, jamais une icône seule ni une
   couleur pastel seule.
6. **Relire le plan contre le défaut** : avant de construire, se demander si un brief voisin (un
   autre produit du même genre) mènerait à la même page. Chaque partie qui sortirait pareille est
   revue, et l'on note ce qui change et pourquoi.
7. **L'audace à un seul endroit** : un élément mémorable par page, tout le reste calme et
   discipliné. Avant de montrer, retirer un accessoire.

> Les points 6 et 7 reprennent l'esprit du skill `frontend-design` d'Anthropic (Apache 2.0).

## Les écrans d'application

Un tableau de bord, une collection, une boutique, un inventaire ou un back-office ne se conçoit
pas comme une landing : l'outil s'efface devant la tâche. Contrôles familiers, densité adaptée au
travail, groupes par l'espace plutôt que par des cartes, et chaque état dessiné (chargement, vide,
filtre sans résultat, erreur, désactivé). Les règles et les motifs propres à ces écrans sont dans
[`references/app-ui.md`](references/app-ui.md) ; leurs textes (erreurs, états vides,
confirmations) dans [`references/copy.md`](references/copy.md).

## Les images : composer, ne pas « sortir » une image

Une image toute faite, générée d'un bloc et posée telle quelle, est la version visuelle du slop :
un style qui n'est pas celui de la marque, une taille qui n'a pas de raison, rien qu'on puisse
réutiliser. **On compose.**

1. **Partir des visuels officiels** : la mascotte détourée, l'emblème, les vraies cartes, les
   vraies captures. Les découper et les réassembler avant d'envisager une génération.
2. **Ne générer que des pièces**, jamais la scène finie : un décor sans personnage, un objet, une
   texture, une lumière. Fond chroma `#00FF00` ou transparence quand la pièce sera détourée. Aucun
   texte, chiffre ou logo dans l'image.
3. **Le personnage reste l'officiel** : on ne le redessine pas, on le pose. Le style des pièces
   générées suit le sien (trait, palette, lumière), avec l'officiel joint en référence.
4. **La composition se fait dans la page** quand c'est possible (calques HTML/CSS, `<picture>`),
   sinon par un script qui empile les calques : elle reste modifiable.
5. **Taille et cadrage selon le rôle** : un visuel d'appel peut être grand, une illustration de
   rubrique ne dépasse pas son texte.
6. **Une illustration n'est pas une capture d'écran du site.**

Le détail (prompts de pièces, contrôle du style, erreurs déjà faites) est dans
[`references/images.md`](references/images.md).

## Relire avant de montrer

Toute maquette ou page passe ce contrôle **avant** d'être montrée :

1. **Regarder d'abord, mesurer ensuite** : la capture dans **les deux thèmes** et dans son
   contexte réel (une iframe dans la page hôte, pas seulement seule). Noter son jugement avant de
   lancer le script, pour que la mesure n'oriente pas le regard.
2. Lancer [`scripts/slop-scan.js`](scripts/slop-scan.js) dans la page (navigateur piloté,
   `evaluate_script`, ou collé dans la console). Il liste les polices monospace hors `<code>`,
   les surtitres, les titres en dégradé, les textes sur un motif, les contrastes insuffisants, les
   badges pilule, les bandes latérales colorées, les cartes imbriquées et fantômes, les tuiles
   d'icônes au-dessus des titres, les titres plus près du bloc précédent que du leur,
   `transition: all`, une hiérarchie typographique plate, une même action répétée dans le premier
   écran et les tics de cadence des textes. Dix entrées au plus par clé ; zéro attendu, sauf
   exception justifiée.
   Une illustration composée en HTML (carte de jeu, visuel de produit) se marque
   `data-slop-ignore` : le script ne la prend plus pour une carte imbriquée ni ne compte ses
   petits textes dans la hiérarchie.
3. Relire le catalogue ci-dessus en cherchant chaque motif à l'œil : le script ne voit pas une
   fausse fenêtre ni une grille de cartes identiques.
4. **Le test du retrait**, pour chaque élément suspect : le nommer précisément (« carte
   imbriquée », « surtitre »), dire son rôle (information, état, action, hiérarchie, marque), puis
   l'enlever en pensée. Si la page reste claire ou le devient, il part ; sinon, la plus petite
   correction dans le système existant, jamais un nouvel effet pour compenser.
5. Relire le rythme sur la capture, section par section (`references/page-plan.md`) : écarts
   selon la parenté, aucun bouton ou titre orphelin, colonnes équilibrées.
6. Lire chaque texte à voix haute (`references/copy.md`).

### Rendre une critique

Quand on demande un avis plutôt qu'une correction : cinq à huit constats au plus, regroupés par
cause, chacun avec sa preuve (élément, écran, ligne de texte) et une seule correction.

| Rang | Sens |
|---|---|
| P0 | bloque la tâche, défaut d'accessibilité grave, preuve trompeuse |
| P1 | nuit nettement à la compréhension, à la confiance ou à la navigation |
| P2 | tic répété ou incohérence qui affaiblit la hiérarchie et l'identité |
| P3 | finition à faible impact |

Pas de note chiffrée, pas de pronostic « fait par une IA ». Finir par la seule correction qui
changerait le plus la page.

> Test du retrait et format adaptés d'`audit-ai-design-slop` de Meng To (MIT).

## Erreurs déjà payées

- Un gros skill de « goût » suivi à la lettre (tirages par scripts, quatre contrôleurs à cinq
  largeurs) : 2 h 27 et des centaines de milliers de tokens pour une page embarquée de 7 200 px, sans
  l'identité de la marque. Ses textes et son plan étaient bons : ils sont repris ici, pas sa
  machinerie.

- Une page validée par la mesure (aucun débordement) a été refusée comme « catastrophique » : la
  mesure ne juge pas le design. Regarder la capture et la comparer à une référence qui donne envie.
- Une police monospace sur des cartes de jeu, des taux et des étiquettes : refusée, « on la voit
  partout ».
- Des onglets en pilules de verre et un badge « ✦ Thème du jour » : refusés pour leur forme même.
- Un semis de motifs ajouté en fond de site passait sous les paragraphes : illisible par endroits,
  refusé. Le fond se masque sous la colonne de contenu.
- Une page embarquée chez un hôte en thème sombre a reçu le thème sombre du système sans que ses
  couleurs en dur suivent : le nom du produit est devenu invisible dans sa propre barre.
- Des illustrations générées d'un bloc, dans un style différent de la mascotte officielle, posées
  en très grand : « sortir une image toute préparée, non ». Composer à partir de l'officiel.
