---
name: code-shots
description: Faire de beaux visuels d'extraits de code, à la manière de ray.so ou Carbon mais faits maison et sans fausse fenêtre, pour un article, un portfolio, un fil sur X ou une présentation, et surtout savoir quels extraits d'un projet valent une capture. Repère dans un dépôt les bouts de code qui racontent quelque chose (astuce, contournement, décision, algorithme, anecdote), en extrait les lignes exactes, les met en page avec coloration syntaxique, lignes mises en avant et notes numérotées, puis exporte en PNG haute définition et en PDF. À utiliser dès qu'on parle de capture de code, de « screen » de code, de ray.so, Carbon, snippet joli, code pour un article ou un tweet, extrait à mettre en avant, ou qu'on demande « qu'est-ce qu'il y a d'intéressant à montrer dans ce code », même sans citer d'outil.
---

# Captures de code, faites maison

Ce skill vient d'un article de portfolio sur un projet (un bot Discord, son site et son API) :
il fallait des visuels de code « à la ray.so », mais dans la DA du projet, et surtout **choisir**
les extraits qui méritaient d'être montrés. Un service en ligne ne fait que la moitié du travail :
il colore ce qu'on lui colle. Ici, l'agent cherche les bons extraits, prend les lignes exactes du
fichier, et produit une capture qui dit **quoi regarder**.

La règle mère : **une capture montre le vrai code et dit pourquoi il vaut d'être lu.** Jamais de
code réécrit pour faire joli, jamais d'extrait qu'on ne comprend pas sans le reste du fichier.

## Le kit

Il s'appuie sur `poster-diagrams` (même dépôt) : même rendu (`render.mjs`), même thème
(`theme.css`). Un dossier de schémas peut donc accueillir des captures à côté, avec la même
identité.

```sh
node <skills>/code-shots/scripts/init.mjs <dossier>                 # installe ou met à jour
node <skills>/code-shots/scripts/init.mjs <dossier> --shot verrou   # nouvelle capture
node <skills>/code-shots/scripts/extract.mjs <fichier> 120-138 [150-156]   # lignes exactes
node <dossier>/render.mjs verrou                                     # PNG ×2 + PDF
```

Une capture est une page `src/<nom>.html` qui déclare `window.SHOT` (titre, chapô, fichier,
langage, première ligne, code, lignes en avant, notes). `shot.js` colore avec Shiki (chargé
depuis le CDN), aligne chaque note sur sa ligne, et contrôle la planche : ligne trop longue
pour la carte, note sur une ligne absente, notes plus hautes que le code, pied de planche
qui touche le code.

## Le procédé

1. **Chercher les extraits** (`references/picking.md`). Un agent d'exploration par grand
   domaine si le dépôt est gros, avec la grille de sélection. Pour chaque candidat : fichier,
   plages de lignes, lignes clés, l'histoire en une phrase. *Pourquoi : le code le plus
   « important » n'est presque jamais le plus intéressant à lire.*
2. **Trier** : garder ceux qui tiennent en 6 à 25 lignes, se lisent seuls, et racontent une
   chose différente des autres. Dix captures qui montrent toutes un `try/catch` n'en font qu'une.
3. **Relire chaque extrait pour la publication** : aucune clé, adresse, nom de machine, jeton,
   identifiant d'utilisateur, ni défaut connu. Un extrait qui montre une faiblesse se signale à
   l'utilisateur, il ne se publie pas.
4. **Extraire les lignes exactes** avec `extract.mjs` : numéros réels, indentation commune
   retirée, coupure `@@ n` si une partie du milieu n'apporte rien. Ne jamais retoucher le code
   ensuite ; si une ligne est trop longue, choisir une autre plage ou élargir la planche.
5. **Écrire les textes** (`references/writing.md`) : un titre sur deux lignes qui dit l'idée,
   un chapô qui dit quoi regarder, une à trois notes accrochées aux lignes clés.
6. **Mettre en avant 1 à 4 lignes** (`focus`), pas plus : les autres s'estompent. Tout mettre en
   avant revient à ne rien montrer.
7. **Rendre, contrôler, regarder.** `render.mjs` signale les défauts ; ouvrir quand même le PNG
   et le lire comme un inconnu : le titre et la ligne en avant doivent suffire à comprendre.
8. **Fiche d'accompagnement** : un index Markdown qui liste les captures avec, pour chacune,
   la légende, le texte alternatif (le code lui-même, résumé), le paragraphe d'article et le
   lien vers le fichier source.

## Composition

- **Pas de fausse fenêtre** (trois points rouge-jaune-vert, barre de titre) : l'en-tête de la
  carte porte de vraies informations, le chemin du fichier, les lignes, le langage.
- **Monospace pour le code seulement.** Titres, notes, en-tête : la police du texte.
- **La mise en avant passe par le fond de la ligne et l'estompage des autres**, jamais par un
  liseré coloré sur le côté.
- **Une capture = une idée.** Deux idées dans le même fichier : deux captures.
- **Largeur** : 1600 px avec des notes (carte de 1100 px environ, soit ~85 caractères à 19 px),
  1200 px sans notes pour un format plus serré (`width: 1200`).
- **La signature** (`.brand`, en bas à droite) et le pied (`foot`, en bas à gauche) sont
  facultatifs ; le pied dit d'où vient le code (« le projet · bot Discord »).

## Pièges déjà payés

- **Planche mesurée avant d'être dessinée** : une capture a une hauteur automatique, le rendu
  doit attendre `boardReady` avant de mesurer, sinon l'image sort coupée (corrigé dans
  `render.mjs` de `poster-diagrams`).
- **`.node.bare` du kit sur la carte du code** : il efface son fond, le code devient illisible
  sur le papier. La carte n'est pas un nœud de schéma.
- **Ligne trop longue** : coupée sans prévenir par `overflow: hidden`. Le contrôle la signale ;
  la solution est une autre plage ou une planche plus large, jamais une ligne réécrite.
- **Échappements dans le code collé** : un extrait qui contient des gabarits JavaScript
  (`` ` `` et `${`) casse la page. `extract.mjs` les échappe ; ne pas recopier à la main.
- **Un extrait choisi parce qu'il est « central »** (un gros service, un routeur) : illisible
  hors contexte et ennuyeux. Préférer la ligne surprenante.

## Références

- `references/picking.md` : la grille pour trouver et trier les extraits, avec des exemples de
  ce qui marche et de ce qui ne marche pas.
- `references/writing.md` : titres, chapô, notes, fiche d'accompagnement, relecture.
- `assets/examples/` : un exemple rendu.
