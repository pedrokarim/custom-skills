---
name: flat-pixel-art-scenes
description: Produit des scènes en pixel art minimaliste à grands aplats, profondes et calmes, puis les anime en boucle (GIF ou fond de menu de jeu) – un générateur d'images pour l'image fixe, un script fourni pour l'animation. À utiliser dès qu'il est question de fond d'écran-titre ou de menu, de décor ou de paysage en pixel art, de « scène à plans superposés », de fond « avec de la profondeur », de GIF pixel art en boucle, ou de s'inspirer du style d'une image de référence pour créer un décor original ; même si la demande ne dit ni « pixel art » ni « animation », dès lors qu'il faut une illustration d'ambiance pour un jeu ou une page.
---

# Scènes pixel art à aplats, animées en boucle

Ce skill décrit un procédé qui a fait ses preuves : obtenir d'un générateur d'images une scène
dans un style très précis, la ramener à une vraie grille de pixels, puis l'animer par le code.

Le résultat attendu : une image **vaste, silencieuse et profonde**, faite de quelques grandes
formes plates, où une ou deux petites choses bougent en boucle.

Regarder les exemples avant de commencer, ils disent plus que le texte :

- `assets/examples/good-crimson-tree.gif` et `good-last-candle.gif` : le résultat visé ;
- `assets/examples/good-*-raw.png` : ce que le générateur a rendu, avant traitement ;
- `assets/examples/bad-too-detailed.png` : **l'erreur à ne pas refaire** (voir plus bas).

## Le style, en une phrase

Peu de formes, peu de couleurs, beaucoup de vide, et la profondeur obtenue par des **paliers
de valeur** plutôt que par du détail.

Les règles complètes, avec la raison de chacune, sont dans `references/style.md`. À lire avant
d'écrire le premier prompt, et à relire si un résultat « ne fait pas le style ».

## L'erreur qui coûte un essai

Demander « du pixel art détaillé, avec des plans et de la volumétrie » donne
`bad-too-detailed.png` : une image dense, texturée, pleine d'accessoires. Elle est jolie, et
elle est à l'opposé du style. Les mots « détaillé », « riche », « volumétrique », « dramatique »
tirent le générateur vers l'illustration fantastique classique.

Ce qui fonctionne est de **décrire le style par ses contraintes** : aplats, une famille de
teintes, un accent, du vide, et dire explicitement quoi éviter. Si un doute subsiste, retirer
du détail.

## Procédé

### 1. Comprendre la référence, sans la copier

Quand l'utilisateur fournit des images d'un artiste qu'il aime, le but est d'en **extraire les
principes**, jamais de reproduire l'image, ni de la recolorer.

- Regarder plusieurs images, pas une seule : un style se voit dans ce qui se répète.
  Une seule image fait prendre un sujet pour un style.
- Pour un GIF ou une vidéo, extraire quelques images réparties sur la durée :
  `ffmpeg -i ref.gif -vf "select='not(mod(n\,20))'" -fps_mode vfr -frames:v 3 ref-%02d.png`
- Décrire ce qui est constant : nombre de teintes, traitement des plans, place du vide,
  échelle des personnages, façon de figurer la lumière.
- Laisser de côté ce qui signe l'artiste : un motif récurrent, un symbole, une marque en bas
  de l'image. On emprunte une grammaire, pas une signature.
- Ne pas envoyer l'image de l'artiste au générateur : la description écrite suffit, et elle
  garantit un résultat original.

### 2. Écrire le prompt

Partir de `references/prompt-template.md`. Il se compose de quatre blocs : le style (identique
d'une scène à l'autre), la composition, la scène, les interdits.

Trois points décident du résultat :

- **Le bloc de style passe avant la scène**, et dit qu'il compte plus qu'elle.
- **Une seule famille de teintes et un seul accent**, nommés précisément. L'accent ne va que
  sur un ou deux objets : c'est ce qui le rend visible.
- **La scène est une liste de plans, du fond vers l'avant**, chacun décrit comme une forme
  plate. Pas une liste d'objets.

Si l'image doit recevoir une interface (logo, boutons), le dire : réserver un tiers calme et
placer les sujets ailleurs.

### 3. Générer

Avec Codex, dans un dossier vide et isolé du projet :

```
codex exec -C <dossier> --skip-git-repo-check -s workspace-write --ephemeral - < prompt.md
```

Demander deux variantes à la fois (deux teintes, deux scènes) : comparer coûte moins cher que
de retoucher un prompt à l'aveugle. Tout autre générateur d'images convient ; seul le prompt
compte.

### 4. Juger

Regarder l'image et la comparer aux exemples. Elle est bonne si :

- on compte les plans sans hésiter, et le plus lointain se confond presque avec le ciel ;
- la moitié de l'image au moins est vide ;
- l'accent saute aux yeux alors qu'il occupe très peu de place ;
- le personnage est minuscule.

Elle est à refaire s'il y a des textures, des contours, des dégradés lisses, ou plus de deux
points d'intérêt.

### 5. Animer

Ne pas demander plusieurs images au générateur pour en faire une animation : il ne redessine
jamais deux fois la même scène, et l'image « saute ». On anime l'image fixe.

```
python scripts/animate.py --src scene.png --out out/scene.gif --horizon 0.735 \
    --stars 9 --petals 22 --petal-color 150,28,44 --petal-box 0.04,0.30,0.34,0.52
```

Le script fait deux choses :

1. il **ramène l'image à une vraie grille** (334 × 188 par défaut) avec une palette réduite.
   Un générateur dessine des « pixels » qui ne tombent sur aucune grille et des aplats qui
   cachent des dégradés ; cette étape rend l'image réellement plate ;
2. il **anime de petits éléments** par-dessus, tous périodiques sur la durée de la boucle,
   pour que le GIF se referme sans saut.

Effets disponibles : `--horizon` (ligne d'eau, active l'ondulation du reflet), `--stars`,
`--petals` (particules qui tombent d'une zone vers l'eau, avec leur reflet), `--flicker`
(fait vaciller tout ce qui est couleur de feu), `--fireflies`. `python scripts/animate.py -h`
donne la liste complète.

Régler `--horizon` en regardant l'image : c'est la hauteur de la ligne d'eau, en fraction de
la hauteur totale. Trop haut ou trop bas, l'ondulation déforme le décor au lieu du reflet.

Dépendances : `pillow` et `numpy`. Les installer dans un environnement isolé si besoin :
`python -m venv venv && venv/Scripts/python -m pip install pillow numpy`.

### 6. Vérifier

Extraire une image du GIF et la regarder, plutôt que de supposer :
`ffmpeg -i scene.gif -vf "select=eq(n\,10)" -frames:v 1 check.png`

Deux défauts reviennent :

- **l'accent a disparu.** La réduction de palette dépense ses couleurs sur les grandes
  surfaces ; un accent de quelques pixels n'y survit pas. Le script rétablit déjà les tons
  chauds. Pour un accent froid, monter `--colors` ;
- **le reflet ondule au mauvais endroit** : corriger `--horizon`.

Enfin, regarder la boucle en mouvement, ou le demander à l'utilisateur : une image fixe ne
dit pas si le rythme est agréable.

## Intégrer dans un jeu

Un GIF convient à une page ou un aperçu. Dans un jeu, mieux vaut embarquer l'image fixe
pixelisée (`*-still.png`, une cinquantaine de Ko) et rejouer les petits effets en direct :
c'est plus fluide, et le fond peut réagir (parallaxe, heure, thème).

Avant d'ajouter une image à un dépôt, vérifier qu'il n'a pas pour règle de n'embarquer aucun
fichier binaire. Si c'est le cas, `scripts/export_indexed.py` écrit l'image **dans le code** :
un module TypeScript contenant la palette et les pixels en plages de couleur (une trentaine de
Ko pour une scène de 334 × 188, bien moins une fois compressé).

```
python scripts/export_indexed.py --src scene.png --out src/data/menuart.ts --name MENU_ART
```

Le décodage tient en dix lignes ; il est donné en tête du script. Si le dépôt exige en plus que
tout soit *généré* par le code, le signaler : une image embarquée, même en texte, reste une
exception à cette règle, et elle doit être documentée.

## Ajouter un effet

Chaque effet de `scripts/animate.py` est une petite fonction qui reçoit l'image de base, la
phase de la boucle (de 0 à 1) et dessine quelques pixels. Pour en ajouter un, respecter la
seule contrainte qui compte : **tout mouvement doit revenir à son point de départ quand la
phase revient à 0**, c'est-à-dire dépendre de `sin(phase × 2π × entier)` ou de
`(phase × entier + décalage) mod 1`.
