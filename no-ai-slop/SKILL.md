---
name: no-ai-slop
description: Concevoir ou relire une interface, une page marketing, une landing, un embed, une maquette ou un visuel sans les tics des interfaces générées (« AI slop ») : surtitres numérotés en monospace, badges pilule, pilules de verre, points lumineux, fausses fenêtres et faux tableaux de bord, titres surlignés partout, textes sur un motif, images toutes faites posées en bloc. Donne aussi la façon de raconter la page (textes plats qui nomment la catégorie, un fait dur, des boutons verbe + objet), son plan section par section, le rythme des espacements, la composition des images à partir de l'officiel et un script qui détecte ces motifs dans la page. À utiliser dès qu'on crée, refait ou critique une page, un écran, un composant visible, une maquette, une bannière ou une illustration de site, qu'on écrit les textes d'une page, dès que l'utilisateur dit « AI slop », « générique », « ça fait IA », « pas de monospace », « trop template », « les espacements sont chelous », « refais-la en mieux », et même s'il demande seulement « une landing », « un hero », « une page de présentation » ou « une iframe pour Top.gg ».
---

# Pas d'AI slop

Une interface « AI slop » se reconnaît en une seconde : les mêmes surtitres, les mêmes pilules,
les mêmes cartes à icône, empilés dans le même ordre que mille autres pages. Elle peut être propre,
alignée, sans débordement, et être refusée quand même, parce qu'elle ne dit rien du produit.

Le principe qui remplace tous les autres : **chaque élément est conçu pour son contenu**. Avant de
poser un composant, se demander ce qu'il montre de vrai. S'il n'est là que pour « faire design »
(un surtitre, une pastille, un trait, une étincelle), il part.

## Le catalogue des motifs refusés

Chaque ligne a été refusée au moins une fois sur un vrai produit. La liste longue, avec ce qu'il
faut faire à la place, est dans [`references/catalog.md`](references/catalog.md).

**Typographie**
- Police **monospace** hors affichage réel de code : surtitres, numéros, étiquettes, taux,
  légendes, « commandes » décoratives. Pour des chiffres alignés : `font-variant-numeric:
  tabular-nums` dans la police du texte.
- **Surtitre** en capitales espacées au-dessus de chaque titre, surtout numéroté
  (« 01 · TOUT PILOTER »), ou précédé d'une étincelle (« ✦ … »).
- **Titres en dégradé**, et le **trait surligneur** sous un mot de chaque titre de section : une
  fois peut être un choix, à chaque section c'est un tic.
- Rangée de **puces à point coloré** en capitales (« • GRATUIT • FR + EN • SLASH »).

**Composants**
- **Badge pilule** au-dessus du hero (« Discord, mais mieux organisé »), pilules de **verre
  dépoli**, onglets en verre translucide, pastilles de stats en verre.
- **Point lumineux** « en ligne » / « toujours disponible » posé comme décor.
- **Fausse fenêtre** de navigateur ou d'application (trois points rouge-jaune-vert, barre
  d'adresse en monospace) et **faux tableau de bord** aux données inventées.
- **Stickers flottants** de commandes (`/play`, `/help`) collés autour d'une image.
- La **grille de cartes identiques** icône-carrée + titre + phrase, répétée section après section.
- Flèches « → » décoratives, étincelles ✦, emojis de décoration.
- **Barres, bandes ou rails colorés** autour d'une carte ou d'une section sans fonction.

**Mise en page**
- Le gabarit hero → trois atouts → grille de fonctionnalités → bandeau d'appel, chaque bloc avec
  son surtitre, son titre surligné et son paragraphe centré.
- **Textes posés sur un motif de fond** (semis, points, grille) : le motif vit dans les marges ou
  derrière une surface pleine, jamais sous une ligne de texte.
- Changements de fond **en bandes** qui coupent la page à des hauteurs arbitraires.
- Une **image énorme** sans rôle : la taille d'un visuel suit ce qu'il raconte, pas la place libre.

**Couleur**
- Pastels arc-en-ciel pour distinguer des rubriques, dégradé violet-bleu « tech », lueurs néon.
- Couleurs écrites en dur qui cassent un des deux thèmes : chaque couleur passe par un jeton
  défini en clair **et** en sombre, et une page embarquée (iframe) fixe son propre
  `color-scheme` au lieu de subir celui de l'hôte.

## Raconter la page

Le fond d'une bonne page tient à deux choses, qu'on règle **avant** le visuel :

- **Les textes** ([`references/copy.md`](references/copy.md)) : le h1 nomme la catégorie, le premier
  écran porte un fait dur, chaque titre nomme une chose, chaque bouton est un verbe et ce qu'on
  obtient, peu de mots par écran, aucune preuve ni donnée inventée.
- **Le plan** ([`references/page-plan.md`](references/page-plan.md)) : une ligne par section, une
  idée et une vraie image chacune, des dispositions qui varient, une fin de page calme. Puis le
  **rythme** : une seule échelle d'espacement, rien d'orphelin, des colonnes qui s'équilibrent.

Écrire tous les textes et le plan d'abord, dans un fichier à côté de la maquette ; construire
ensuite.

## Concevoir à la place

1. **Partir du contenu réel** : les vraies commandes, les vrais écrans, les vrais visuels du
   produit. Une preuve (une vraie réponse du bot, une vraie carte) vaut mieux que trois atouts.
2. **Une idée de mise en page par page**, pas un empilement de sections au même gabarit. Varier
   l'échelle : un grand moment, puis du texte serré, puis une liste dense.
3. **Typographie** : deux familles au plus (titres, texte), hiérarchie par la taille, la graisse
   et l'espace. Les étiquettes s'écrivent en casse normale.
4. **Décor** : il appartient à la scène (un objet, une illustration, une texture de surface), pas
   à l'interface (pastilles, points, traits).
5. **Navigation lisible** : chaque rubrique porte son libellé, jamais une icône seule ni une
   couleur pastel seule.

## Les images : composer, ne pas « sortir » une image

Une image toute faite, générée d'un bloc et posée telle quelle, est la version visuelle du slop :
un style qui n'est pas celui de la marque, une taille qui n'a pas de raison, rien qu'on puisse
réutiliser. **On compose.**

1. **Partir des visuels officiels** : la mascotte détourée, l'emblème, les vraies cartes, les
   vraies captures. Les découper et les réassembler avant d'envisager une génération.
2. **Ne générer que des pièces**, jamais la scène finie : un décor sans personnage, un objet, une
   texture, une lumière. Fond chroma `#00FF00` ou transparence quand la pièce sera détourée. Aucun
   texte, chiffre ou logo dans l'image.
3. **Le personnage reste l'officiel** : on ne le redessine pas, on le pose. Le style des pièces
   générées suit le sien (trait, palette, lumière), avec l'officiel joint en référence.
4. **La composition se fait dans la page** quand c'est possible (calques HTML/CSS, `<picture>`),
   sinon par un script qui empile les calques : elle reste modifiable.
5. **Taille et cadrage selon le rôle** : un visuel d'appel peut être grand, une illustration de
   rubrique ne dépasse pas son texte.
6. **Une illustration n'est pas une capture d'écran du site.**

Le détail (prompts de pièces, contrôle du style, erreurs déjà faites) est dans
[`references/images.md`](references/images.md).

## Relire avant de montrer

Toute maquette ou page passe ce contrôle **avant** d'être montrée :

1. Lancer [`scripts/slop-scan.js`](scripts/slop-scan.js) dans la page (navigateur piloté,
   `evaluate_script`, ou collé dans la console). Il liste les polices monospace hors `<code>`,
   les surtitres en capitales espacées, les titres en dégradé, les textes posés sur un fond à
   motif, les contrastes insuffisants et les badges pilule. Zéro ligne attendue, sauf exception
   justifiée.
2. Regarder la page dans **les deux thèmes**, et dans son contexte réel (une iframe dans la page
   hôte, pas seulement seule).
3. Relire le catalogue ci-dessus en cherchant chaque motif à l'œil : le script ne voit pas une
   fausse fenêtre ni une grille de cartes identiques.
4. Se demander pour chaque bloc : « qu'est-ce qu'il montre de vrai sur le produit ? »
5. Relire le rythme sur la capture, section par section (`references/page-plan.md`) : écarts
   réguliers, aucun bouton ou titre orphelin, colonnes équilibrées.
6. Lire chaque texte à voix haute (`references/copy.md`).

## Erreurs déjà payées

- Un gros skill de « goût » suivi à la lettre (tirages par scripts, quatre contrôleurs à cinq
  largeurs) : 2 h 27 et des centaines de milliers de tokens pour une page embarquée de 7 200 px, sans
  l'identité de la marque. Ses textes et son plan étaient bons : ils sont repris ici, pas sa
  machinerie.

- Une page validée par la mesure (aucun débordement) a été refusée comme « catastrophique » : la
  mesure ne juge pas le design. Regarder la capture et la comparer à une référence qui donne envie.
- Une police monospace sur des cartes de jeu, des taux et des étiquettes : refusée, « on la voit
  partout ».
- Des onglets en pilules de verre et un badge « ✦ Thème du jour » : refusés pour leur forme même.
- Un semis de motifs ajouté en fond de site passait sous les paragraphes : illisible par endroits,
  refusé. Le fond se masque sous la colonne de contenu.
- Une page embarquée chez un hôte en thème sombre a reçu le thème sombre du système sans que ses
  couleurs en dur suivent : le nom du produit est devenu invisible dans sa propre barre.
- Des illustrations générées d'un bloc, dans un style différent de la mascotte officielle, posées
  en très grand : « sortir une image toute préparée, non ». Composer à partir de l'officiel.
