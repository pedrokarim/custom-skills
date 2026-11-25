"""Découpe une planche générée (grille de cases sur fond chroma) en sprites au pixel près.

Ce que fait le script, et pourquoi :
  - la taille d'un pixel d'art vient de la grille détectée (pixelize.detect_block), ou de --art :
    Codex rend parfois une planche d'une autre taille que demandé, le pas réel en dépend ;
  - le fond est la couleur la plus fréquente de la planche ; seul un pixel très proche d'elle est
    du fond, pour qu'un objet de la même famille de couleur (feuilles vert vif sur fond vert) ne
    soit jamais percé ;
  - chaque pixel d'art prend la couleur majoritaire de neuf points de son bloc ;
  - le liseré du bord (mélange du fond et du contour) est retiré, et un pixel intérieur resté
    proche du fond prend la couleur de ses voisins ;
  - un trou fermé (aucun chemin transparent vers le bord) est rebouché : un objet n'a pas de trou,
    sauf les cases données dans --keep-holes (mailles d'un filet, jours d'une grille) ;
  - chaque sprite est rogné à son contenu, ou posé sur un canevas commun (--canvas) ;
  - une planche contact agrandie est écrite à côté, pour tout vérifier d'un coup d'œil.

Usage :
  python cut_sheet.py planche.png sortie/ --grid 4x4 [--art auto|128] [--names a,b,c]
      [--keep-holes 3,5] [--no-chroma-hue] [--canvas 32x32] [--colors 16] [--contact 6]

  --art            pixels d'art sur la largeur de la planche ; plus petit = sprites plus petits
                   (des pièges posés sur une case de jeu : 128 au lieu de 192)
  --no-chroma-hue  planche sans aucun objet de la teinte du fond : toute teinte proche est un
                   mélange avec le fond et prend la couleur de ses voisins
  --names          noms des fichiers dans l'ordre des cases ; une case sans nom est ignorée
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter, deque
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from pixelize import detect_block, pixels, reduce_palette  # noqa: E402

BG_DISTANCE = 60


def option_list(text: str) -> list[str]:
    return [part.strip() for part in text.split(",") if part.strip()]


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("sheet")
    p.add_argument("out_dir")
    p.add_argument("--grid", default="3x3", help="LIGNESxCOLONNES")
    p.add_argument("--art", default="auto", help="pixels d'art sur la largeur, ou auto")
    p.add_argument("--names", default="")
    p.add_argument("--keep-holes", default="")
    p.add_argument("--no-chroma-hue", action="store_true")
    p.add_argument("--canvas", default="", help="LxH : chaque sprite posé en bas au centre de ce canevas")
    p.add_argument("--colors", type=int, default=0, help="palette commune à toute la planche (0 : garder)")
    p.add_argument("--contact", type=int, default=6, help="agrandissement de la planche contact (0 : aucune)")
    p.add_argument("--keep-cell", action="store_true", help="garder la case entière, sans rogner : les images d'une animation restent calées")
    p.add_argument("--gif", type=int, default=0, help="écrit aussi _animation.gif à ce nombre d'images par seconde")
    args = p.parse_args()

    rows, cols = (int(v) for v in args.grid.lower().split("x"))
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(args.sheet).convert("RGB")
    art_pixels = round(sheet.width / detect_block(sheet)) if args.art == "auto" else int(args.art)
    step = sheet.width / art_pixels
    cell_w = art_pixels // cols
    cell_h = round(sheet.height / step) // rows
    bg = Counter(pixels(sheet.resize((128, 128), Image.NEAREST))).most_common(1)[0][0]
    names = option_list(args.names)
    keep = {int(k) for k in option_list(args.keep_holes)}
    px = sheet.load()

    def is_bg(c):
        return sum((c[k] - bg[k]) ** 2 for k in range(3)) < BG_DISTANCE**2

    sprites: list[tuple[str, Image.Image]] = []
    for k in range(rows * cols):
        name = names[k] if k < len(names) else (None if names else f"{k + 1:02d}")
        if not name:
            continue
        cx0, cy0 = (k % cols) * cell_w, (k // cols) * cell_h
        art = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
        o = art.load()
        for j in range(cell_h):
            for i in range(cell_w):
                votes: Counter = Counter()
                bgs = 0
                for dy in (0.25, 0.5, 0.75):
                    for dx in (0.25, 0.5, 0.75):
                        x = min(sheet.width - 1, int((cx0 + i + dx) * step))
                        y = min(sheet.height - 1, int((cy0 + j + dy) * step))
                        c = px[x, y]
                        if is_bg(c):
                            bgs += 1
                        else:
                            votes[(c[0] // 4 * 4, c[1] // 4 * 4, c[2] // 4 * 4)] += 1
                if votes and bgs <= 4:
                    o[i, j] = (*votes.most_common(1)[0][0], 255)
        strip_fringe(art, bg, args.no_chroma_hue)
        if k + 1 not in keep:
            fill_holes(art)
        if not args.keep_cell:
            box = art.getbbox()
            if box:
                art = art.crop(box)
        sprites.append((name, art))

    if args.colors:
        sprites = shared_palette(sprites, args.colors)
    if args.canvas:
        cw, ch = (int(v) for v in args.canvas.lower().split("x"))
        placed = []
        for name, art in sprites:
            canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
            if art.width > cw or art.height > ch:
                print(f"attention : {name} ({art.width} x {art.height}) dépasse le canevas {cw} x {ch}")
            canvas.alpha_composite(art, ((cw - art.width) // 2, max(0, ch - art.height)))
            placed.append((name, canvas))
        sprites = placed
    for name, art in sprites:
        art.save(out_dir / f"{name}.png")
        print(f"{name} : {art.width} x {art.height}")
    if args.contact:
        contact(sprites, out_dir / "_contact.png", args.contact)
    if args.gif:
        scale = max(1, args.contact or 4)
        frames = [art.resize((art.width * scale, art.height * scale), Image.NEAREST) for _, art in sprites]
        frames[0].save(out_dir / "_animation.gif", save_all=True, append_images=frames[1:], duration=round(1000 / args.gif), loop=0, disposal=2)
    print(f"pas de la grille : {step:.2f} px, {art_pixels} pixels d'art sur la largeur, fond {bg}")


def strip_fringe(art: Image.Image, bg, no_chroma_hue: bool) -> None:
    """Retire le liseré du fond au bord, puis remplace les mélanges restés à l'intérieur."""
    w, h = art.size
    o = art.load()
    lead = max(range(3), key=lambda c: bg[c])
    for _ in range(2):
        doomed = []
        for y in range(h):
            for x in range(w):
                c = o[x, y]
                if not c[3]:
                    continue
                edge = any(not (0 <= nx < w and 0 <= ny < h) or o[nx, ny][3] == 0 for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
                others = [c[i] for i in range(3) if i != lead]
                if edge and c[lead] > 60 and c[lead] > 1.4 * max(others) + 20:
                    doomed.append((x, y))
        for x, y in doomed:
            o[x, y] = (0, 0, 0, 0)

    def chroma(c):
        if sum((c[i] - bg[i]) ** 2 for i in range(3)) < 100**2:
            return True
        others = [c[i] for i in range(3) if i != lead]
        return no_chroma_hue and c[lead] > 1.4 * max(others) + 20

    for y in range(h):
        for x in range(w):
            c = o[x, y]
            if c[3] and chroma(c):
                around = Counter(
                    o[nx, ny][:3]
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
                    if 0 <= nx < w and 0 <= ny < h and o[nx, ny][3] and not chroma(o[nx, ny])
                )
                o[x, y] = (*around.most_common(1)[0][0], 255) if around else (0, 0, 0, 0)


def fill_holes(art: Image.Image) -> None:
    """Un pixel transparent qu'on n'atteint pas depuis le bord en passant par du transparent est un
    trou : il prend la couleur la plus fréquente de ses voisins opaques."""
    w, h = art.size
    o = art.load()
    outside = [[False] * h for _ in range(w)]
    border = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    queue = deque()
    for x, y in border:
        if o[x, y][3] == 0 and not outside[x][y]:
            outside[x][y] = True
            queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not outside[nx][ny] and o[nx, ny][3] == 0:
                outside[nx][ny] = True
                queue.append((nx, ny))
    for _ in range(3):
        for y in range(h):
            for x in range(w):
                if o[x, y][3] or outside[x][y]:
                    continue
                around = Counter(o[nx, ny][:3] for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if 0 <= nx < w and 0 <= ny < h and o[nx, ny][3])
                if around:
                    o[x, y] = (*around.most_common(1)[0][0], 255)


def shared_palette(sprites, colors: int):
    """Une seule palette pour toute la planche : quantifier les sprites ensemble, pas un par un,
    sinon deux icônes du même jeu n'ont plus le même brun ni le même contour."""
    total_w = sum(art.width for _, art in sprites) or 1
    height = max(art.height for _, art in sprites)
    strip = Image.new("RGBA", (total_w, height), (0, 0, 0, 0))
    x = 0
    for _, art in sprites:
        strip.alpha_composite(art, (x, 0))
        x += art.width
    reduced = reduce_palette(strip, colors)
    out, x = [], 0
    for name, art in sprites:
        out.append((name, reduced.crop((x, 0, x + art.width, art.height))))
        x += art.width
    return out


def contact(sprites, path: Path, scale: int) -> None:
    """Tous les sprites côte à côte sur un fond neutre, agrandis au plus proche voisin."""
    pad = 4
    height = max(art.height for _, art in sprites) + 2 * pad
    width = sum(art.width + pad for _, art in sprites) + pad
    sheet = Image.new("RGBA", (width, height), (60, 54, 70, 255))
    x = pad
    for _, art in sprites:
        sheet.alpha_composite(art, (x, height - pad - art.height))
        x += art.width + pad
    sheet.resize((width * scale, height * scale), Image.NEAREST).save(path)


if __name__ == "__main__":
    main()
