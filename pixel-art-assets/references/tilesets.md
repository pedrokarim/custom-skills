# Tilesets de terrain à 15 pièces (double quadrillage)

## Le principe

La carte stocke des cases pleines ou vides (herbe ou pas). Les tuiles se dessinent entre
les cases, décalées d'une demi-tuile : chaque tuile lit les quatre cases qui l'entourent.
Pleines ou vides, cela fait 16 combinaisons ; la combinaison « tout vide » ne se dessine pas
(ou montre la surface du dessous) : 15 pièces. Avantage sur l'autotile classique à 47 pièces :
15 dessins suffisent, et toutes les transitions sont couvertes.

## Masque et ordre des tuiles

Bits des coins : haut-gauche 1, haut-droite 2, bas-gauche 4, bas-droite 8.

```
mask = (plein(x-1, y-1) ? 1 : 0) | (plein(x, y-1) ? 2 : 0)
     | (plein(x-1, y)   ? 4 : 0) | (plein(x, y)   ? 8 : 0)
```

Le masque désigne une case de la planche 4 × 4 (lue de gauche à droite, puis de haut en bas) :

```
FRAME_BY_MASK = [12, 15, 8, 9, 0, 11, 14, 7, 13, 4, 1, 10, 3, 2, 5, 6]
colonne = frame % 4, rangée = frame // 4
```

C'est l'ordre du gabarit libre de SpriteCook (`spritecook-tileset-gen`, licence MIT) et de
leur page « dual grid tileset template » ; `tileset.py template` le reproduit exactement (vérifié
coin par coin contre leur exemple 128 × 128). Une tuile se pose en `(x * T - T/2, y * T - T/2)`.

## Le procédé qui a marché

1. `tileset.py template --tile 32 --scale 8` : gabarit 128 × 128 agrandi à 1 024 px, surface A
   en vert clair, surface B en brun (`--empty` : surface unique, le vide en vert chroma).
2. `make_prompt.py tileset --surfaces "herbe…" "terre…"`, gabarit joint (`generate.py --ref`).
   Codex garde la silhouette au pixel près et ne fait qu'habiller.
3. `pixelize.py tileset.png tileset-32.png --block 8 --colors 16` : retour à 128 × 128. Donner
   `--block` (l'agrandissement du gabarit) : la détection automatique échoue quand le modèle a
   peint des détails plus fins que la grille.
4. `tileset.py check` : la tuile pleine doit se raccorder à elle-même (écart entre bords opposés
   comparable à l'écart entre deux pixels voisins). Sinon, régénérer : chez SpriteCook, environ
   une variation sur trois a ce défaut.
5. `tileset.py preview --empty-tiles` : une carte d'essai avec une grande tache, un îlot et une
   diagonale. Les raccords se jugent là, pas sur la planche.

## Limites

- Les diagonales gardent des marches (c'est la forme du gabarit), adoucies par les coins arrondis.
- Plusieurs terrains : réutiliser le même gabarit pour chacun (herbe, sable, neige, lave) ; ils
  partagent alors la même géométrie et se mélangent bien.
- Vue de côté (plateforme) et isométrique : autres gabarits, pas encore éprouvés ici.
