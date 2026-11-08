# Catalogue détaillé : le motif, pourquoi il fatigue, quoi faire à la place

| Motif refusé | Pourquoi | À la place |
|---|---|---|
| Monospace hors code (surtitres, numéros, taux, étiquettes) | effet « terminal » plaqué sur un produit qui n'en est pas un ; vu partout | police du texte, `tabular-nums` pour aligner des chiffres |
| Surtitre numéroté « 01 · TOUT PILOTER » | numéroter des sections ne guide personne, c'est un tic de template | le titre seul, assez fort pour se suffire ; un repère réel si la page est longue (sommaire, ancre) |
| Surtitre en capitales espacées, étincelle devant | même famille ; ajoute une ligne de bruit à chaque section | supprimer ; si une catégorie compte, l'écrire en casse normale dans le texte |
| Badge pilule au-dessus du hero | rien à dire qui ne tienne dans le titre | le dire dans le titre ou la phrase d'accroche |
| Titre surligné à chaque section | un accent répété n'accentue plus rien | un seul accent sur la page, ou aucun |
| Titres en dégradé | illisibles en petit, et marqueur immédiat de page générée | couleur pleine, contraste par la graisse et la taille |
| Rangée « • GRATUIT • FR + EN » à points colorés | liste de mots-clés sans preuve | une phrase vraie, ou la preuve elle-même (nombre de serveurs, vraie commande) |
| Point vert « en ligne » / « toujours disponible » | état inventé, posé comme décor | un vrai état (statut mesuré) ou rien |
| Fausse fenêtre à trois points, barre d'adresse | cliché de maquette SaaS ; montre un faux | une vraie capture recadrée, ou une composition illustrée honnête |
| Faux tableau de bord à données inventées | promet une interface qui n'existe pas sous cette forme | la vraie interface, ou décrire ce qu'elle permet |
| Stickers `/commande` flottants autour d'une image | décor sans lecture ; souvent en monospace | une vraie réponse du bot, lisible, à sa vraie taille |
| Grille de cartes icône-carrée + titre + phrase répétée | uniforme, rien ne ressort, tout se ressemble | une liste dense et lisible, ou peu d'éléments mis en scène avec leurs vrais visuels |
| Pilules et onglets en verre dépoli | effet de mode, contraste faible | onglets dessinés dans la grammaire de la marque (bord, encre, ombre) |
| Pastels arc-en-ciel par rubrique | la couleur ne dit pas la rubrique | libellé + une couleur de marque |
| Texte sur un motif de fond | le motif traverse les lettres | motif dans les marges (masque horizontal) ou sous une surface pleine |
| Fonds en bandes horizontales | coupent la page à des hauteurs sans raison | un fond continu ; les sections se distinguent par l'espace et le contenu |
| Image énorme sans rôle | occupe l'écran sans rien dire | taille selon le rôle ; composer plusieurs pièces plutôt qu'un bloc |
| Bandes colorées décoratives autour d'une carte | accent sans fonction | rien, ou un vrai séparateur interne qui structure |
| Liseré latéral coloré « façon embed Discord » (`border-left` épais, ou `::before` de 3 à 6 px collé au bord d'une carte, d'une ligne, d'une récompense, d'une alerte) | tic le plus reconnaissable des pages générées ; la couleur ne dit rien que le contenu ne dise déjà | la couleur dans le visuel, l'icône ou un fond léger de la vignette ; l'état d'une alerte dit en mots. Seule exception : l'aperçu fidèle d'un vrai embed Discord |
| Carte dans une carte | les boîtes s'empilent sans dire de hiérarchie | une surface par région ; à l'intérieur, l'espace et un séparateur fin |
| Carte fantôme : trait fin et grande ombre floue sur la même boîte | deux bords pour un seul travail | choisir : un trait, ou une élévation courte (flou serré, faible opacité) |
| Ombre plus large que l'objet, ombre colorée | ne correspond à aucune hauteur | une petite échelle d'élévation, jamais une ombre plus grande que ce qui la porte |
| Tuile teintée autour de l'icône, au-dessus de chaque titre | la tuile pèse plus que la fonction qu'elle annonce | l'icône dans le texte, à sa couleur, ou une vraie image |
| Rayons qui ne s'emboîtent pas | l'arc intérieur se bat avec l'extérieur | rayon intérieur = rayon extérieur − marge, ou pas d'arrondi à l'intérieur |
| Bordure qui s'arrête aux coins | le parent arrondit et coupe, l'enfant porte le trait | le trait et le rayon sur la même boîte |
| Alerte tout en une teinte (rouge sur fond rouge pâle) | un feu tricolore, pas une palette | l'état dit en mots et en graisse ; un accent sourd sur fond neutre |
| Phrase entière en taille d'affichage | la taille remplace la décision de ce qui compte | quelques mots en grand, le reste en sous-titre à taille normale |
| Un mot en italique, en sérif ou en couleur dans un titre | accent de gabarit, vu partout | hiérarchie par la taille et la graisse ; un accent par page au plus |
| Hiérarchie plate (tout entre 14 et 18 px) | on ne voit pas ce qui compte | peu de tailles, au moins 1,25 × entre deux niveaux |
| Halo radial sans source derrière une section | une lumière qui n'éclaire rien | un fond plein ; une lumière seulement si un objet de la scène l'émet |
| Fond crème et accent terracotta par défaut | l'uniforme actuel des pages générées | la palette de la marque ; un accent de marque chaud reste permis, sur un fond choisi pour lui |
| Violet ou lavande en accent par défaut | même famille que le dégradé « tech » | la couleur de la marque, ou un neutre |
| Bandeau qui défile seul, curseur clignotant décoratif | réclament l'attention sans rien dire | une liste fixe ; un curseur seulement dans un vrai champ |
| Illustration faite de formes SVG assemblées | se lit comme un bouche-trou | l'officiel composé ([`images.md`](images.md)) |
| Chaîne « A · B · C », « → » collé aux boutons | métadonnées en guirlande, flèche de gabarit | une phrase, ou des champs séparés ; le verbe du bouton suffit |
| `transition: all`, carte qui grossit au survol, rebond élastique | animer tout, c'est ne rien choisir | animer la seule propriété qui change (fond, bord, opacité), 120 à 200 ms, sans rebond |
| Même entrée animée sur chaque section, contenu masqué jusqu'à l'animation | si le script ne part pas, la page reste vide | un premier rendu complet sans animation ; un seul moment animé, s'il sert |

Un **point de statut** reste permis quand il dit un état réel et s'accompagne d'un mot
(« En ligne », « Épuisé ») : c'est le point seul, décoratif ou pulsant, qui est refusé.

Les motifs propres aux écrans d'application (tableaux de bord, collections, boutiques,
back-office) sont dans [`app-ui.md`](app-ui.md).

> Lignes ajoutées d'après kill-ai-slop (yetone, Apache 2.0), impeccable (pbakaus, Apache 2.0),
> no-ai-design-slop (Meng To, MIT) et frontend-design (Anthropic, Apache 2.0), reformulées.

## Une page embarquée (iframe)

- Elle ne connaît pas le thème de son hôte : fixer `color-scheme` et des jetons explicites, ou
  suivre `prefers-color-scheme` **avec toutes les couleurs** en jetons.
- Elle est vue dans un cadre plus étroit que l'écran : concevoir à la largeur du cadre réel.
- Pas de barre de navigation de site complet : l'hôte a déjà la sienne ; une ancre ou deux
  suffisent.
