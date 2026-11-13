---
name: poster-diagrams
description: Produire des schémas techniques soignés, composés comme des affiches (architecture, flux d'une requête, pipeline de déploiement, tâches planifiées, couches d'un framework, parcours d'un objet), à partir du vrai code d'un projet, exportés en PNG haute définition et en PDF vectoriel, avec une fiche d'accompagnement (légende, texte alternatif, paragraphe d'article, sources). Un kit sans dépendance (HTML, CSS, fils SVG tracés par script, rendu par Chrome piloté depuis Node) avec sept gabarits et un contrôle automatique des débordements, chevauchements et fils qui traversent un bloc. À utiliser dès qu'on demande un schéma, un diagramme, une infographie technique, une illustration pour un article, un portfolio, une présentation ou un README, « comment marche X » en image, un plan d'architecture, un flowchart, une séquence ou un pipeline, même si la demande cite Mermaid, draw.io, Excalidraw ou D2, et même si elle ne dit que « montre-moi comment ça s'articule ».
---

# Schémas techniques façon affiche

Ce skill vient d'une série de planches faites pour le portfolio d'un projet (un bot Discord, son
site et son API) : architecture, musique, tâches de fond, déploiement. Mermaid ou draw.io
auraient produit des schémas justes mais reconnaissables au premier coup d'œil, sans rien de la
marque. Ici, chaque planche est **composée à la main comme une affiche**, mais reste **du code** :
elle se relit, se diffe, et sort à l'identique à chaque rendu.

La règle mère : **une planche raconte une seule chose, et tout ce qu'elle affirme vient du code.**

## Le kit

```
<dossier des schémas>/
├── render.mjs        rendu PNG ×2 + PDF vectoriel (+ WebP), contrôle de chaque planche
├── src/
│   ├── theme.css     couleurs et polices : la seule feuille à changer pour une marque
│   ├── kit.css       structure : en-tête, nœuds, zones, listes, encarts, légende, trame
│   ├── wire.js       fils SVG orthogonaux, légende, contrôle (window.checkBoard)
│   ├── assets/       logos, icônes (Simple Icons pour les technos)
│   └── <planche>.html
└── exports/          ce qu'on joint à un article
```

Aucune dépendance : `render.mjs` pilote Chrome, Brave ou Edge par le protocole DevTools avec le
WebSocket intégré à Node 22+. Les polices viennent de Google Fonts : être en ligne au rendu.

```sh
node <skill>/scripts/init.mjs <dossier>                                # installe ou met à jour le kit
node <skill>/scripts/init.mjs <dossier> --board archi --layout zones   # nouvelle planche
node <dossier>/render.mjs [filtre] [--formats png,pdf,webp] [--scale 2]
```

`init.mjs` remplace `kit.css`, `wire.js` et `render.mjs` (mise à jour du moteur) mais **ne touche
jamais** à `theme.css` ni à une planche existante.

## Les sept gabarits

Aperçus dans `assets/examples/`. Le détail de chacun (structure, réglages) est dans
`references/layouts.md`.

| Gabarit | Raconte | Exemple |
|---|---|---|
| `flow` | ce qui arrive à une demande : une entrée, une chaîne d'étapes numérotées, des services sur le côté | une recherche qui devient de l'audio |
| `columns` | un échange entre acteurs alignés : aller-retour numérotés, seconde boucle dans l'autre encre | un ordre envoyé du site à un bot |
| `metro` | une procédure ou un parcours, en une ou deux lignes de stations | du commit à la production |
| `matrix` | un inventaire dense, clé en grand chiffre par ligne, acteurs en colonnes | les tâches planifiées par fréquence |
| `zones` | l'architecture d'ensemble : entrées, services, nœud central large, données, services externes | un site, deux bots, une API |
| `layers` | une pile que traverse une demande, de haut en bas, la réponse remontant | une interaction, couche par couche |
| `sequence` | un protocole entre acteurs : lignes de vie, messages numérotés, notes, intertitres | une connexion OAuth puis la liaison d'un second compte |

## Le procédé

1. **Rassembler les faits dans le code, pas dans la doc.** Lire les fichiers qui font le travail,
   noter pour chaque affirmation le fichier qui la prouve (il ira dans la fiche). Une doc et un
   code qui divergent : le code gagne, et on le signale. Plusieurs domaines à couvrir : un agent
   d'exploration par domaine, en parallèle, avec la consigne de ne rapporter que des faits
   confirmés. *Pourquoi : un schéma faux est pire qu'aucun schéma, et il sera relu par des gens
   qui connaissent le code.*
2. **Choisir le gabarit selon l'histoire**, pas selon l'habitude (table ci-dessus). Deux idées
   = deux planches. *Une planche qui veut tout montrer ne montre rien.*
3. **Écrire les textes avant de placer quoi que ce soit** (`references/writing.md`) : un titre
   sur deux lignes qui nomme la chose, un chapô qui donne le fait dur, des nœuds au nom court,
   des étiquettes de fil d'un ou deux mots.
4. **Créer la planche** avec `init.mjs --board <nom> --layout <gabarit>`, puis remplacer le
   contenu d'exemple. Garder la taille de planche (`--w`, `--h`) : 1600 px de large, la hauteur
   ajustée au contenu.
5. **Poser les nœuds sur une grille** (colonnes de même largeur, écarts égaux), puis **déclarer
   les fils** dans `window.WIRES` (`references/wires.md`). Une encre par flux, la légende
   (`window.LEGEND`) n'annonce que les encres utilisées.
6. **Rendre et contrôler** : `node render.mjs <nom>`. Le script signale en rouge un
   débordement, un chevauchement, une étiquette posée sur un bloc ou sur une autre, un fil qui
   traverse un bloc, une erreur dans la page ; il compte aussi les croisements de fils.
7. **Regarder le PNG, toujours.** Le contrôle ne juge ni le sens, ni la hiérarchie, ni le vide :
   ouvrir l'image, la lire comme un inconnu, corriger, relancer. Viser zéro défaut et au plus
   un croisement de fils, net et à angle droit.
8. **Écrire la fiche d'accompagnement** (modèle dans `references/writing.md`) : ce que montre la
   planche, à retenir, légende courte, texte alternatif, paragraphe d'article, sources dans le
   code.
9. **Relire pour la publication** : aucune machine, adresse, port, nom de canal interne, secret,
   ni point faible (tâche sans verrou, service sans repli). Les défauts trouvés en lisant le
   code se signalent à l'utilisateur à part, jamais sur la planche.

## Composition

- **L'audace à un seul endroit** : le titre imprimé (deux ombres décalées). Dans la scène, un
  seul nœud en encre pleine (`solid`) et au plus un ou deux nœuds de couleur (`accent`,
  `accent-2`) : ceux qui portent l'idée.
- **Une encre = un flux** : `ink` pour le chemin principal, `accent` pour le premier flux
  secondaire, `accent2` pour le second (souvent le temps réel ou la sortie), `muted` en
  pointillés pour la surveillance ou l'optionnel.
- **Une zone en pointillés est une réalité** (une machine, un réseau, un fournisseur), jamais un
  cadre décoratif. Pas de bande ni de barre colorée autour d'un bloc.
- **Pas de monospace**, même pour un nom de commande : la police du texte, en gras si besoin.
- **Pas de capitales espacées, pas de pastilles, pas d'icônes seules** : une icône accompagne un
  nom (logo de techno dans un titre de nœud), elle ne le remplace pas.
- **La trame de demi-teinte vit dans deux coins**, jamais sous du texte (`.board.no-halftone`
  pour la retirer).
- **Un nœud a la hauteur de son contenu** : un nœud à moitié vide se resserre, la planche aussi.

## Pièges déjà payés

- **Étiquette dans un écart de 30 px** : elle déborde sur les deux nœuds. Un écart sous 70 px ne
  porte pas d'étiquette ; la légende ou le titre du nœud suffit.
- **Fil qui traverse un nœud** pour rejoindre une cible lointaine : passer par un couloir
  (`viaX`, `viaY`), déplacer un nœud, ou renoncer au fil et le dire dans le texte du nœud.
- **Croisement inévitable** : quand A va en bas à droite et B en haut à droite, ils se croisent
  forcément. En garder un seul, à angle droit, loin des étiquettes ; au-delà, revoir la
  disposition.
- **Stations ou nœuds au bord droit** : leur étiquette sort de la planche. Arrêter la dernière
  station à 1356 px pour une étiquette de 170 px.
- **Éléments d'une grille CSS marqués `.node`** : `.node` est en `position: absolute`, la grille
  s'effondre et tout se chevauche. Dans une grille, `position: static` (déjà prévu pour
  `.facts .node`).
- **Couleur écrite en dur dans un attribut SVG** : `stroke="var(--x)"` ne marche pas partout.
  Lire la valeur avec `getComputedStyle` (c'est ce que fait `wire.js`).
- **Police avec guillemets dans un attribut SVG** : `font-family=""Archivo Black""` casse le
  balisage ; remplacer les `"` par des `'`.
- **Cases vides remplies de « aucune »** dans un tableau croisé : elles encombrent. Une case vide
  reste vide.
- **« (15 min) » coupé en fin de ligne**, ou un séparateur « · » en début de ligne : espaces
  insécables dans les durées et avant le séparateur (`matrix` le fait déjà).
- **Typographie française oubliée** dans les textes de la planche et de la fiche : espace
  insécable avant `: ; ! ?`, guillemets « » avec espaces insécables, pas de tiret cadratin.
- **Un fond qui ne s'applique pas** : `.node.bare` (fond transparent) l'emporte sur une classe
  seule comme `.section`. Écrire `.node.bare.section` pour poser un fond de papier qui masque
  les lignes de vie sous un intertitre.
- **Planche mesurée trop tôt** : une planche construite en script (stations, couches, séquence,
  capture de code) n'a sa taille qu'après `boardReady`. `render.mjs` attend désormais le dessin
  avant de mesurer.
- **PNG verrouillé sous Windows** (ouvert dans un aperçu, Obsidian, l'explorateur) : l'écriture
  échoue. `render.mjs` le signale (« fichier ouvert ailleurs ? ») et continue ; fermer l'aperçu
  ou rendre ailleurs avec `--out`.
- **Un fait de la doc recopié sans vérifier** : un taux annoncé « 1 sur 500 » valait « 1 sur
  2 000 » dans le code. Toujours le code.

## Références

- `references/layouts.md` : chaque gabarit, sa structure, ses réglages.
- `references/wires.md` : l'API des fils, les recettes de routage, le contrôle.
- `references/theme.md` : adapter le thème à une marque, polices, variante sombre.
- `references/writing.md` : textes de planche, typographie, fiche d'accompagnement, relecture
  avant publication.
- Le skill voisin `code-shots` réutilise ce kit pour des captures de code dans la même DA.
