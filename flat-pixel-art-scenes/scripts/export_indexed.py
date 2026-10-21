"""Écrit une image sous forme de pixels indexés dans un fichier source, au lieu d'embarquer un PNG.

Certains projets refusent les fichiers binaires : tout doit vivre dans le code. Une scène pixel
art à aplats s'y prête bien, car les longues plages d'une même couleur ne pèsent presque rien.
Ce script ramène l'image à une grille de pixels, la réduit à une petite palette, et écrit un
module TypeScript qui contient la palette et une chaîne encodée par plages.

Format de la chaîne : une lettre par plage (a-z puis A-Z, l'indice dans la palette), suivie de
la longueur de la plage en décimal quand elle dépasse un. Les lignes se suivent sans séparateur.

Exemple :
    python export_indexed.py --src scene.png --out src/data/menuart.ts --name MENU_ART

Décodage, en TypeScript :
    let i = 0;
    for (const [, letter, count] of art.rle.matchAll(/([a-zA-Z])(\\d*)/g)) {
      const index = letter >= 'a' ? letter.charCodeAt(0) - 97 : letter.charCodeAt(0) - 65 + 26;
      for (let n = Number(count || 1); n > 0; n--) pixels[i++] = index;
    }

Dépendances : pillow, numpy.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--src", required=True)
    p.add_argument("--out", required=True, help="fichier TypeScript à écrire")
    p.add_argument("--name", default="ART", help="nom de la constante exportée")
    p.add_argument("--grid", default="334x188")
    p.add_argument("--colors", type=int, default=28, help="taille de la palette, 52 au plus")
    a = p.parse_args()

    if a.colors > len(LETTERS):
        raise SystemExit(f"{len(LETTERS)} couleurs au plus")
    w, h = (int(v) for v in a.grid.lower().split("x"))
    img = Image.open(a.src).convert("RGB").resize((w, h), Image.Resampling.BOX)
    flat = img.quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    indices = np.asarray(flat).reshape(-1)
    raw = flat.getpalette()[: a.colors * 3]
    palette = ["#%02x%02x%02x" % tuple(raw[i:i + 3]) for i in range(0, len(raw), 3)]

    runs = []
    start = 0
    for i in range(1, len(indices) + 1):
        if i == len(indices) or indices[i] != indices[start]:
            length = i - start
            runs.append(LETTERS[indices[start]] + (str(length) if length > 1 else ""))
            start = i
    rle = "".join(runs)

    lines = [
        "/* Généré par export_indexed.py – ne pas modifier à la main. */",
        f"export const {a.name} = {{",
        f"  w: {w},",
        f"  h: {h},",
        "  palette: [" + ", ".join(f"'{c}'" for c in palette) + "],",
        "  rle:",
    ]
    # Coupe la chaîne en lignes de source d'une largeur raisonnable.
    chunks = [rle[i:i + 96] for i in range(0, len(rle), 96)]
    for n, chunk in enumerate(chunks):
        lines.append(f"    '{chunk}'" + (" +" if n < len(chunks) - 1 else ","))
    lines.append("} as const;")
    Path(a.out).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{a.out} : {w}x{h}, {len(palette)} couleurs, {len(rle)} caractères")


if __name__ == "__main__":
    main()
