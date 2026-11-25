"""Textures raccordables : vérifier le raccord, voir la répétition, animer en boucle par le code.

Une texture animée (eau, lave, herbe au vent, brume) ne se redessine pas image par image : le
générateur ne garde ni la grille ni le raccord d'une image à l'autre. On génère UNE texture
raccordable, puis le code la fait bouger. Chaque effet boucle par construction (la dernière image
retombe sur la première) et garde le raccord sur les quatre bords :

  scroll   la texture glisse de (dx, dy) textures entières sur la boucle : courant, nuages ;
  wave     chaque rangée se décale d'un nombre entier de pixels selon une vague : eau, chaleur ;
  shimmer  les tons de la palette glissent le long d'une vague : reflets, lave, cristaux.

Usage :
  python texture.py check   eau.png
  python texture.py tile    eau.png --out eau-3x3.png [--scale 4]
  python texture.py animate eau.png --out eau.gif --frames 16 --fps 8 --wave 1 --shimmer 2 [--scroll 1,0]

`animate` écrit aussi la bande des images (<sortie>-strip.png) pour un moteur de jeu.
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from pixelize import pixels  # noqa: E402


def edge_report(image: Image.Image) -> tuple[float, float, float]:
    rgb = image.convert("RGB")
    w, h = rgb.size
    px = rgb.load()

    def gap(a, b):
        return sum(abs(a[i] - b[i]) for i in range(3)) / 3

    lr = sum(gap(px[0, y], px[w - 1, y]) for y in range(h)) / h
    tb = sum(gap(px[x, 0], px[x, h - 1]) for x in range(w)) / w
    inner = sum(gap(px[x, y], px[x + 1, y]) for y in range(0, h, 2) for x in range(w - 1)) / ((h // 2 + h % 2) * (w - 1))
    return lr, tb, inner


def check(args) -> None:
    image = Image.open(args.texture)
    lr, tb, inner = edge_report(image)
    verdict = "raccord propre" if max(lr, tb) <= inner * 1.6 + 4 else "raccord visible : régénérer, ou retoucher les bords"
    print(f"{args.texture} : gauche/droite {lr:.1f}, haut/bas {tb:.1f}, voisins {inner:.1f} -> {verdict}")


def tile(args) -> None:
    image = Image.open(args.texture).convert("RGBA")
    w, h = image.size
    out = Image.new("RGBA", (w * 3, h * 3))
    for j in range(3):
        for i in range(3):
            out.paste(image, (i * w, j * h))
    if args.scale > 1:
        out = out.resize((out.width * args.scale, out.height * args.scale), Image.NEAREST)
    out.save(args.out)
    print(f"{args.out} : texture répétée 3 x 3")


def palette_ramp(image: Image.Image) -> list[tuple[int, int, int]]:
    """Les couleurs de la texture, de la plus sombre à la plus claire."""
    colors = {c[:3] for c in pixels(image.convert("RGBA")) if c[3]}
    return sorted(colors, key=lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2])


def frame_at(base: Image.Image, t: float, args, ramp, index_of) -> Image.Image:
    w, h = base.size
    src = base.load()
    out = Image.new("RGBA", (w, h))
    o = out.load()
    sx, sy = args.scroll
    shift_x = round(sx * w * t)
    shift_y = round(sy * h * t)
    for y in range(h):
        # Vague : un décalage entier par rangée ; la période divise la hauteur pour que le haut
        # et le bas de la texture restent raccordés.
        rows_per_wave = max(1, h // max(1, args.wave_count))
        dx = round(args.wave * math.sin(2 * math.pi * (t + y / rows_per_wave))) if args.wave else 0
        for x in range(w):
            c = src[(x - shift_x - dx) % w, (y - shift_y) % h]
            if args.shimmer and c[3]:
                # Reflet : on monte ou on descend dans la rampe de luminosité selon une vague
                # diagonale qui défile ; les bornes de la rampe restent les bornes.
                k = index_of[c[:3]]
                wave = math.sin(2 * math.pi * (t * args.shimmer_speed - (x + y) / max(4, w / 2)))
                k2 = min(len(ramp) - 1, max(0, k + round(args.shimmer * max(0.0, wave) - args.shimmer * 0.25 * max(0.0, -wave))))
                c = (*ramp[k2], c[3])
            o[x, y] = c
    return out


def animate(args) -> None:
    base = Image.open(args.texture).convert("RGBA")
    ramp = palette_ramp(base)
    index_of = {c: k for k, c in enumerate(ramp)}
    frames = [frame_at(base, f / args.frames, args, ramp, index_of) for f in range(args.frames)]
    scale = args.scale
    big = [f.resize((f.width * scale, f.height * scale), Image.NEAREST) for f in frames]
    big[0].save(args.out, save_all=True, append_images=big[1:], duration=round(1000 / args.fps), loop=0, disposal=2)
    strip = Image.new("RGBA", (base.width * args.frames, base.height))
    for k, f in enumerate(frames):
        strip.paste(f, (k * base.width, 0))
    strip.save(args.out.rsplit(".", 1)[0] + "-strip.png")
    print(f"{args.out} : {args.frames} images à {args.fps} i/s, bande {strip.width} x {strip.height}, {len(ramp)} couleurs")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check")
    c.add_argument("texture")
    t = sub.add_parser("tile")
    t.add_argument("texture")
    t.add_argument("--out", required=True)
    t.add_argument("--scale", type=int, default=4)
    a = sub.add_parser("animate")
    a.add_argument("texture")
    a.add_argument("--out", required=True)
    a.add_argument("--frames", type=int, default=16)
    a.add_argument("--fps", type=int, default=8)
    a.add_argument("--scale", type=int, default=4, help="agrandissement du GIF")
    a.add_argument("--scroll", type=lambda v: tuple(float(x) for x in v.split(",")), default=(0.0, 0.0), help="textures parcourues sur la boucle, dx,dy (entiers pour boucler)")
    a.add_argument("--wave", type=int, default=0, help="amplitude de la vague, en pixels")
    a.add_argument("--wave-count", type=int, default=2, help="vagues sur la hauteur")
    a.add_argument("--shimmer", type=int, default=0, help="crans de luminosité gagnés par les reflets")
    a.add_argument("--shimmer-speed", type=int, default=1, help="passages du reflet par boucle")
    args = p.parse_args()
    {"check": check, "tile": tile, "animate": animate}[args.cmd](args)


if __name__ == "__main__":
    main()
