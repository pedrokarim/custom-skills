# Les écrans d'application

Un tableau de bord, une collection, une boutique, un inventaire, un back-office : on y revient
pour faire quelque chose. L'outil s'efface devant la tâche. L'univers de la marque prête quatre
choses à ces écrans : la typographie, la palette, la densité et un seul geste signature. Jamais la
mise en page, la navigation ni les contrôles, qui restent familiers.

> D'après le mode « Operate » d'impeccable (pbakaus, Apache 2.0) et la référence dashboard
> d'ui-craft (Eduardo Calvo, MIT), reformulés.

## Structure

- **On voit où l'on est,** la tâche principale et l'action suivante.
- **La densité suit le travail :** un tableau serré et des contrôles compacts sont justes quand on
  compare ou qu'on gère. Un écran d'application n'a pas les espacements d'une page marketing.
- **Grouper par l'espace et l'alignement** avant d'ajouter un bord, une carte ou un fond. Une carte
  sert aux éléments pairs d'une collection, pas à chaque section.
- **Un seul vocabulaire de composants,** et des contrôles standard (onglets, menus, tableaux,
  dialogues) plutôt que réinventés.
- **La fenêtre modale n'est pas le premier réflexe :** une petite action se fait sur place, un
  réglage complexe vit dans une page stable.

## Motifs refusés

| Motif refusé | À la place |
|---|---|
| Grille de quatre à huit indicateurs de même poids | un indicateur principal, deux à quatre secondaires, le reste à un clic |
| Pilules de tendance vertes et rouges, flèches | un texte secondaire simple : « +12 depuis hier » |
| Statut en pilule colorée dans un tableau | un petit point et un mot (« Épuisé ») ; la couleur n'est jamais seule |
| En-têtes de tableau en capitales espacées | casse normale, graisse moyenne |
| Mini-courbes et anneaux de progression à la place du contenu | le nombre, dans une phrase ou une colonne |
| Bouton plein dans chaque barre d'outils | des boutons discrets ; un seul bouton plein par écran |
| Action destructive habillée en action principale | un style à part, un verbe et un objet, une confirmation qui nomme l'objet |
| Tableau de bord « éditorial » : salutation géante, sérif d'affichage, chiffres de texte | une police de lecture, des chiffres `tabular-nums` alignés, la hiérarchie par la taille |
| Accent saturé sur les états inactifs | l'accent réservé à l'actif et à l'action |
| Information visible seulement au survol | visible au repos, ou atteignable au clavier et au toucher |
| Menu ou infobulle coupé par un `overflow: hidden` | `<dialog>`, popover ou position fixe, borné à l'écran |

## Chaque état est dessiné

Avant le cas nominal, lister les états que l'écran peut atteindre et dessiner chacun :

- **Chargement :** un squelette à la forme du contenu final, montré seulement si l'attente dépasse
  environ 200 ms ; pas de spinner au milieu du contenu.
- **Vide :** la première visite explique et propose l'action. Un **filtre sans résultat** est un
  autre état : « Aucun objet ne correspond », avec de quoi effacer le filtre.
- **Erreur :** la cause, une action pour s'en sortir, la saisie conservée.
- **Partiel, hors ligne, désactivé, sélectionné, succès,** quand ils peuvent arriver ; un succès dit
  ce qui s'est passé et ce qui suit.
- **Contenu réel :** des noms très longs, des listes de 0, 1 et 200 éléments. La mise en page tient.

## Tableaux et formulaires

- Un tableau large défile dans son propre conteneur ; l'en-tête reste visible sur une longue
  liste ; au-delà de quelques centaines de lignes, pagination ou virtualisation.
- Les nombres sont alignés à droite, en `tabular-nums`, avec leur unité.
- Le libellé est au-dessus du champ, jamais remplacé par le texte d'exemple. L'erreur s'affiche
  sous le champ après la saisie, pas dès l'ouverture.
- Des boutons ou des cases pour cinq choix ou moins, pas un menu déroulant. Des champs d'au moins
  16 px sur mobile.
