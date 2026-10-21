"""Transforme une image fixe en animation pixel art à aplats, en boucle (GIF + image fixe pixelisée).

Une image générée n'a que *l'air* du pixel art : ses « pixels » ne tombent sur aucune grille et
ses aplats cachent des dégradés. Ce script ramène d'abord l'image à une vraie grille de pixels
avec une palette réduite, puis anime de petits éléments par-dessus. Chaque mouvement est
périodique sur la durée de la boucle : le GIF se referme sans saut.

Exemple :
    python animate.py --src scene.png --out out/scene.gif --horizon 0.735 \
        --stars 9 --petals 22 --petal-color 150,28,44 --petal-box 0.04,0.30,0.34,0.52

Dépendances : pillow, numpy.
"""
import argparse
import math
from pathlib import Path

import numpy as np
from PIL import Image


def noise(seed):
    """Valeur pseudo-aléatoire déterministe dans [0, 1) : même graine, même résultat à chaque fois."""
    s = math.sin(seed * 127.1) * 43758.5453
    return s - math.floor(s)


def parse_color(text):
    return tuple(int(v) for v in text.split(","))


def parse_box(text):
    return tuple(float(v) for v in text.split(","))


def is_warm(rgb):
    """Pixels qui se lisent comme du feu : canal rouge vif, nettement au-dessus du bleu."""
    return (rgb[..., 0] > 140) & (rgb[..., 0] > rgb[..., 2] * 1.6)


def pixelize(src, grid, colors, keep_warm):
    """Ramène l'image à la grille de pixels et l'aplatit sur une petite palette."""
    w, h = grid
    img = Image.open(src).convert("RGB").resize((w, h), Image.Resampling.BOX)
    flat = img.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    out = np.asarray(flat.convert("RGB")).astype(np.float32)
    if keep_warm:
        # Un accent minuscule (une flamme de bougie fait une douzaine de pixels) ne survit pas à
        # la réduction de palette, qui dépense ses couleurs sur les grandes surfaces. On le remet
        # tel quel.
        raw = np.asarray(img).astype(np.float32)
        mask = is_warm(raw)
        out[mask] = raw[mask]
    return out


def put(frame, x, y, color, alpha=1.0):
    h, w = frame.shape[:2]
    x, y = int(round(x)), int(round(y))
    if 0 <= x < w and 0 <= y < h and alpha > 0:
        frame[y, x] = frame[y, x] * (1 - alpha) + np.array(color, dtype=np.float32) * alpha


def ripple(frame, base, horizon_y, phase, strength):
    """Décale chaque ligne d'eau d'un ou deux pixels sur le côté, comme une onde qui avance."""
    h, w = base.shape[:2]
    cols = np.arange(w)
    for y in range(horizon_y + 1, h):
        depth = (y - horizon_y) / max(1, h - horizon_y)
        amp = (0.6 + depth * 2.2) * strength
        shift = int(round(math.sin(phase * math.tau + y * 0.55) * amp))
        # On bloque au bord au lieu de reboucler : une ligne rebouclée déborde du bord opposé.
        frame[y] = base[y][np.clip(cols - shift, 0, w - 1)]


def stars(frame, phase, horizon_y, color, count):
    w = frame.shape[1]
    for k in range(count):
        x = noise(11 + k * 3.1) * w
        y = noise(11 + k * 7.7) * horizon_y * 0.55
        # Chaque étoile clignote un nombre entier de fois par boucle, à son propre rythme.
        blink = 0.5 + 0.5 * math.sin(phase * math.tau * (1 + k % 3) + k * 2.4)
        put(frame, x, y, color, 0.25 + 0.75 * blink)


def petals(frame, phase, horizon_y, color, count, box):
    """Particules qui tombent de `box` jusqu'à la ligne d'eau, en dérivant et en oscillant, avec un léger reflet."""
    h, w = frame.shape[:2]
    x0f, y0f, x1f, y1f = box
    for k in range(count):
        life = (phase * (1 + k % 2) + noise(k * 5.3)) % 1.0
        x0 = w * (x0f + noise(k * 2.9) * (x1f - x0f))
        y0 = h * (y0f + noise(k * 9.1) * (y1f - y0f))
        x = x0 + life * w * 0.10 + math.sin(life * math.tau * 2 + k) * 3
        y = y0 + life * (horizon_y - y0)
        fade = min(1.0, life * 6) * min(1.0, (1 - life) * 5)
        put(frame, x, y, color, fade)
        if k % 3 == 0:
            put(frame, x + 1, y, color, fade)
        put(frame, x, 2 * horizon_y - y, color, fade * 0.35)


def flicker(frame, base, phase, horizon_y, tip_color):
    """Fait respirer chaque pixel chaud, et danser d'un pixel la pointe de la flamme."""
    mask = is_warm(base)
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return
    level = 0.82 + 0.18 * math.sin(phase * math.tau * 5) * math.sin(phase * math.tau * 3 + 1.3)
    frame[ys, xs] = np.clip(base[ys, xs] * level, 0, 255)
    above = ys[ys < horizon_y]
    if len(above):
        top = int(above.min())
        tip_x = int(round(xs[ys == top].mean()))
        put(frame, tip_x + int(round(math.sin(phase * math.tau * 4))), top - 1, tip_color, 0.9)


def fireflies(frame, phase, horizon_y, color, count, box):
    h, w = frame.shape[:2]
    x0f, y0f, x1f, y1f = box
    t = phase * math.tau
    for k in range(count):
        x = w * (x0f + noise(k * 4.1) * (x1f - x0f)) + math.sin(t * (1 + k % 2) + k) * 5
        y = h * (y0f + noise(k * 8.3) * (y1f - y0f)) + math.cos(t + k * 1.7) * 3
        put(frame, x, min(y, horizon_y - 1), color, max(0.0, math.sin(t * 2 + k * 1.9)) * 0.9)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--src", required=True, help="image source (toute taille, 16:9 conseillé)")
    p.add_argument("--out", required=True, help="chemin du GIF produit ; un '-still.png' est écrit à côté")
    p.add_argument("--grid", default="334x188", help="grille de pixels, LARGEURxHAUTEUR (334x188 par défaut)")
    p.add_argument("--scale", type=int, default=4, help="agrandissement entier de la sortie (4 par défaut)")
    p.add_argument("--colors", type=int, default=28, help="taille de la palette de l'image fixe (28 par défaut)")
    p.add_argument("--frames", type=int, default=48)
    p.add_argument("--fps", type=int, default=12)
    p.add_argument("--horizon", type=float, default=None, help="ligne d'eau, en fraction de la hauteur ; à omettre s'il n'y a pas d'eau")
    p.add_argument("--ripple", type=float, default=1.0, help="force de l'ondulation (0 la désactive)")
    p.add_argument("--stars", type=int, default=0)
    p.add_argument("--star-color", type=parse_color, default=(232, 232, 245))
    p.add_argument("--petals", type=int, default=0)
    p.add_argument("--petal-color", type=parse_color, default=(150, 28, 44))
    p.add_argument("--petal-box", type=parse_box, default=(0.04, 0.30, 0.34, 0.52), help="x0,y0,x1,y1 en fractions")
    p.add_argument("--flicker", action="store_true", help="anime les pixels chauds (couleur de feu)")
    p.add_argument("--fireflies", type=int, default=0)
    p.add_argument("--firefly-color", type=parse_color, default=(150, 220, 150))
    p.add_argument("--firefly-box", type=parse_box, default=(0.07, 0.40, 0.37, 0.68))
    a = p.parse_args()

    grid = tuple(int(v) for v in a.grid.lower().split("x"))
    w, h = grid
    base = pixelize(a.src, grid, a.colors, keep_warm=True)
    horizon_y = int(h * a.horizon) if a.horizon is not None else h - 1

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    big = (w * a.scale, h * a.scale)

    def to_image(arr):
        return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize(big, Image.Resampling.NEAREST)

    to_image(base).save(out.with_name(out.stem + "-still.png"))

    images = []
    for i in range(a.frames):
        phase = i / a.frames
        frame = base.copy()
        if a.horizon is not None and a.ripple > 0:
            ripple(frame, base, horizon_y, phase, a.ripple)
        if a.stars:
            stars(frame, phase, horizon_y, a.star_color, a.stars)
        if a.petals:
            petals(frame, phase, horizon_y, a.petal_color, a.petals, a.petal_box)
        if a.flicker:
            flicker(frame, base, phase, horizon_y, (255, 214, 130))
        if a.fireflies:
            fireflies(frame, phase, horizon_y, a.firefly_color, a.fireflies, a.firefly_box)
        images.append(to_image(frame))

    # Une seule palette pour toute la boucle : une palette par image fait scintiller les aplats.
    sheet = Image.new("RGB", (big[0], big[1] * 3))
    for n, idx in enumerate((0, a.frames // 3, 2 * a.frames // 3)):
        sheet.paste(images[idx], (0, big[1] * n))
    palette = sheet.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    paletted = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in images]
    paletted[0].save(out, save_all=True, append_images=paletted[1:], duration=round(1000 / a.fps), loop=0, optimize=True)
    print(f"{out}  {a.frames} frames  {big[0]}x{big[1]}  {a.fps} fps")


if __name__ == "__main__":
    main()
