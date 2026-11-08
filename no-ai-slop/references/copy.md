# Les textes d'une page

Dire ce que c'est et ce que ça fait, dans des mots qu'un inconnu comprend en cinq secondes. Chaque
phrase est une phrase qu'on dirait à voix haute à un client. Pas de métaphore, pas de poésie, pas de
concept inventé, pas de ton publicitaire.

> Adapté de la référence `copy.md` de tasteskill (leonxlnx/taste-skill, licence MIT, voir
> `LICENSE-taste-skill.txt`), ramené au français et à ce qui sert vraiment.

## Cinq règles

1. **Le h1 nomme la catégorie,** et pour une marque que personne ne connaît, à qui elle s'adresse,
   en 2 à 8 mots : « Bot Discord de modération et de jeux », « Planning d'équipe pour restaurants ».
   Jamais une devinette, un ordre, une ambiance ou un slogan au-dessus d'une phrase plate.
2. **Le premier écran porte un fait dur :** un nombre, un lieu, un prix, une date.
3. **Chaque titre contient un nom qui désigne une chose :** le produit, une de ses parties, une
   rubrique (prix, questions, modules) ou un chiffre. Une seule phrase de marque par page au plus,
   jamais en h1.
4. **Un bouton, c'est un verbe et ce qu'on obtient,** en 1 à 5 mots : « Ajouter le bot »,
   « Ouvrir un booster », « Voir les commandes ». Jamais « En savoir plus », « Découvrir »,
   « Explorer », « Cliquez ici ».
5. **Peu d'actions, une formulation chacune :** deux au plus dans le hero ; l'action principale se
   lit mot pour mot pareil dans la barre, le hero et la fin de page, et nulle part ailleurs en bouton
   plein.

## Version plate

Quand une phrase est vague : le nom de la catégorie d'abord, puis un chiffre, un lieu ou un prix
réel, sans figure de style.

| Vague | Plate |
|---|---|
| « Un outil. Toute ton équipe, au même rythme. » | Logiciel de planning gratuit pour petites équipes |
| « Chaque service, réglé » | Planning des équipes pour restaurants |
| « Là où la ville grimpe » | Salle d'escalade de 180 voies à Lyon |
| « Une seconde lecture de chaque mot » | Correcteur pour maisons d'édition |

## Titres et paragraphes

- **Sous le h1 :** comment ça marche et le bénéfice principal, 15 à 30 mots.
- **Titres de section :** nomment la chose (« Douze modules, activés un par un ») ou une affirmation
  courte et plate, 1 à 6 mots, deux lignes au plus. Pas d'ordre, pas de question (sauf dans une
  FAQ), pas de titre à deux-points, pas de titre qui ne se comprend qu'après la page.
- **Titres de carte :** un verbe et un objet (« Donne de l'XP et des niveaux »), une ligne.
- **Sous un titre :** une ligne à deux phrases (10 à 40 mots). Corps de carte : 25 mots au plus,
  avec un détail concret. Aucun paragraphe de plus de cinq lignes en 1440.
- **Peu de mots par écran :** 60 à 80 pour un logiciel, moins pour un lieu ou un service. Couper
  dans cet ordre : la deuxième phrase sous un titre, les corps de carte, une quatrième carte, une
  liste que l'image montre déjà.
- **Les nombres** dans des phrases, avec leur unité (« 100 pièces par vote »).
- **Les images** à côté d'un texte court, jamais à sa place ; tout le texte est du vrai texte.
- **Relecture :** lire chaque ligne à voix haute à un client. Si on ne comprend pas ce que fait le
  produit, réécrire.

## Ce qu'on n'invente jamais

- **Aucune preuve inventée :** pas d'avis, de note, de témoignage, de statistique, de nombre de
  clients, de logo de client, de récompense. Sans preuve réelle, une ligne de faits, ou rien.
- **Aucune donnée inventée dans une fausse interface :** pas de « 7 sur 10 actifs », pas
  d'interrupteurs factices, pas de tableau de bord rempli au hasard. On montre la vraie interface,
  ou on décrit ce qu'elle permet.
- **Aucun bouche-trou :** pas de crochets, de lorem ipsum, de « bientôt », de lien vers `#`.
- **Aucune légende sous une image :** l'image montre la chose ou n'est pas là. Les crédits tiennent
  sur une ligne de pied de page.
- **Chaque fait une seule fois,** avec une seule valeur et une seule formulation.

## Tics de cadence

Un texte généré se trahit autant par la forme de ses phrases que par ses mots.

- **Le contraste « pas X, mais Y »** sous toutes ses formes (« pas seulement », « plutôt que »,
  « au lieu de », « ce n'est pas… c'est ») : deux au plus par page, tous comptés ensemble. Dire Y
  directement.
- **Le titre en fragments** (« Douze modules. Une commande. ») : un par page au plus. Un nom, puis
  une ligne d'affirmation dessous.
- **La liste de négations** (« Pas de formulaire. Pas d'attente. ») : dire ce qu'il y a.
- **La queue en « -ant »** (« …, permettant de », « garantissant ») : finir la phrase sur son fait.
- **La révélation mise en scène** (« Le résultat ? », « Le secret : ») et la phrase de fin en
  formule : énoncer le fait, finir sur le dernier point concret.
- **Les chaînes « A · B · C »** et la flèche « → » collée aux boutons : une phrase, ou des champs
  séparés.
- **Les noms de démonstration** (Acme, John Doe, prénoms tirés d'un exemple) : seulement les noms
  du brief, ou du vrai contenu.
- **Le test du rival :** mettre le nom d'un concurrent dans le h1 et dans chaque titre. Si la
  phrase reste vraie, elle ne dit rien : la réécrire.
- **La sur-correction :** remplacer un tic par son synonyme (« plutôt que » à la place de
  « pas… mais ») le fait renaître. Réécrire la phrase, pas le mot.

> Tics adaptés de `copy-tells.md` de tasteskill (licence MIT, voir `LICENSE-taste-skill.txt`) et
> de no-ai-slop de Peter Yang (MIT), reformulés en français.

## Dans une interface

- **Une action garde son nom** tout au long du parcours : le bouton « Publier » donne le message
  « Publié », pas « Enregistré ».
- **Nommer comme l'utilisateur :** il gère ses notifications, pas une « configuration des
  webhooks ».
- **Une erreur** dit ce qui s'est passé, pourquoi si on le sait, et quoi faire, avec le bouton qui
  le fait ; elle ne s'excuse pas et garde ce que l'utilisateur a saisi.
- **Un état vide** invite à l'action (« Aucune carte. Ouvrir un booster ») ; un filtre sans
  résultat dit que rien ne correspond et propose d'effacer le filtre.
- **Une confirmation** porte le verbe et l'objet (« Supprimer le code »), jamais « Oui », « Non »
  ou « OK ».
- **Un bouton désactivé** dit pourquoi, à côté ou en infobulle.
- **Une valeur inconnue** s'écrit « – », pas `N/A`, `null` ni `0`.

## Interdits

Métaphores et « là où X rencontre Y » ; slogans, salutations et vantardises dans le hero ; questions
en titre ; points d'exclamation ; étiquettes en capitales ; concepts inventés avec une majuscule ;
blagues dans les libellés ; paragraphes d'ambiance ; remplissage : fluide, sans effort, puissant,
révolutionnaire, nouvelle génération, booster, libérer, sublimer, « en toute simplicité ».
