---
name: pixel-art-assets
description: Fait dessiner par Codex (son outil de génération d'images) des assets de jeu en vrai pixel art, puis les ramène au pixel près par des scripts : planches d'objets, d'icônes, d'accessoires ou de personnages en grille 3×3 ou 4×4, tilesets de terrain qui se raccordent (15 pièces, double quadrillage), textures raccordables, textures animées en boucle (eau, lave, reflets), animations courtes sur une bande. Grille de pixels détectée, fond chroma retiré sans percer les objets, trous rebouchés, palette commune, contrôle des raccords. À utiliser dès qu'il faut des sprites, des icônes d'inventaire, des items, des props, du décor, un tileset, une texture ou une animation en pixel art pour un jeu, un site ou un bot, qu'on parle de SpriteCook, de « planche », de « grille d'items », de « faire générer par Codex », ou qu'une image générée « n'est pas du vrai pixel art », a des trous, un liseré vert ou une grille trop fine ; même si la demande ne dit pas « pixel art ».
---

# Assets pixel art générés par Codex

Un générateur d'images ne sait pas faire du pixel art : il en peint l'apparence, sur une grille
qu'il choisit, avec du flou et des milliers de nuances. Le procédé ici le contraint au maximum
(planche en grille, fond chroma, taille des blocs imposée, damier de référence), puis des scripts
ramènent l'image à son vrai pixel art. Codex dessine ; les scripts garantissent.

Les scripts sont dans `scripts/` et ne demandent que Python 3 et Pillow. Chacun s'explique avec `-h`.

| Script | Rôle |
|---|---|
| `make_prompt.py` | consigne Codex par type : `sheet`, `texture`, `tileset`, `strip` |
| `checkerboard.py` | damier de référence qui impose la taille d'un pixel d'art |
| `generate.py` | lance `codex exec` avec la consigne et les images jointes, attend la fin |
| `cut_sheet.py` | découpe une planche en sprites propres (grille, fond, liseré, trous, palette) |
| `pixelize.py` | ramène une image entière (texture, tileset, fond) à sa grille, palette réduite |
| `tileset.py` | gabarit 15 pièces à faire habiller, carte d'essai, contrôle du raccord |
| `texture.py` | contrôle du raccord, aperçu 3×3, animation en boucle par le code |

## Le procédé

1. Une planche, pas une image par objet. Une série (icônes, objets, décor d'une zone) se
   demande d'un coup, en grille 3×3 ou 4×4 : même taille de pixel, même contour, même lumière.
   Une image par objet donne une série qui ne se ressemble pas.
2. Même gabarit mot pour mot pour toute la série. `make_prompt.py` écrit toujours la même
   consigne ; seuls le thème et la liste des cases changent. Une planche réussie devient
   l'image de référence de style des suivantes.
3. Fond chroma plat. Vert `#00FF00` par défaut, magenta `#FF00FF` (`--chroma magenta`) si
   les objets sont verts. Jamais de transparence demandée au générateur : il ne la fait pas.
4. La taille des blocs est imposée, et montrée. La consigne dit « chaque pixel d'art est un
   bloc de N × N », et `checkerboard.py` donne un damier dont chaque case est un pixel d'art
   (« Grille d'échiquier » : sans lui, le modèle choisit une grille trop fine). Donner la taille
   de **chaque objet** en pixels d'art (`--art 32`), pas celle de la planche.
5. Générer, chaque planche dans son dossier ; plusieurs générations tournent en parallèle
   (deux minutes chacune environ).
   ```
   python make_prompt.py sheet --out icons.txt --file icons.png --grid 4x4 --art 32 \
       --theme "cozy fantasy RPG inventory" --items "red potion;gold coin;...16 objets" \
       --refs "image 1 is a checkerboard whose squares are exactly one art pixel: draw on that pixel grid, never finer. Do not draw the checkerboard itself."
   python checkerboard.py --out damier.png --art 128 --size 1536      # 4 cases x 32 = 128
   python generate.py --prompt icons.txt --dir gen-icons --expect icons.png --ref damier.png
   ```
6. Découper et nettoyer, puis regarder la planche contact (`_contact.png`) :
   ```
   python cut_sheet.py gen-icons/icons.png out/ --grid 4x4 --canvas 32x32 --colors 32 \
       --keep-holes 4,16 --names potion,coin,...
   ```
   `--keep-holes` liste les cases dont les trous sont voulus (anneau, clé, filet, grille).
7. Regarder avant de livrer, à taille réelle et agrandi au plus proche voisin, sur fond
   sombre et clair : contour continu, aucun point vert, aucun trou, même taille de pixel.

Les gabarits de consigne, ce qu'ils exigent et pourquoi : `references/prompts.md`.

## Les autres types

- Texture raccordable : `make_prompt.py texture`, puis `pixelize.py --block <taille>` et
  `texture.py check` (bords opposés comparés aux pixels voisins) et `texture.py tile` (aperçu 3×3).
- Texture animée (eau, lave, reflets, brume) : générer UNE texture raccordable, puis
  `texture.py animate` la fait bouger par le code (`--scroll`, `--wave`, `--shimmer`). Chaque
  effet boucle et garde le raccord par construction. Le générateur, lui, ne garde ni la grille
  ni le raccord d'une image à l'autre.
- Tileset de terrain : `tileset.py template` dessine le gabarit 15 pièces en deux aplats ;
  joint à la consigne `make_prompt.py tileset`, il impose taille, grille et silhouettes, et Codex
  ne fait qu'habiller. Puis `pixelize.py --block <agrandissement>`, `tileset.py check` et
  `tileset.py preview` (carte d'essai). Ordre des tuiles et rendu en jeu : `references/tilesets.md`.
- Animation courte (flamme, idle) : `make_prompt.py strip`, une bande d'images sur fond
  chroma, avec un damier de la hauteur de la bande. Découper avec
  `cut_sheet.py --grid 1xN --keep-cell --gif 10` : les cases ne sont pas rognées, chaque image
  garde le même cadre et la partie fixe ne saute pas d'une image à l'autre.
- Fond ou scène d'ambiance : voir le skill `flat-pixel-art-scenes`.

## Erreurs déjà payées

- Des trous dans les objets : la découpe prenait les feuilles vert vif pour le fond (règle
  « très vert = fond »). Le fond se reconnaît par la **distance à sa couleur mesurée**, avec un
  seuil serré ; le liseré se traite à part, au bord seulement ; un trou fermé se rebouche.
- Une grille mesurée trop fine. Une détection de période prenait un diviseur (4 au lieu de
  8) : tout multiple de 8 est multiple de 4. Garder la **plus grande** période presque aussi
  bonne que la meilleure (`pixelize.detect_block`).
- Un liseré vert autour des sprites. Pixels de mélange entre le fond et le contour : retirés
  au bord ; à l'intérieur, remplacés par la couleur des voisins. Sur une planche sans aucun objet
  vert, `--no-chroma-hue` retire aussi les mélanges sombres.
- Les mailles d'un filet rebouchées. Le bouchage ne sait pas qu'un trou est voulu :
  `--keep-holes`.
- Une planche découpée trop tôt. Codex a écrit l'image, puis l'a réécrite deux minutes plus
  tard, recadrée à la taille demandée. Ne lire l'image qu'une fois Codex terminé
  (`generate.py` attend la fin) et garder la sortie brute à côté des sprites.
- Une rangée perdue. Sur une image qui se divise exactement par le bloc, un décalage de
  grille estimé faisait perdre une rangée : la grille part alors de 0.
- Détails plus fins que la grille. En habillant un gabarit, le modèle peint parfois de
  l'herbe au pixel près : `pixelize.py --block` les ramène à la grille du gabarit ; la détection
  automatique, elle, ne trouve rien de sensé sur une telle image (donner `--block`).

## Exemples

Dans `assets/`, tous sortis de ce procédé sans retouche : `example-icons-raw.png` (la planche
rendue par Codex) et `example-icons.png` (les seize sprites découpés en 32 × 32, palette
commune), `example-tileset.png` et sa carte d'essai `example-tileset-map.png`,
`example-water.gif` (une texture, animée par `texture.py`) et `example-torch.gif` (bande de six
images).

## D'où vient le procédé

Planches de décor et de pièges d'un jeu (neuf terrains, 2026) ; puis la méthode de SpriteCook,
étudiée dans son application et ses dépôts libres (licence MIT) : génération en grand puis
grille détectée, damier de référence, planches 3×3 et 4×4, gabarits de tileset à double
quadrillage. Détail et liens : `references/prompts.md` et `references/tilesets.md`.
