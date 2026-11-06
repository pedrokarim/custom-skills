# Catalogue détaillé : le motif, pourquoi il fatigue, quoi faire à la place

| Motif refusé | Pourquoi | À la place |
|---|---|---|
| Monospace hors code (surtitres, numéros, taux, étiquettes) | effet « terminal » plaqué sur un produit qui n'en est pas un ; vu partout | police du texte, `tabular-nums` pour aligner des chiffres |
| Surtitre numéroté « 01 · TOUT PILOTER » | numéroter des sections ne guide personne, c'est un tic de template | le titre seul, assez fort pour se suffire ; un repère réel si la page est longue (sommaire, ancre) |
| Surtitre en capitales espacées, étincelle devant | même famille ; ajoute une ligne de bruit à chaque section | supprimer ; si une catégorie compte, l'écrire en casse normale dans le texte |
| Badge pilule au-dessus du hero | rien à dire qui ne tienne dans le titre | le dire dans le titre ou la phrase d'accroche |
| Titre surligné à chaque section | un accent répété n'accentue plus rien | un seul accent sur la page, ou aucun |
| Titres en dégradé | illisibles en petit, et marqueur immédiat de page générée | couleur pleine, contraste par la graisse et la taille |
| Rangée « • GRATUIT • FR + EN » à points colorés | liste de mots-clés sans preuve | une phrase vraie, ou la preuve elle-même (nombre de serveurs, vraie commande) |
| Point vert « en ligne » / « toujours disponible » | état inventé, posé comme décor | un vrai état (statut mesuré) ou rien |
| Fausse fenêtre à trois points, barre d'adresse | cliché de maquette SaaS ; montre un faux | une vraie capture recadrée, ou une composition illustrée honnête |
| Faux tableau de bord à données inventées | promet une interface qui n'existe pas sous cette forme | la vraie interface, ou décrire ce qu'elle permet |
| Stickers `/commande` flottants autour d'une image | décor sans lecture ; souvent en monospace | une vraie réponse du bot, lisible, à sa vraie taille |
| Grille de cartes icône-carrée + titre + phrase répétée | uniforme, rien ne ressort, tout se ressemble | une liste dense et lisible, ou peu d'éléments mis en scène avec leurs vrais visuels |
| Pilules et onglets en verre dépoli | effet de mode, contraste faible | onglets dessinés dans la grammaire de la marque (bord, encre, ombre) |
| Pastels arc-en-ciel par rubrique | la couleur ne dit pas la rubrique | libellé + une couleur de marque |
| Texte sur un motif de fond | le motif traverse les lettres | motif dans les marges (masque horizontal) ou sous une surface pleine |
| Fonds en bandes horizontales | coupent la page à des hauteurs sans raison | un fond continu ; les sections se distinguent par l'espace et le contenu |
| Image énorme sans rôle | occupe l'écran sans rien dire | taille selon le rôle ; composer plusieurs pièces plutôt qu'un bloc |
| Bandes colorées décoratives autour d'une carte | accent sans fonction | rien, ou un vrai séparateur interne qui structure |

## Une page embarquée (iframe)

- Elle ne connaît pas le thème de son hôte : fixer `color-scheme` et des jetons explicites, ou
  suivre `prefers-color-scheme` **avec toutes les couleurs** en jetons.
- Elle est vue dans un cadre plus étroit que l'écran : concevoir à la largeur du cadre réel.
- Pas de barre de navigation de site complet : l'hôte a déjà la sienne ; une ancre ou deux
  suffisent.
