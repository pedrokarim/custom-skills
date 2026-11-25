"""Consigne Codex pour une planche de pixel art, toujours bâtie de la même façon.

Une série (des objets, des icônes, des décors) se fait en planches : un même gabarit mot pour mot,
seuls le thème et la liste des cases changent. C'est ce qui garde la même taille de pixel, le même
contour et la même lumière d'une planche à l'autre.

Types :
  sheet    grille d'objets, d'icônes ou de personnages (lignes x colonnes), fond chroma
  texture  une texture carrée raccordable sur ses quatre bords
  tileset  habille un gabarit de tuiles fourni en image (formes et grille gardées)
  strip    images successives d'une animation en boucle, sur une ligne
  scene    une image de décor détaillée et finie (fond de jeu, niveau 16 bits), plans du fond
           vers l'avant ; pour un décor minimaliste à aplats, voir le skill flat-pixel-art-scenes

Exemples :
  python make_prompt.py sheet --out icons.txt --file icons.png --grid 4x4 --art 32 \\
      --view front --theme "cozy fantasy inventory" --items "potion rouge;clé;pomme;..."
  python make_prompt.py texture --out water.txt --file water.png --art 32 --theme "calm blue water"
  python make_prompt.py tileset --out grass.txt --file grass.png --surfaces "lush grass" "dry dirt"
  python make_prompt.py strip --out torch.txt --file torch.png --frames 6 --art 32 --theme "wall torch flame"
  python make_prompt.py scene --out scene.txt --file scene.png --art 384 --colors 48 --crop 16:9       --theme "ruins of an ancient Egyptian site in the desert" --light "late afternoon, warm light"       --planes "sky;three far pyramids, pale and hazy;rolling dunes;ruined temple court with columns;sand floor with a dead bush"

Les objets se donnent séparés par des points-virgules, dans l'ordre de lecture des cases.
"""

from __future__ import annotations

import argparse
from pathlib import Path

VIEWS = {
    "front": "front view, the object seen straight on, slightly from above",
    "side": "side view, facing left, like a platformer sprite",
    "topdown": "strict 90-degree top-down view, no perspective",
    "iso": "isometric 2:1 view seen from above; each object stands on one diamond floor tile twice as wide as it is deep, without drawing the tile",
    "three-quarter": "three-quarter view from the front and slightly above, like a classic RPG",
}

CHROMA = {"green": "#00FF00", "magenta": "#FF00FF"}

PIXEL_RULES = """PIXEL ART RULES (strict):
- Real pixel art on a coarse grid: every art pixel is an exact {block} x {block} square block of one flat color. No anti-aliasing, no blur, no gradients, no soft shading, no sub-pixel detail, no dithering noise.
- A one-art-pixel outline around each subject, in a darker shade of its own colors.
- At most {colors} colors per subject, 3 to 4 tones per material. Light comes from the top-left.
- No text, letters, numbers, logos or labels anywhere."""

REFS = """REFERENCE IMAGES: {refs}"""


def grid_names(rows: int, cols: int) -> list[str]:
    return [f"row {r + 1}, column {c + 1}" for r in range(rows) for c in range(cols)]


def sheet(args) -> str:
    rows, cols = (int(v) for v in args.grid.lower().split("x"))
    size = args.size
    cell = size // cols
    block = size // (args.art * cols)
    items = [item.strip() for item in args.items.split(";") if item.strip()]
    if len(items) != rows * cols:
        raise SystemExit(f"{len(items)} objets pour {rows * cols} cases : il en faut exactement un par case.")
    cells = "\n".join(f"{k + 1}. {name}: {item}." for k, (name, item) in enumerate(zip(grid_names(rows, cols), items)))
    chroma = CHROMA[args.chroma]
    return f"""Generate ONE image file and save it as {args.file} in the current directory, using your image generation tool.

WHAT TO DRAW: a sheet of {rows * cols} separate pixel-art game assets, theme: {args.theme}. The sheet will be cut by a script into {rows * cols} sprites, so the grid must be exact.

CANVAS AND GRID (strict):
- Image {size} x {round(size * rows / cols)} pixels: a strict {cols} columns x {rows} rows grid of equal square cells ({cell} x {cell} each).
- The whole background is flat pure chroma {args.chroma} {chroma}. No floor, no ground shadow, no gradient, no frame or grid lines.
- One complete subject per cell, horizontally centered, its bottom resting on the same baseline at about 85% of the cell height in every cell. Generous empty margin; nothing touches or crosses a cell border. Never use the chroma color inside a subject.

{PIXEL_RULES.format(block=block, colors=args.colors)}
- Size: each subject fits in about {args.art} art pixels wide (about {args.art * block} screen pixels) and the same height at most.

VIEW: {VIEWS[args.view]}. Same scale, outline weight, light direction and baseline in every cell, so the sheet reads as one set.
{REFS.format(refs=args.refs) if args.refs else ""}
THE CELLS, left to right, top to bottom:
{cells}
"""


def texture(args) -> str:
    block = args.size // args.art
    return f"""Generate ONE image file and save it as {args.file} in the current directory, using your image generation tool.

WHAT TO DRAW: one square seamless pixel-art texture of {args.theme}, {VIEWS["topdown"]}, filling the whole image edge to edge.

RULES (strict):
- Image {args.size} x {args.size} pixels, {args.art} x {args.art} art pixels: every art pixel is an exact {block} x {block} square block of one flat color. No anti-aliasing, no blur, no gradients.
- Seamless on all four sides: what leaves the right edge comes back on the left, what leaves the bottom comes back on the top. Even brightness everywhere: no vignette, no light spot, no bigger feature near a border.
- At most {args.colors} colors, small evenly spread details, no objects, no characters, no text.
{REFS.format(refs=args.refs) if args.refs else ""}"""


def tileset(args) -> str:
    surfaces = args.surfaces
    two = len(surfaces) == 2
    paint = (
        f"Paint the light area of the template as {surfaces[0]} and the dark area as {surfaces[1]}."
        if two
        else f"Paint the filled area of the template as {surfaces[0]} and keep the empty area flat pure chroma green #00FF00."
    )
    return f"""Generate ONE image file and save it as {args.file} in the current directory, using your image generation tool.

The attached template image is a game tileset layout: a strict grid of square tiles whose shapes connect with each other. Keep its size, its grid and the exact silhouette of every tile, pixel for pixel. Only replace the flat colors with real pixel-art texture.

{paint}
- Top-down view, true pixel art at the template's own pixel size: one template pixel is one art pixel. No anti-aliasing, no blur, no gradients.
- The material stays continuous across tile borders, so tiles placed side by side join without seams. Where two surfaces meet, draw a short natural border (a thin edge, foam or a bank) along the template's boundary, without moving it.
- At most {args.colors} colors, no objects, no characters, no text, no grid lines.
{REFS.format(refs=args.refs) if args.refs else ""}"""


def strip(args) -> str:
    frames = args.frames
    cell = args.size // frames
    block = cell // args.art
    return f"""Generate ONE image file and save it as {args.file} in the current directory, using your image generation tool.

WHAT TO DRAW: {frames} frames of one looping pixel-art animation of {args.theme}, side by side on a single row, left to right in playing order. The last frame flows back into the first.

CANVAS (strict):
- Image {args.size} x {cell} pixels: {frames} equal square cells of {cell} x {cell}, one frame per cell.
- The whole background is flat pure chroma green #00FF00, no frame lines.
- The subject stays at exactly the same place, size and baseline in every cell; only the moving parts change, by small steps.

{PIXEL_RULES.format(block=block, colors=args.colors)}
- The subject fits in about {args.art} art pixels.
{REFS.format(refs=args.refs) if args.refs else ""}"""


def scene(args) -> str:
    width, height = args.size, args.height or round(args.size * 2 / 3)
    block = width // args.art
    planes = [plane.strip() for plane in args.planes.split(";") if plane.strip()]
    if not planes:
        raise SystemExit("scene : donner les plans du fond vers l'avant avec --planes \"ciel;…;premier plan\".")
    listed = "\n".join(f"{k + 1}. {plane}." for k, plane in enumerate(planes))
    crop = ""
    if args.crop:
        cw, ch = (int(v) for v in args.crop.split(":"))
        keep = round(width * ch / cw)
        if keep < height:
            margin = (height - keep) // 2
            crop = f" The top {margin} and bottom {margin} pixels will be cropped to a {args.crop} frame, so keep every important element inside the central {width} x {keep} area."
    light = f"\nLIGHT: {args.light}.\n" if args.light else ""
    return f"""Generate ONE image file and save it as {args.file} in the current directory, using your image generation tool.

WHAT TO DRAW: one finished, detailed pixel-art background for a 2D game: {args.theme}. A single still image, no layers, no text.

CANVAS: {width} x {height} pixels.{crop}

STYLE (most important):
- Polished 16-bit era pixel art, as in a high-quality modern indie game background: dense hand-placed detail, readable shapes, rich shading.
- Every art pixel is an exact {block} x {block} block of one flat color (the image is {args.art} x {height // block} art pixels). No blur, no anti-aliasing, no soft airbrush gradients: shading is done with clusters of flat pixel colors and light dithering.
- Rich palette, about {args.colors} colors in total, in several ramps per material. Strong value contrast between planes.
- Depth through atmospheric perspective: far planes paler and hazier with less contrast, near planes darker, sharper and more detailed.
- Materials drawn piece by piece: visible blocks, cracks, chipped edges, worn corners, small debris where they meet the ground.
{light}
THE SCENE, far to near:
{listed}

AVOID: characters, animals, UI, frames, text, logos, a vignette, blurry painterly areas, a photographic look.
{REFS.format(refs=args.refs) if args.refs else ""}"""


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("kind", choices=["sheet", "texture", "tileset", "strip", "scene"])
    p.add_argument("--out", required=True, help="fichier de consigne écrit")
    p.add_argument("--file", required=True, help="nom de l'image que Codex doit écrire")
    p.add_argument("--theme", default="")
    p.add_argument("--items", default="", help="sheet : objets séparés par des points-virgules")
    p.add_argument("--grid", default="3x3", help="sheet : LIGNESxCOLONNES")
    p.add_argument("--art", type=int, help="pixels d'art d'un objet (sheet, strip : 32), de la texture, ou sur la largeur de la scène (scene : 384)")
    p.add_argument("--size", type=int, default=1536, help="largeur de l'image en pixels")
    p.add_argument("--view", choices=sorted(VIEWS), default="front")
    p.add_argument("--chroma", choices=sorted(CHROMA), default="green", help="magenta si les objets sont verts")
    p.add_argument("--colors", type=int, help="couleurs demandées (16 ; scene : 48)")
    p.add_argument("--height", type=int, help="scene : hauteur de l'image (par défaut les 2/3 de la largeur)")
    p.add_argument("--planes", default="", help="scene : plans du fond vers l'avant, séparés par des points-virgules")
    p.add_argument("--light", default="", help="scene : la lumière, en anglais")
    p.add_argument("--crop", default="", help="scene : cadre final après recadrage, par exemple 16:9")
    p.add_argument("--surfaces", nargs="+", default=["grass"], help="tileset : une ou deux matières")
    p.add_argument("--frames", type=int, default=6, help="strip : nombre d'images")
    p.add_argument("--refs", default="", help="ce que montrent les images jointes, en anglais")
    args = p.parse_args()
    if args.art is None:
        args.art = 384 if args.kind == "scene" else 32
    if args.colors is None:
        args.colors = 48 if args.kind == "scene" else 16
    text = {"sheet": sheet, "texture": texture, "tileset": tileset, "strip": strip, "scene": scene}[args.kind](args)
    Path(args.out).write_text(text.strip() + "\n", encoding="utf-8")
    print(f"{args.out} : {len(text)} caractères")


if __name__ == "__main__":
    main()
