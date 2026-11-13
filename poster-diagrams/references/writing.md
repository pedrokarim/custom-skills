# Les textes

Un schéma se lit en dix secondes : chaque mot doit y gagner sa place.

## Sur la planche

- **Titre, deux lignes** : la première pose le sujet, la seconde (en encre chaude) le précise.
  « Du /play / au salon vocal », « Un bot, un site, / une seule API ». Pas de slogan, pas de
  point d'exclamation.
- **Chapô, trois lignes au plus** : le fait dur que la planche démontre (« Le bot n'ouvre aucun
  port »), puis comment.
- **Nœud** : un nom (ce que c'est), une phrase (ce que ça fait ici), éventuellement la techno en
  pied. Pas de liste de fonctionnalités.
- **Étiquette de fil** : un ou deux mots (« commande », « tête de file », « 1. l'ordre »). Une
  phrase longue n'a sa place que sur un fil qui longe une grande largeur.
- **Chiffres** : seulement ceux que le code prouve. « Une trentaine » vaut mieux qu'un nombre
  précis mal compté.
- **Encarts `.facts`** : trois au plus, un titre qui énonce (« Le site ne coupe pas »), deux
  phrases.

## Typographie

En français :

- espace insécable avant `: ; ! ?` et dans « 5 s », « 24 h », « 100 titres » ;
- guillemets « » avec espaces insécables à l'intérieur ;
- pas de tiret cadratin (—) : virgules, parenthèses, ou tiret demi-cadratin entouré d'espaces ;
- `…` plutôt que trois points.

En anglais : tiret cadratin sans espaces, guillemets droits ou typographiques, pas d'espace
avant la ponctuation double.

Les noms de code (commandes, fichiers, fonctions) s'écrivent dans la police du texte, jamais en
monospace sur la planche.

## La fiche d'accompagnement

Une fiche Markdown par planche, à côté des exports. Modèle :

```markdown
# Schéma : <titre>

![<texte alternatif court>](exports/<planche>.png)

Fichiers : `exports/<planche>.png` (<largeur × hauteur>) · `exports/<planche>.pdf` · source `src/<planche>.html`

## Ce que montre la planche

<Deux à quatre paragraphes, ou une liste numérotée qui suit les étapes de la planche.>

## À retenir

- <trois ou quatre idées, une ligne chacune>

## Pour un article

**Légende courte :** <une phrase>

**Texte alternatif :** <ce qu'un lecteur d'écran doit savoir : la disposition, les acteurs,
les flux, dans l'ordre de lecture>

**Paragraphe :** <cinq phrases prêtes à coller : le problème, le choix, sa conséquence>

## Sources dans le code

- `<chemin>` : <ce qu'il prouve>
```

Un index (`README.md` ou équivalent) liste les planches avec leur aperçu, l'ordre de lecture
conseillé et la commande de rendu.

## Relecture avant publication

Une planche publique ne montre :

- aucun nom de machine, adresse IP, port, nom de domaine interne, nom de canal ou de file ;
- aucun secret, ni le nom d'une variable qui en porte un ;
- aucun point faible : tâche sans verrou, service sans repli, contrôle absent, limite non
  appliquée.

Ce qu'on a trouvé de fragile en lisant le code se signale à l'utilisateur, à part, avec le
fichier en cause ; la planche, elle, montre ce qui marche.
