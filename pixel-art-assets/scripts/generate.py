"""Fait dessiner une image par Codex (outil de génération d'images de son modèle).

Codex lit la consigne sur l'entrée standard, voit les images jointes (`-i`) et écrit l'image dans
le dossier de travail. Le journal complet reste à côté : Codex y explique ce qu'il a fait, et
c'est là qu'on lit un refus ou une image écrite sous un autre nom.

Usage :
  python generate.py --prompt planche.txt --dir gen --expect planche.png [--ref damier.png ...]

Une image déjà présente n'est pas redemandée (une génération coûte du temps) : la supprimer ou
changer de nom pour en avoir une autre. Plusieurs générations indépendantes peuvent tourner en
parallèle, chacune dans son dossier.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--prompt", required=True, help="fichier de consigne (make_prompt.py)")
    p.add_argument("--dir", required=True, help="dossier de travail de Codex, où l'image est écrite")
    p.add_argument("--expect", required=True, help="nom de l'image attendue dans ce dossier")
    p.add_argument("--ref", action="append", default=[], help="image jointe (plusieurs fois possible)")
    p.add_argument("--timeout", type=int, default=900, help="secondes avant d'abandonner")
    args = p.parse_args()

    codex = shutil.which("codex")
    if not codex:
        sys.exit("codex est introuvable dans le PATH.")
    work = Path(args.dir).resolve()
    work.mkdir(parents=True, exist_ok=True)
    target = work / args.expect
    if target.exists():
        print(f"déjà là : {target}")
        return

    cmd = [codex, "exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "-C", str(work)]
    for ref in args.ref:
        cmd += ["-i", str(Path(ref).resolve())]
    cmd.append("-")
    log = work / f"{target.stem}.codex.log"
    start = time.time()
    with open(args.prompt, encoding="utf-8") as prompt, open(log, "w", encoding="utf-8") as out:
        try:
            subprocess.run(cmd, stdin=prompt, stdout=out, stderr=subprocess.STDOUT, timeout=args.timeout, check=False)
        except subprocess.TimeoutExpired:
            sys.exit(f"délai dépassé ({args.timeout} s), voir {log}")
    seconds = round(time.time() - start)
    if target.exists():
        print(f"ok en {seconds} s : {target}")
        return
    # Codex écrit parfois l'image sous un autre nom : on la signale plutôt que de la deviner.
    others = sorted(work.glob("*.png"), key=lambda f: f.stat().st_mtime, reverse=True)
    hint = f" ; image la plus récente : {others[0].name}" if others else ""
    sys.exit(f"pas d'image {target.name} après {seconds} s, voir {log}{hint}")


if __name__ == "__main__":
    main()
