"""Ramène une image générée à son vrai pixel art : un pixel d'art devient un pixel.

Un générateur rend un « faux » pixel art : de gros blocs de 8, 12 ou 16 px, légèrement flous,
avec des milliers de nuances voisines. Ce script :
  1. trouve la taille des blocs (la période des changements de couleur), si on ne la donne pas ;
  2. prend pour chaque bloc la couleur majoritaire de neuf points pris à l'intérieur (pas la
     moyenne : une moyenne mélange le contour et le fond et invente des couleurs) ;
  3. réduit la palette à N couleurs, plus proche voisine et sans tramage.

Usage :
  python pixelize.py source.png sortie.png [--block auto|12] [--colors 16] [--preview 8]
  python pixelize.py source.png --detect      (affiche seulement la taille des blocs trouvée)

`--preview 8` écrit aussi une version agrandie x8 au plus proche voisin, pour la regarder.
"""

from __future__ import annotations

import argparse
import cmath
import math
from collections import Counter

from PIL import Image


def pixels(image: Image.Image):
    """Les pixels d'une image, quelle que soit la version de Pillow."""
    return image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()


def detect_block(image: Image.Image, lo: float = 3, hi: float = 40) -> float:
    """Taille des blocs : la plus petite période qui aligne presque tous les changements de couleur.

    On relève, sur des lignes et des colonnes prises au hasard régulier, les positions où la
    couleur saute. Pour une période p, la concentration de ces positions modulo p (module de la
    moyenne des exp(2iπx/p)) vaut près de 1 si les sauts tombent tous sur la grille. Les diviseurs
    de la vraie période alignent aussi tous les sauts (un multiple de 8 est un multiple de 4),
    ses multiples n'en alignent qu'une partie : on garde la plus grande période presque aussi
    bonne que la meilleure.
    """
    rgb = image.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    marks: list[float] = []
    for y in range(0, h, max(1, h // 64)):
        for x in range(1, w):
            a, b = px[x - 1, y], px[x, y]
            if sum(abs(a[i] - b[i]) for i in range(3)) > 40:
                marks.append(x)
    for x in range(0, w, max(1, w // 64)):
        for y in range(1, h):
            a, b = px[x, y - 1], px[x, y]
            if sum(abs(a[i] - b[i]) for i in range(3)) > 40:
                marks.append(y)
    if len(marks) < 50:
        raise SystemExit("trop peu de changements de couleur pour trouver la grille : donner --block")
    scores = []
    p = lo
    while p <= hi:
        z = sum(cmath.exp(2j * math.pi * m / p) for m in marks) / len(marks)
        scores.append((p, abs(z)))
        p += 0.25
    best = max(score for _, score in scores)
    return max(period for period, score in scores if score >= best * 0.9)


def phase_of(image: Image.Image, block: float) -> tuple[float, float]:
    """Décalage de la grille : où commence le premier bloc, sur chaque axe."""
    rgb = image.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    zx = sum(
        cmath.exp(2j * math.pi * x / block)
        for y in range(0, h, max(1, h // 48))
        for x in range(1, w)
        if sum(abs(px[x - 1, y][i] - px[x, y][i]) for i in range(3)) > 40
    )
    zy = sum(
        cmath.exp(2j * math.pi * y / block)
        for x in range(0, w, max(1, w // 48))
        for y in range(1, h)
        if sum(abs(px[x, y - 1][i] - px[x, y][i]) for i in range(3)) > 40
    )
    to_offset = lambda z: (cmath.phase(z) / (2 * math.pi) * block) % block if abs(z) > 0 else 0.0
    return to_offset(zx), to_offset(zy)


def downscale(image: Image.Image, block: float, offset: tuple[float, float] = (0, 0)) -> Image.Image:
    """Un pixel par bloc : la couleur majoritaire de neuf points intérieurs, transparence comprise."""
    src = image.convert("RGBA")
    w, h = src.size
    px = src.load()
    ox, oy = offset
    cols = int((w - ox) // block)
    rows = int((h - oy) // block)
    out = Image.new("RGBA", (cols, rows))
    o = out.load()
    for j in range(rows):
        for i in range(cols):
            votes: Counter = Counter()
            for dy in (0.3, 0.5, 0.7):
                for dx in (0.3, 0.5, 0.7):
                    x = min(w - 1, int(ox + (i + dx) * block))
                    y = min(h - 1, int(oy + (j + dy) * block))
                    c = px[x, y]
                    # Un bloc transparent vote transparent ; sinon on regroupe les nuances voisines.
                    key = (0, 0, 0, 0) if c[3] < 128 else (c[0] // 4 * 4, c[1] // 4 * 4, c[2] // 4 * 4, 255)
                    votes[key] += 1
            o[i, j] = votes.most_common(1)[0][0]
    return out


def reduce_palette(image: Image.Image, colors: int) -> Image.Image:
    """Palette de N couleurs, sans tramage ; la transparence reste franche."""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    quant = rgba.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    out = quant.convert("RGBA")
    out.putalpha(alpha.point(lambda a: 255 if a >= 128 else 0))
    return out


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("source")
    p.add_argument("out", nargs="?")
    p.add_argument("--block", default="auto", help="taille d'un pixel d'art en px, ou auto")
    p.add_argument("--colors", type=int, default=0, help="palette finale (0 : garder)")
    p.add_argument("--preview", type=int, default=0, help="écrit aussi <sortie>-xN.png agrandi")
    p.add_argument("--detect", action="store_true", help="affiche la taille des blocs et s'arrête")
    args = p.parse_args()

    image = Image.open(args.source)
    block = detect_block(image) if args.block == "auto" else float(args.block)
    if args.detect or not args.out:
        print(f"{args.source} : blocs de {block:g} px, soit {image.width / block:.1f} x {image.height / block:.1f} pixels d'art")
        return
    # Une image qui se divise exactement par le bloc part de 0 : estimer un décalage y ferait
    # perdre une rangée. Sinon (planche recadrée par le générateur), on le mesure.
    exact = image.width % block == 0 and image.height % block == 0
    out = downscale(image, block, (0, 0) if exact else phase_of(image, block))
    if args.colors:
        out = reduce_palette(out, args.colors)
    out.save(args.out)
    if args.preview:
        big = out.resize((out.width * args.preview, out.height * args.preview), Image.NEAREST)
        big.save(args.out.rsplit(".", 1)[0] + f"-x{args.preview}.png")
    colors = len(set(pixels(out)))
    print(f"{args.out} : {out.width} x {out.height}, blocs de {block:g} px, {colors} couleurs")


if __name__ == "__main__":
    main()
