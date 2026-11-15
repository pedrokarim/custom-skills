#!/bin/sh
# Rend chaque skill du dépôt disponible dans tous les projets (macOS, Linux).
#
# Équivalent de install.ps1 : crée un lien symbolique par skill dans ~/.claude/skills
# (Claude Code) et ~/.agents/skills (Codex et les autres agents compatibles). Un lien, pas une
# copie : modifier un skill ici le modifie partout.
#
# Usage :
#   ./install.sh                         tous les skills
#   ./install.sh site-indexing           seulement ceux nommés
#   TARGETS="$HOME/.claude/skills" ./install.sh
#   ./install.sh --hooks                 inscrit aussi les hooks du dépôt (voir hooks/README.md)
#
# Relançable à volonté : crée les liens manquants, garde ceux qui sont bons, retire ceux qui
# pointent vers un skill supprimé du dépôt, ne touche jamais à un dossier qui n'en vient pas.
set -eu

repo=$(cd "$(dirname "$0")" && pwd -P)
newline='
'
# Une cible par ligne, pour supporter les espaces dans les chemins.
targets=${TARGETS:-"$HOME/.claude/skills$newline$HOME/.agents/skills"}
# Windsurf ne lit que son propre dossier de skills : on l'alimente aussi, s'il est installé.
# Copilot et Cursor lisent déjà ~/.claude/skills ou ~/.agents/skills.
if [ -z "${TARGETS:-}" ] && [ -d "$HOME/.codeium/windsurf" ]; then
  targets="$targets$newline$HOME/.codeium/windsurf/skills"
fi
problems=0
hooks=0

warn() {
  printf '  ! %s\n' "$1"
  problems=$((problems + 1))
}

# --hooks se retire de la liste des skills demandés.
for arg in "$@"; do
  shift
  if [ "$arg" = "--hooks" ]; then hooks=1; else set -- "$@" "$arg"; fi
done

if [ $# -gt 0 ]; then
  requested=$(printf '%s\n' "$@")
else
  requested=$(for dir in "$repo"/*/; do
    if [ -f "$dir/SKILL.md" ]; then basename "$dir"; fi
  done)
fi

# Vérifie l'en-tête de chaque SKILL.md : un skill mal déclaré n'est proposé par aucun agent,
# sans message d'erreur.
skills=''
IFS=$newline
echo "Skills du dépôt"
for name in $requested; do
  file="$repo/$name/SKILL.md"
  if [ ! -f "$file" ]; then
    warn "$name : aucun skill de ce nom dans le dépôt"
    continue
  fi
  header=$(awk 'NR == 1 { next } /^---/ { exit } { print }' "$file" | tr -d '\r')
  declared=$(printf '%s\n' "$header" | sed -n 's/^name:[[:space:]]*//p' | sed 's/[[:space:]]*$//')
  description=$(printf '%s\n' "$header" | sed -n 's/^description:[[:space:]]*//p')
  if [ "$(head -n 1 "$file" | tr -d '\r')" != "---" ]; then
    warn "$name : SKILL.md ne commence pas par un en-tête --- name / description ---"
  elif [ "$declared" != "$name" ]; then
    warn "$name : le champ name vaut « $declared », il doit être le nom du dossier"
  elif [ -z "$description" ]; then
    warn "$name : description absente, aucun agent ne saura quand s'en servir"
  fi
  echo "  · $name"
  skills="$skills$name$newline"
done

for target in $targets; do
  printf '\n%s\n' "$target"
  mkdir -p "$target"

  for name in $skills; do
    link="$target/$name"
    if [ -L "$link" ]; then
      if [ "$(readlink "$link")" = "$repo/$name" ]; then
        echo "  = $name"
      else
        warn "$name : $link pointe ailleurs, laissé tel quel"
      fi
    elif [ -e "$link" ]; then
      warn "$name : $link existe déjà et ne vient pas du dépôt, laissé tel quel"
    else
      ln -s "$repo/$name" "$link"
      echo "  + $name"
    fi
  done

  # Liens laissés par un skill supprimé ou renommé dans le dépôt.
  for link in "$target"/*; do
    [ -L "$link" ] || continue
    destination=$(readlink "$link")
    case "$destination" in
      "$repo"/*)
        if [ ! -e "$destination" ]; then
          rm "$link"
          echo "  - $(basename "$link") (n'existe plus dans le dépôt)"
        fi
        ;;
    esac
  done
done

if [ "$hooks" -eq 1 ]; then
  printf '\nHooks (Claude Code)\n'
  if ! command -v node >/dev/null 2>&1; then
    warn "node introuvable : les hooks ont besoin de Node.js, rien n'est inscrit"
  else
    node "$repo/hooks/register.mjs" || warn "hooks non inscrits (voir le message ci-dessus)"
    node "$repo/hooks/sync-rules.mjs" || warn "règles de Codex non recopiées (voir le message ci-dessus)"
  fi
fi

if [ "$problems" -gt 0 ]; then
  printf '\n%s point(s) à corriger.\n' "$problems"
  exit 1
fi
printf '\nTout est en place. Les nouveaux skills sont proposés dès la prochaine session.\n'
