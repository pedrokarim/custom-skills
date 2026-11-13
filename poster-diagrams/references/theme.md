# Le thème

`src/theme.css` porte toutes les couleurs et les polices. `kit.css` et `wire.js` n'en écrivent
aucune : changer de marque, c'est changer ce fichier (et le `<link>` des polices).

## Le thème par défaut

Une sérigraphie à deux encres : papier crème `#F4EDE4`, encre `#1A1A1A`, encre chaude
`#E67260`, encre froide `#5865F2`. Titre en Archivo Black avec deux ombres décalées (chaude en
bas à droite, froide en haut à gauche), texte en Manrope. Il se lit bien dans un fil sombre comme
clair, et ne ressemble à aucun outil de schémas.

## Les jetons

| Jeton | Rôle |
|---|---|
| `--paper`, `--card` | fond de la planche, fond d'un nœud |
| `--ink`, `--muted` | texte et traits principaux, texte secondaire |
| `--line`, `--zone-line` | filets internes, pointillés des zones |
| `--accent`, `--accent-line`, `--accent-ink` | encre chaude : fond de nœud, trait de fil (un ton plus sombre), texte sur papier |
| `--on-accent`, `--on-accent-muted` | texte sur un nœud `accent` |
| `--accent-2`, `--accent-2-line`, `--accent-2-ink`, `--accent-2-rule` | encre froide, mêmes rôles |
| `--on-accent-2`, `--on-accent-2-muted` | texte sur un nœud `accent-2` |
| `--on-solid`, `--on-solid-muted`, `--solid-rule` | nœud en encre pleine |
| `--muted-line`, `--ok` | fils secondaires, état « bon » |
| `--font-title`, `--font-text` | deux familles, pas plus |

## Adapter à une marque

1. Reprendre les couleurs de la charte de la marque, pas d'un générateur de palettes.
2. Garder **deux encres** contrastées et un papier : au-delà, les flux ne se distinguent plus.
3. Vérifier le contraste de chaque paire texte / fond (au moins 4,5:1 pour le texte courant),
   en particulier `--on-accent-muted` et `--on-accent-2-muted`.
4. Un trait fin de 2,4 px doit rester lisible sur le papier : `--accent-line` un ton plus
   sombre que `--accent` si besoin.
5. Changer le `<link>` Google Fonts en tête de chaque planche si les polices changent. Une
   police de titre très grasse (Archivo Black, Anton, Bricolage Grotesque 800) supporte les
   ombres décalées ; une police fine non.
6. Logo et nom dans `.brand` (en bas à droite) : une image de 26 px et un texte, ou rien.

## Fond personnalisé d'une planche

Pour une seule planche, poser le fond sur la planche elle-même :
`<div class="board no-halftone" style="--w:1600px; --h:900px; background: linear-gradient(135deg, #F6D365, #FDA085)">`.
Un fond doit rester calme sous les nœuds : un dégradé doux ou une couleur, rarement une image.
Si le fond est sombre, prendre plutôt la variante sombre ci-dessous, pour que les fils et les
étiquettes changent aussi de couleur.

## Variante sombre

Le thème par défaut est volontairement clair (un papier). Pour une version sombre, dupliquer
`theme.css` en `theme-dark.css` avec un papier sombre (`#1A1A1A`), une carte un peu plus claire,
une encre claire, et relier ce fichier à la place dans les planches concernées. Tester chaque
nœud `solid` : en sombre, l'encre pleine devient claire et les textes `--on-solid*` s'inversent.

## Icônes

Pour les logos de technos, Simple Icons (SVG officiels, monochromes) :
`https://cdn.jsdelivr.net/npm/simple-icons@13/icons/<nom>.svg`, copiés dans `src/assets/icons/`.
Un logo accompagne un nom dans un titre de nœud ; il ne le remplace jamais, et une rangée de
logos seuls n'apporte rien.
