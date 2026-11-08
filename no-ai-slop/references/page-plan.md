# Le plan de la page, puis le rythme

Écrire le plan avant de construire : une ligne par section, avec son idée unique, sa vraie image
(et de quel genre : l'objet, son usage, une interface réelle, un rendu réel, une illustration
composée) et sa disposition. Le plan se relit en une minute ; s'il est confus, la page le sera.

> Principes du plan adaptés de la référence `sections.md` de tasteskill (leonxlnx/taste-skill,
> licence MIT, voir `LICENSE-taste-skill.txt`).

## Le plan

- **Le hero dit la catégorie, un fait dur et l'action principale,** avec la vraie chose à côté.
- **Chaque section montre du vrai :** un rendu réel du produit, sa vraie interface, de vraies
  icônes, une illustration composée à partir de l'officiel. Une section sans image n'est permise que
  pour une FAQ, des prix ou un tableau, et deux sections sans image ne se suivent jamais.
- **Un seul objet ne porte pas la page :** l'objet principal mène le hero et deux sections au plus ;
  les autres sont portées par un autre genre d'image.
- **Une idée par section,** un h2, une action au plus en plus de l'action principale.
- **Fusionner les blocs courts :** une FAQ ou une ligne de faits trop courte pour tenir seule
  rejoint la section du dessus, sans titre ni fond à elle.
- **Dispositions :** une même disposition (deux colonnes, grille 2 × 2, trois cartes) deux fois
  au plus dans la page, jamais deux fois de suite. Après deux sections chargées, une plus calme
  (FAQ, liste) ; le dernier tiers de la page est calme avant la fin.
- **Preuves petites et exactes,** seulement réelles : pas de rangée de gros chiffres, pas de liste
  à coches, pas de mur de logos.
- **Deux boîtes de profondeur au plus :** une carte et son image, un panneau et son interface.

## Le rythme et les espacements

Le défaut qu'on remarque le plus après le slop. À vérifier sur la capture, section par section :

- **Une seule échelle d'espacement, des écarts selon la parenté :** les valeurs viennent d'une
  petite échelle à vrais sauts (4, 8, 16, 32, 64…), et l'espace dit ce qui va ensemble : serré dans
  un groupe, large entre deux groupes. Le même écart entre toutes les sections ; un titre est plus
  près de son contenu que de la section du dessus. Une seule valeur partout (le même `gap` dans
  chaque bloc) aplatit la page autant qu'un écart au hasard. Pas de section collée, pas de trou
  sans raison.
- **Rien d'orphelin :** pas de bouton seul dans une colonne vide, pas de ligne de grille à moitié
  vide, pas de titre seul en haut d'une moitié d'écran vide.
- **Les deux colonnes d'une section s'équilibrent :** si le texte fait trois lignes et l'image un
  écran, réduire l'image ou passer en une colonne.
- **Une seule taille d'affichage géante par page :** un paragraphe entier en corps de titre écrase
  la section.
- **La hauteur suit le contenu :** pas de règle « une section par écran » ; une page embarquée
  (iframe) reste courte, quatre à six sections.
- **Mêmes bords gauche et droit** pour tous les blocs, sur la grille de la page.

## Ce qu'on ne reprend pas de tasteskill, et pourquoi

Essayé en entier sur une seule page embarquée : 2 h 27, environ 630 000 tokens, une page de
7 200 px de haut.

- **Le tirage des mises en page, palettes et polices par scripts :** il impose son propre système à
  la place de celui de la marque, et toutes ses paires de polices « logiciel » contiennent une
  monospace.
- **Les quatre contrôleurs dans Chrome sans interface, à cinq largeurs, en boucle :** ce sont eux
  qui coûtent les heures. Le script `slop-scan.js` et deux captures (390 et 1440, deux thèmes)
  suffisent.
- **« Une section par écran » à hauteur fixe :** donne des pages interminables et des sections
  creuses.
- **Les effets WebGL, diaporamas et animations au défilement :** inutiles sur une page embarquée,
  dont l'hôte bloque souvent les scripts.
- **La fausse interface remplie de données plausibles :** contraire à « aucune donnée inventée ».
