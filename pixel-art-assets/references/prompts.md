# Consignes : ce qu'elles exigent, et pourquoi

`scripts/make_prompt.py` écrit les consignes. Elles sont en anglais (le modèle suit mieux) et
toujours construites de la même façon. Chaque phrase y est pour une raison :

| Exigence | Pourquoi |
|---|---|
| « Generate ONE image file and save it as X in the current directory » | Codex est un agent : sans nom de fichier, il se contente de décrire l'image, ou l'écrit ailleurs |
| Taille exacte de l'image, grille stricte de N × M cases égales | le script découpe par calcul ; une case décalée coupe un objet |
| Fond chroma plat `#00FF00` (ou `#FF00FF`), sans sol, ombre, dégradé ni trait de grille | le fond se retire par sa couleur ; une ombre portée devient un morceau de l'objet |
| « every art pixel is an exact N × N block », sans anti-aliasing, flou, dégradé ni tramage | c'est ce qui rend la planche ramenable à une vraie grille |
| Taille de chaque objet en pixels d'art (`--art 32`) | demander la taille de la planche donne des objets minuscules |
| Contour d'un pixel d'art, plus sombre, dans la couleur de l'objet | lisibilité à petite taille, et détourage net |
| Au plus N couleurs, 3 à 4 tons par matière, lumière en haut à gauche | une série cohérente ; la palette finale se réduit de toute façon au script |
| Un objet par case, centré, posé sur la même ligne de base, marge généreuse | même assise pour tous les sprites ; rien ne déborde sur la case voisine |
| Pas de texte, chiffres, logos ni étiquettes | le modèle en ajoute volontiers sur une « planche » |
| Les cases listées dans l'ordre de lecture (« row 1, column 1: … ») | un objet par case, à la bonne place |
| Damier joint en référence, décrit dans `--refs` | sans lui, le modèle choisit une grille trop fine |

## Le damier

`checkerboard.py --art <pixels d'art sur la largeur> --size <largeur>` : chaque case est un pixel
d'art, en deux gris neutres. Pour une planche 4 × 4 d'objets de 32 pixels d'art sur 1 536 px :
`--art 128` (blocs de 12 px). Pour une bande de 6 images de 32 : `--art 192 --height 256`.
La consigne précise « Do not draw the checkerboard itself » : sans cette phrase, le modèle le
recopie parfois en fond.

## Ce qu'on a retenu de SpriteCook

SpriteCook (application de génération de pixel art pour le jeu vidéo) génère avec des modèles
d'image généralistes (Gemini « Nano Banana », GPT-Image), puis retravaille. Leurs dépôts libres
(github.com/SpriteCook, licence MIT : `skills`, `spritecook-tileset-gen`) et leur blog décrivent :

- générer grand, puis détecter la grille : une image de 1 024 px contient « un pixel art de
  64 px rendu à l'échelle 16 » ; chaque bloc devient un pixel. Taille finale possible de 16 à
  912 px de large selon le réglage ;
- réduire la palette en local (8, 16, 32 ou 64 couleurs), plus proche couleur, sans tramage ;
- planches 3×3 ou 4×4 pour toute série d'objets ; « variations » = plusieurs planches, pas
  plusieurs objets ;
- leur gabarit d'icônes d'inventaire : « inventory icon sheet on pure white background…
  exactly a 4x4 grid… one icon per cell… crisp hard edges, no anti-aliasing, readable at small
  sizes… centered object and clean separation between cells… NO TEXT » ;
- le damier (« checkerboard trick ») en référence pour les petits sprites (16 et 32 px) ;
- une planche réussie devient la référence de style de la suivante : la référence fixe aussi la
  densité de pixels, plus sûrement qu'une taille écrite ;
- découper des objets dans une scène : demander la même scène où tout sauf les objets est
  remplacé par un magenta plat `#FF00FF`, puis retirer le magenta ; les objets gardent l'échelle
  et la place de la scène ;
- après détourage, réparer le contour (pixels de contour perdus, petits trous fermés), sans
  jamais reboucher un vide voulu ;
- les animations de personnages passent chez eux par un modèle maison (2 à 16 images) : pas
  reproductible ici. Une texture animée, en revanche, s'anime par le code (`texture.py`), comme
  leur vent dans les arbres : touffes qui se décalent de pixels entiers, jamais redessinées.

## Pièges de formulation

- « pixel art » seul donne un faux pixel art fin et lisse : toujours la taille des blocs.
- « transparent background » : le modèle peint un damier gris-blanc. Toujours un chroma plat.
- Un objet vert sur fond vert se fait percer à la découpe : `--chroma magenta`.
- Trop d'objets différents dans une case (« un village complet ») : la case déborde. Un objet
  simple par case, la scène se compose ensuite.
