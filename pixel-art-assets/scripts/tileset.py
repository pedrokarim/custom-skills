"""Tileset « double quadrillage » à 15 pièces : le gabarit à faire habiller, puis l'essai.

Un tileset de terrain vu de dessus tient sur une planche de 4 x 4 tuiles. Chaque tuile est posée
à cheval sur quatre cases de la carte (double quadrillage) et choisie d'après ces quatre cases :
pleines ou vides, cela fait 16 masques, dont un vide, donc 15 pièces utiles. L'ordre des tuiles
est celui du gabarit libre de SpriteCook (licence MIT), que les moteurs savent lire.

  template  dessine le gabarit en deux aplats : clair = surface A, sombre = surface B (ou vide).
            Joint au générateur, il impose la taille, la grille et la silhouette de chaque tuile.
  preview   peint une carte d'essai avec le tileset généré, pour voir les raccords.
  check     mesure si la tuile pleine se raccorde à elle-même (bords opposés).

Usage :
  python tileset.py template --out gabarit.png --tile 32 [--scale 8]
  python tileset.py preview  --tileset herbe.png --tile 32 --out essai.png [--seed 3]
  python tileset.py check    --tileset herbe.png --tile 32
"""

from __future__ import annotations

import argparse
import random

from PIL import Image

# Masque des quatre coins (haut-gauche 1, haut-droite 2, bas-gauche 4, bas-droite 8) -> case de
# la planche 4 x 4, lue de gauche à droite puis de haut en bas. Le masque 0 (tout vide) est en bas
# à gauche ; le masque 15 (tout plein) est la tuile pleine.
FRAME_BY_MASK = [12, 15, 8, 9, 0, 11, 14, 7, 13, 4, 1, 10, 3, 2, 5, 6]
MASK_BY_FRAME = {frame: mask for mask, frame in enumerate(FRAME_BY_MASK)}

LIGHT = (112, 176, 72, 255)
DARK = (122, 84, 52, 255)


def tile_mask(mask: int, tile: int) -> list[list[bool]]:
    """Forme d'une tuile : l'union des quarts pleins, élargie au centre pour que les diagonales
    se rejoignent au lieu de se toucher par un point, avec des angles adoucis côté vide."""
    half = tile / 2
    corners = [(0, 0, 1), (tile, 0, 2), (0, tile, 4), (tile, tile, 8)]
    grow = max(1, tile // 10)
    radius = max(1.0, tile / 6)
    out = [[False] * tile for _ in range(tile)]
    for y in range(tile):
        for x in range(tile):
            cx, cy = x + 0.5, y + 0.5
            for kx, ky, bit in corners:
                if not mask & bit:
                    continue
                # Quart de la tuile côté de ce coin, poussé de `grow` pixels au-delà du centre.
                inside_x = cx <= half + grow if kx == 0 else cx >= half - grow
                inside_y = cy <= half + grow if ky == 0 else cy >= half - grow
                if not (inside_x and inside_y):
                    continue
                # Coin extérieur arrondi, là où le quart fait face au vide des deux côtés.
                ex = half + grow if kx == 0 else half - grow
                ey = half + grow if ky == 0 else half - grow
                dx = abs(cx - ex)
                dy = abs(cy - ey)
                open_x = not (mask & {1: 2, 2: 1, 4: 8, 8: 4}[bit])
                open_y = not (mask & {1: 4, 2: 8, 4: 1, 8: 2}[bit])
                if open_x and open_y and dx < radius and dy < radius:
                    if (radius - dx) ** 2 + (radius - dy) ** 2 > radius**2:
                        continue
                out[y][x] = True
                break
    return out


def template(args) -> None:
    tile = args.tile
    sheet = Image.new("RGBA", (tile * 4, tile * 4), (0, 0, 0, 0) if args.empty else DARK)
    px = sheet.load()
    for frame in range(16):
        mask = MASK_BY_FRAME[frame]
        shape = tile_mask(mask, tile)
        ox, oy = (frame % 4) * tile, (frame // 4) * tile
        for y in range(tile):
            for x in range(tile):
                if shape[y][x]:
                    px[ox + x, oy + y] = LIGHT
                elif args.empty:
                    px[ox + x, oy + y] = (0, 255, 0, 255)
    if args.scale > 1:
        sheet = sheet.resize((sheet.width * args.scale, sheet.height * args.scale), Image.NEAREST)
    sheet.save(args.out)
    print(f"{args.out} : 4 x 4 tuiles de {tile} px, agrandi x{args.scale}")


def blob_map(width: int, height: int, seed: int) -> list[list[bool]]:
    """Une carte d'essai : une grande tache, un îlot, une diagonale et un trou, pour voir tous les raccords."""
    rng = random.Random(seed)
    cells = [[False] * width for _ in range(height)]
    for _ in range(5):
        cx, cy = rng.randrange(2, width - 2), rng.randrange(2, height - 2)
        r = rng.uniform(1.5, 3.5)
        for y in range(height):
            for x in range(width):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    cells[y][x] = True
    for k in range(min(width, height) - 2):
        cells[1 + k][width - 2 - k] = True
    return cells


def preview(args) -> None:
    tile = args.tile
    sheet = Image.open(args.tileset).convert("RGBA")
    if sheet.width != tile * 4:
        sheet = sheet.resize((tile * 4, tile * 4), Image.NEAREST)
    frames = [sheet.crop(((f % 4) * tile, (f // 4) * tile, (f % 4 + 1) * tile, (f // 4 + 1) * tile)) for f in range(16)]
    cols, rows = args.cells, args.cells
    cells = blob_map(cols, rows, args.seed)

    def filled(x, y):
        return 0 <= x < cols and 0 <= y < rows and cells[y][x]

    out = Image.new("RGBA", (cols * tile, rows * tile), (24, 22, 30, 255))
    # Double quadrillage : une tuile entre quatre cases, décalée d'une demi-tuile.
    for y in range(rows + 1):
        for x in range(cols + 1):
            mask = (1 if filled(x - 1, y - 1) else 0) | (2 if filled(x, y - 1) else 0) | (4 if filled(x - 1, y) else 0) | (8 if filled(x, y) else 0)
            if mask == 0 and not args.empty_tiles:
                continue
            out.alpha_composite(frames[FRAME_BY_MASK[mask]], (x * tile - tile // 2, y * tile - tile // 2))
    if args.scale > 1:
        out = out.resize((out.width * args.scale, out.height * args.scale), Image.NEAREST)
    out.save(args.out)
    print(f"{args.out} : carte d'essai {cols} x {rows}")


def check(args) -> None:
    tile = args.tile
    sheet = Image.open(args.tileset).convert("RGB")
    if sheet.width != tile * 4:
        sheet = sheet.resize((tile * 4, tile * 4), Image.NEAREST)
    frame = FRAME_BY_MASK[15]
    full = sheet.crop(((frame % 4) * tile, (frame // 4) * tile, (frame % 4 + 1) * tile, (frame // 4 + 1) * tile))
    px = full.load()

    def gap(a, b):
        return sum(abs(a[i] - b[i]) for i in range(3)) / 3

    lr = sum(gap(px[0, y], px[tile - 1, y]) for y in range(tile)) / tile
    tb = sum(gap(px[x, 0], px[x, tile - 1]) for x in range(tile)) / tile
    inner = sum(gap(px[x, y], px[x + 1, y]) for y in range(tile) for x in range(tile - 1)) / (tile * (tile - 1))
    # Un raccord est bon quand l'écart entre bords opposés ressemble à l'écart entre deux voisins.
    verdict = "raccord propre" if max(lr, tb) <= inner * 1.6 + 4 else "raccord visible : régénérer ou retoucher"
    print(f"tuile pleine : gauche/droite {lr:.1f}, haut/bas {tb:.1f}, voisins {inner:.1f} -> {verdict}")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("template")
    t.add_argument("--out", required=True)
    t.add_argument("--tile", type=int, default=32)
    t.add_argument("--scale", type=int, default=8, help="agrandissement pour le générateur (x8 : 1024 px pour 32 px)")
    t.add_argument("--empty", action="store_true", help="surface unique : le vide en vert chroma au lieu de la surface B")
    v = sub.add_parser("preview")
    v.add_argument("--tileset", required=True)
    v.add_argument("--tile", type=int, default=32)
    v.add_argument("--out", required=True)
    v.add_argument("--cells", type=int, default=12)
    v.add_argument("--seed", type=int, default=3)
    v.add_argument("--scale", type=int, default=2)
    v.add_argument("--empty-tiles", action="store_true", help="pose aussi la tuile vide (surface B partout)")
    c = sub.add_parser("check")
    c.add_argument("--tileset", required=True)
    c.add_argument("--tile", type=int, default=32)
    args = p.parse_args()
    {"template": template, "preview": preview, "check": check}[args.cmd](args)


if __name__ == "__main__":
    main()
