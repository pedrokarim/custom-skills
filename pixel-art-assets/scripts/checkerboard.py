"""Damier de référence : donne au générateur la densité de pixels voulue.

Un générateur d'images peint un « faux » pixel art sur une grille qu'il choisit lui-même, et il
la choisit souvent trop fine. Joint en image de référence, un damier dont chaque case fait la
taille d'un pixel d'art lui montre la grille à tenir. Les cases alternent deux gris neutres pour
ne pas déteindre sur la palette.

Usage :
  python checkerboard.py --out damier.png --art 192 --size 1536
    --art   nombre de pixels d'art sur la largeur de la planche (192 : un pixel d'art = 8 px)
    --size  taille de l'image en pixels (carrée par défaut, --height pour une autre hauteur)
"""

from __future__ import annotations

import argparse

from PIL import Image


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--out", required=True)
    p.add_argument("--art", type=int, default=192, help="pixels d'art sur la largeur")
    p.add_argument("--size", type=int, default=1536, help="largeur de l'image en pixels")
    p.add_argument("--height", type=int, default=None, help="hauteur de l'image (par défaut : carrée)")
    args = p.parse_args()

    width = args.size
    height = args.height or args.size
    step = width / args.art
    rows = round(height / step)
    small = Image.new("RGB", (args.art, rows))
    px = small.load()
    for y in range(rows):
        for x in range(args.art):
            px[x, y] = (150, 150, 150) if (x + y) % 2 else (105, 105, 105)
    small.resize((width, height), Image.NEAREST).save(args.out)
    print(f"{args.out} : {args.art} x {rows} pixels d'art de {step:g} px")


if __name__ == "__main__":
    main()
