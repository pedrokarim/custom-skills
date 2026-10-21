# Gabarit de prompt

Le prompt est écrit en anglais : les générateurs d'images y répondent mieux. Il comporte quatre
blocs. Le bloc **STYLE** se reprend tel quel ; les trois autres s'adaptent.

Remplacer ce qui est entre crochets. Les deux prompts complets qui ont produit les exemples du
dossier `assets/examples/` figurent à la fin.

## Gabarit

```
Use your image generation tool to create ONE original image and save it as `[name].png` in the
current directory. Do not write code and do not modify anything else. When done, reply with
the file name and its pixel size.

It is [what the image is for, e.g. "the title-menu background of a gothic survival game"].
Landscape 16:9, the largest 16:9 size available.

# STYLE — this matters more than the subject

MINIMALIST FLAT PIXEL ART. Think of an image painted at only 320×180 pixels and enlarged with
hard square pixels: every pixel is a visible chunky square, edges are stair-stepped, nothing is
anti-aliased.

- HUGE FLAT SHAPES OF SOLID COLOUR. No texture, no noise, no dithering, no rendered detail, no
  outlines. A cloud is one pale blob. A hill is one flat band. A tree trunk is one dark
  silhouette. If a shape needs shading it gets exactly ONE second tone, as a clean flat area.
- VERY FEW COLOURS: one single hue family for the entire image, in five or six flat value
  steps, plus exactly ONE saturated accent colour used on one or two objects only.
- DEPTH BY FLAT LAYERS: five or six planes stacked from back to front, each one a single flat
  tone a clear step darker (or lighter) than the one behind. The farthest shapes are barely
  distinguishable from the sky. This stepped atmospheric perspective is the whole point: it
  must feel very deep.
- ENORMOUS NEGATIVE SPACE. At least half of the image is empty sky or mist. The scene is vast,
  silent and still.
- ONE TINY LONE FIGURE, a few pixels tall, as a pure silhouette, to give the scale.
- A PERFECTLY STILL MIRROR OF WATER across the bottom fifth, reflecting the shapes above as
  simplified flat silhouettes.
- LIGHT AS FLAT BANDS: light rays are wide diagonal bands only one value step lighter than the
  sky, with hard pixel edges. No soft glow, no lens flare, no gradient.
- THE MOON IS A THIN ONE-PIXEL CIRCLE OUTLINE, incomplete like a crescent ring, not a disc.
- A few single-pixel stars or drifting specks.

Absolutely avoid: realistic or painterly rendering, detailed textures, busy scenery, many small
props, gradients, glow effects, dramatic lighting, high detail. If in doubt, remove detail.

# COMPOSITION

[Where the interface goes, if any. E.g. "A logo and a vertical list of buttons will sit in the
CENTRE: keep the central third almost empty. Place the subjects in the left and right thirds."]
No text, no letters, no logo, no interface, no watermark, no signature, no border.

# SCENE — "[a short evocative title]"

Hue family: [one hue, from its darkest value in front to its palest in the sky].
Accent: [one saturated colour].
- Sky: [flat tone, cloud masses, moon position, light bands].
- Far plane: [one large pale silhouette, almost dissolved in the sky].
- Middle plane: [one flat shape].
- Main subject, [left or right] third: [the one object that carries the accent].
- Ground line: [a few tiny silhouettes, and the lone figure: who, posture, facing where].
- Bottom: the still water mirroring [what].
```

## Choisir la teinte et l'accent

L'accent doit s'opposer à la teinte, en température ou en saturation.

| Ambiance | Famille de teintes | Accent |
|---|---|---|
| Aube grise, mélancolie | Bleu ardoise à lavande pâle | Rouge sang |
| Nuit profonde | Vert-noir, anthracite | Orange de flamme |
| Forêt enchantée | Indigo à violet | Cyan lumineux |
| Désert, crépuscule | Orange à magenta | Blanc ou violet très sombre |
| Jour clair, automne | Bleu ciel très pâle | Rouge ou orange vif |
| Ruine, grotte | Gris bleuté | Turquoise |

## Exemple complet 1 – « l'arbre rouge »

A donné `good-crimson-tree-raw.png`.

```
# SCENE — "the moor, before a dawn that will not come"

Hue family: cold slate blue-violet, from near-black indigo in front to a pale misty
lavender-grey sky. Accent: deep blood crimson.
- Sky: pale flat lavender-grey with two or three enormous flat cloud masses one step lighter;
  the thin ring moon upper left; wide faint diagonal light bands.
- Far right, almost dissolved in the sky: the tall flat silhouette of a ruined gothic chapel
  with a broken spire, standing on a long low hill.
- Left third: one enormous dead tree as a dark flat silhouette, but its crown is a single big
  rounded mass of BLOOD-CRIMSON foliage in two flat tones (the only saturated thing in the
  image), with a few crimson pixels falling from it.
- Along the ground line: a short row of tiny leaning grave crosses as silhouettes, and the
  tiny lone hunter in a wide-brimmed hat and long cloak, standing still, facing the tree.
- Bottom: the still water mirroring the tree, the crosses and the hunter.
```

Animation : `--horizon 0.735 --stars 9 --petals 22 --petal-color 150,28,44
--petal-box 0.04,0.30,0.34,0.52`

## Exemple complet 2 – « la dernière bougie »

A donné `good-last-candle-raw.png`.

```
# SCENE — "the last candle"

Hue family: near-black teal-green and charcoal, a very dark night. Accent: warm candle
orange-gold.
- Sky: almost black, flat, with single-pixel stars and the thin ring moon upper right; one
  very large far silhouette of a ruined abbey tower barely lighter than the sky.
- Left third: a rocky outcrop as a few flat dark shapes, two flat-shaded pines, a leaning
  stone cross, and a small open shrine holding ONE lit candle: a tiny flat orange-gold flame
  lighting a small flat warm patch of ground around it.
- Beside the candle: the tiny lone hunter sitting, wide-brimmed hat, long cloak, a stake laid
  across the knees.
- Right two thirds: emptiness, flat dark mist, one pale far hill.
- Bottom: black still water mirroring the candle flame as a short vertical streak, the pines
  and the cross.
```

Animation : `--horizon 0.712 --colors 24 --stars 14 --star-color 190,214,206 --flicker
--fireflies 6`

## Contre-exemple

Le prompt qui a donné `bad-too-detailed.png` demandait, entre autres : « layered 2D pixel art »,
« the only crisp, detailed plane », « volumetric atmosphere », « gentle bloom around every light
source », et énumérait une dizaine d'accessoires au premier plan (grille, sarcophage, oratoire,
lanterne, tombes). Chaque accessoire a été dessiné, avec ses pierres et ses ronces.

La leçon : un générateur ajoute tout ce qu'on nomme. Pour une image vide, il faut nommer peu.
