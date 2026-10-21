# Le style, règle par règle

Ce document décrit le style visé et **pourquoi** chaque règle existe. Il a été établi en
comparant six images d'un même illustrateur de pixel art, fournies comme références de goût :
un sous-bois de champignons géants, un lac d'automne, un campement de nuit, un désert orangé,
une plaine rose aux monolithes, un arbre bleu dans une nuit grise.

Ces images n'ont en commun ni le sujet ni la couleur. Ce qui se répète, c'est la manière.
Ce sont ces constantes qu'on emprunte.

## 1. De grands aplats

Chaque forme est une surface de couleur unie. Un nuage est une seule masse claire. Une colline
est une bande. Un tronc est une silhouette.

- Pas de texture, pas de bruit, pas de tramage.
- Pas de contour.
- Quand une forme a besoin d'ombre, elle reçoit **une** seconde teinte, en aplat net.

*Pourquoi :* c'est ce qui donne le calme. Dès qu'une surface est texturée, l'œil s'y arrête, et
l'image cesse d'être vaste pour devenir chargée.

## 2. Une seule famille de teintes, et un accent

Toute l'image tient dans une teinte, déclinée en cinq ou six valeurs : bleu ardoise, rose,
orange, vert sombre. S'y ajoute **un** accent saturé, posé sur un ou deux objets seulement.

Dans les références : un arbre rouge dans un ciel bleu pâle ; un feuillage bleu électrique dans
une nuit grise ; des champignons cyan dans un sous-bois violet ; un feu de camp orange dans le
noir.

*Pourquoi :* l'accent ne se voit que s'il est rare. Deux accents se disputent le regard, et
plus aucun ne compte. La teinte unique, elle, donne l'unité qui fait qu'on reconnaît le style.

## 3. La profondeur par paliers

Cinq ou six plans sont empilés du fond vers l'avant. Chacun est d'une valeur unie, **un cran**
plus sombre (ou plus claire) que celui de derrière. Le plan le plus lointain se distingue à
peine du ciel.

*Pourquoi :* c'est toute la sensation de profondeur. Elle ne vient pas du détail ni de la
perspective, mais de cette perte progressive de contraste, comme dans une brume. Si deux plans
ont la même valeur, ils fusionnent et la profondeur s'effondre.

## 4. Beaucoup de vide

La moitié de l'image, au moins, est du ciel ou de la brume. Les sujets sont repoussés sur les
côtés ou vers le bas.

*Pourquoi :* le vide est le sujet. C'est lui qui rend le monde grand et le personnage petit.

## 5. Une silhouette minuscule

Un seul personnage, haut de quelques pixels, en silhouette pure, souvent de dos ou de profil.
Parfois un animal l'accompagne.

*Pourquoi :* il donne l'échelle. Sans lui, un arbre de dix pixels et un arbre de cent mètres
sont la même forme.

## 6. Une eau miroir

Le cinquième inférieur de l'image est souvent une eau parfaitement calme, qui reprend les
formes du dessus en silhouettes simplifiées.

*Pourquoi :* elle double la composition à peu de frais, assoit l'horizon, et offre une surface
idéale à animer (un reflet qui ondule).

## 7. La lumière en bandes plates

Un rayon de lumière est une large bande diagonale, d'**un cran** plus claire que le ciel, aux
bords en escalier. Pas de halo, pas de dégradé, pas de reflet d'objectif.

La lune, quand il y en a une, est un **cercle fin** d'un pixel, incomplet comme un croissant –
jamais un disque plein.

*Pourquoi :* un halo doux est un dégradé, et un dégradé casse l'aplat. La lumière doit obéir à
la même règle que tout le reste.

## 8. De gros pixels

L'image se lit comme si elle avait été peinte en 320 × 180 puis agrandie : chaque pixel est un
carré visible, les bords sont en escalier, rien n'est lissé.

*Pourquoi :* c'est la contrainte qui impose toutes les autres. À cette taille, on ne peut pas
détailler ; il ne reste que la forme et la couleur.

## 9. Un premier plan flou, parfois

Certaines images ajoutent, dans un coin, une silhouette très sombre et **floue** : une branche,
des herbes. Elle encadre la scène comme le ferait un objet trop près de l'objectif.

C'est la seule entorse à la règle des bords nets, et elle est facultative. À réserver aux
scènes fermées (une forêt, une grotte) ; sur un paysage ouvert, elle encombre.

## Ce qui signe l'artiste, et qu'on ne reprend pas

Les références partagent aussi des motifs personnels : un losange posé sur une fine ligne
pointillée verticale, des monolithes suspendus dans le ciel, une petite marque en bas de
l'image. Ce sont des signatures. On s'en tient à la grammaire décrite plus haut, et on invente
ses propres motifs.

## Reconnaître un échec

| Symptôme | Cause probable | Correction |
|---|---|---|
| Image dense, pleine d'objets | La scène est décrite comme une liste d'accessoires | La décrire comme une liste de plans ; plafonner le nombre de sujets |
| Textures, briques, feuilles dessinées | Mots « détaillé », « riche », « réaliste » dans le prompt | Les retirer ; ajouter « aplats de couleur unie, aucune texture » |
| Dégradés lisses, halos | « Lumière volumétrique », « lueur », « dramatique » | Demander des bandes plates d'un cran plus clair |
| Pas de profondeur | Plans de même valeur | Exiger qu'un plan se distingue du précédent par un cran de valeur |
| L'accent ne se voit pas | Trop d'objets colorés | Un seul accent, sur un ou deux objets |
| Lune en disque plein et lumineux | Formulation par défaut | « Cercle fin d'un pixel, incomplet » |

`assets/examples/bad-too-detailed.png` cumule les trois premiers symptômes : le prompt
demandait « des plans, de la volumétrie, des détails bien rendus ».
