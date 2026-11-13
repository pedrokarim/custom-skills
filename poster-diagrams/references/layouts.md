# Les gabarits

Chaque gabarit (`flow`, `columns`, `metro`, `matrix`, `zones`, `layers`, `sequence`) est une planche complète, avec un contenu d'exemple neutre, dans
`assets/kit/templates/`. Son aperçu est dans `assets/examples/`. On le copie avec
`init.mjs --board <nom> --layout <gabarit>`, puis on remplace le contenu.

Repères communs :

- Planche de 1600 px de large, marges de 64 px. La scène commence vers `top: 236px`, sous
  l'en-tête. La hauteur (`--h`) s'ajuste au contenu : pas de vide sous le dernier bloc.
- Largeur utile : de 64 à 1536 px, soit 1472 px.
- Pour 5 colonnes de 220 px : `left` = 64, 377, 690, 1003, 1316 (écart 93 px).
- Pour 5 colonnes de 162 px dans une zone : `left` = 70, 282, 494, 706, 918 (écart 50 px).
- Le centre d'un nœud = `left + width / 2` ; viser un point d'un nœud large :
  `to2 = (x visé - left) / width`.

## flow : une demande traverse une chaîne

Une entrée à gauche, un nœud `solid steps` au centre (liste numérotée), des services à droite,
éventuellement une colonne de « sources » à l'extrême droite.

- Chaque `<li data-id="s1">` de la chaîne est une ancre : un fil part de l'étape qui fait l'appel.
  `kit.css` étend les lignes jusqu'au bord du nœud, le fil part donc du cadre.
- Plusieurs fils vers le même nœud : des `to2` différents (0,16 / 0,3 / 0,44) et des `mid`
  décroissants (0,72 / 0,55 / 0,38) pour que les coudes ne se superposent pas.
- Un nœud sous la chaîne (file d'attente, résultat) se relie par `fs: 'b'`.

## columns : un échange entre acteurs

Cinq nœuds `col` de même hauteur, alignés. Le pied `.tech` donne la techno sous un filet.

- Les aller-retours se lisent comme une séquence : étiquettes numérotées (« 1. l'ordre »),
  aller à `fo: 0.2`, retour à `fo: 0.36` avec `lo: [0, 18]` (étiquette sous le fil).
- La seconde boucle (état, temps réel) prend l'autre encre, à `fo: 0.72`.
- Un fil qui saute une colonne passe **sous** les nœuds (`viaY`) ou **au-dessus** (`viaY`
  entre l'en-tête et les nœuds), jamais à travers.
- Hauteur des colonnes : celle du plus long texte, pas plus (262 px pour 4 lignes).

## metro : une procédure en stations

Une ou deux lignes déclarées dans `LINES` (stations = `[titre, phrase]`). La seconde ligne revient
de droite à gauche après un virage, et chaque station porte son numéro : la lecture reste claire.

- `highlight: [n]` remplit la station clé de l'encre de sa ligne (une par ligne, au plus).
- `X1 = 1356` laisse la place à l'étiquette de la dernière station ; le virage est à 1536.
- Le nom de chaque ligne (`.line-name`) dit ce qui la déclenche (« automatique, à chaque push »).
- Sous les lignes, un petit schéma de nœuds et un bloc `.facts` peuvent expliquer le moment clé.

## matrix : un inventaire dense

Une grille : clé de ligne en grand chiffre (`.key b`), une colonne par acteur, des éléments
séparés par un point d'encre chaude. Les durées propres à un élément passent entre parenthèses,
en gris, et ne se coupent jamais. Sous la grille, trois encarts `.facts` expliquent les
mécanismes qui rendent l'ensemble sûr.

- Une case vide reste vide.
- La colonne la plus creuse est la plus étroite (250 px).
- Trois à cinq lignes : au-delà, deux planches.

## zones : l'architecture d'ensemble

Une rangée d'entrées (CDN, plateformes), une zone « hébergement » qui contient les services et
un nœud central large (`solid wide`, en trois colonnes : ce qu'il est, ce qu'il reçoit, ce qu'il
lance), une zone « données » en bas, la liste des services extérieurs à droite (`.side` avec
`dl`), éventuellement la livraison (CI) en bas à gauche, reliée au bord de la zone (une zone peut
porter un `data-id`).

- Les entrées sont alignées au-dessus du service qu'elles alimentent : leurs fils sont droits.
- L'étiquette d'une zone se décale (`style="left:236px"`) pour ne pas tomber sur un fil.
- Le nœud central reçoit tous les fils par le haut, à l'aplomb de chaque service.

## layers : une pile traversée

Des couches empilées (`LAYERS` : nom, rôle, éléments, et `true` pour la couche forte), reliées
par des fils courts : la demande descend à gauche (`fo: 0.04`), la réponse remonte à droite
(`fo: 0.96`). Un fil en pointillés dans la marge gauche peut montrer un raccourci (un refus
anticipé qui remonte sans atteindre le métier).

- Une seule couche en encre pleine : celle où se joue l'essentiel.
- Hauteur de couche : 96 px pour un rôle sur deux lignes ; écart 30 px.
- Les éléments d'une couche tiennent sur une ligne ; sinon, la couche en fait trop.

## sequence : un protocole entre acteurs

Des acteurs en colonnes (`ACTORS`), une ligne de vie en pointillés sous chacun, et des messages
dans l'ordre (`MESSAGES`), numérotés automatiquement. Trois sortes d'entrées :

- `{ from, to, label, color }` : un message, flèche horizontale d'une ligne de vie à l'autre ;
- `{ note, on }` : une note posée sur la ligne de vie d'un acteur (le fait qui compte à cette
  étape : « l'identité vient du fournisseur, jamais du client ») ;
- `{ section }` : un intertitre qui coupe la séquence en temps (« Ensuite, à chaque appel »).

- Une couleur par sorte de jeton ou de donnée qui circule, et la légende le dit.
- Cinq ou six acteurs au plus ; au-delà, couper en deux séquences.
- La hauteur de la planche suit le nombre de messages (46 px par message, 64 par note) : la
  régler pour que les lignes de vie s'arrêtent avant la légende.
- Les intertitres ont un fond de papier : ils masquent les lignes de vie sous leur texte.

## Faire un gabarit nouveau

Partir du plus proche, garder la structure `board > head + stage + legend/brand`, et déclarer
`data-id` sur tout ce qu'un fil doit atteindre. Les contenus générés en script (stations,
couches, grille) se construisent **avant** le chargement de `wire.js`, qui attend les polices
puis trace les fils.
