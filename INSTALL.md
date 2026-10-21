# Installer custom-skills – instructions pour un agent

Ce fichier s'adresse à toi, l'agent de code (Claude Code, Codex, ou un autre) à qui
l'utilisateur a demandé d'installer les skills de `https://github.com/pedrokarim/custom-skills`.
Fais toute l'installation toi-même, dans l'ordre, sans renvoyer l'utilisateur taper des
commandes. Ne lui pose une question que là où ce fichier le dit. Réponds-lui dans sa langue.

## 1. Comprendre la demande

Deux choix, à lire dans la phrase de l'utilisateur. Sans précision, prendre le défaut, **même
si tu tournes déjà dans un dépôt** : être dans un projet ne veut pas dire installer dans ce
projet.

| Choix | Défaut | Autre cas |
|---|---|---|
| Quels skills | **tous** | seulement ceux qu'il a nommés |
| Pour qui | **toute la machine**, tous les projets | **ce projet seulement**, s'il le dit explicitement |

Exemples :

- « Installe les skills de … » → tous, toute la machine ;
- « Installe seulement site-indexing de … » → un skill, toute la machine ;
- « Ajoute les skills de … dans ce projet », « … pour l'équipe », « … dans le dépôt » → tous,
  ce projet seulement.

Les skills disponibles sont les dossiers du dépôt qui contiennent un `SKILL.md` ; le tableau
du `README.md` dit à quoi sert chacun.

## 2. Récupérer le dépôt

### Chercher un clone existant

Un clone déjà installé se reconnaît à ses liens : dans `~/.claude/skills` ou
`~/.agents/skills`, **n'importe quel** lien dont la cible est un dossier dont le parent contient
`INSTALL.md` et `install.ps1`. Ce parent est le clone.

Windows (PowerShell) :

```powershell
Get-ChildItem "$HOME\.claude\skills", "$HOME\.agents\skills" -Directory -ErrorAction SilentlyContinue |
  Where-Object LinkType | ForEach-Object { Split-Path @($_.Target)[0] } |
  Where-Object { (Test-Path (Join-Path $_ 'INSTALL.md')) -and (Test-Path (Join-Path $_ 'install.ps1')) } |
  Sort-Object -Unique
```

macOS, Linux :

```sh
for link in ~/.claude/skills/* ~/.agents/skills/*; do
  [ -L "$link" ] || continue
  parent=$(dirname "$(readlink "$link")")
  [ -f "$parent/INSTALL.md" ] && [ -f "$parent/install.sh" ] && echo "$parent"
done | sort -u
```

Si un clone est trouvé, le mettre à jour : `git -C <clone> pull --ff-only`. Si la commande
échoue (modifications locales, historique divergent, accès refusé), **ne rien forcer** : ni
`reset`, ni `stash`, ni changement de remote. Continuer avec le clone tel qu'il est, et le
signaler dans le compte rendu.

### Sinon, cloner

Dans le dossier que l'utilisateur a indiqué, sinon dans le dossier personnel, en HTTPS (aucune
clé SSH requise) :

| Système | Commande |
|---|---|
| Windows | `git clone https://github.com/pedrokarim/custom-skills.git "$HOME\custom-skills"` |
| macOS, Linux | `git clone https://github.com/pedrokarim/custom-skills.git "$HOME/custom-skills"` |

Sous PowerShell, écrire `$HOME`, pas `~` : passé à un programme externe, `~` n'est pas toujours
remplacé et crée un dossier nommé `~`.

### Sans git

Télécharger `https://github.com/pedrokarim/custom-skills/archive/refs/heads/main.zip`, le
décompresser au même endroit (le dossier s'appelle `custom-skills-main` : le renommer en
`custom-skills`), et prévenir l'utilisateur que les mises à jour ne viendront pas toutes
seules. Sous Windows, retirer la marque « téléchargé depuis Internet » avant de lancer le
script : `Get-ChildItem "$HOME\custom-skills" -Recurse | Unblock-File`.

## 3a. Installer pour toute la machine

Lancer le script du clone. Il crée un **lien** par skill dans `~/.claude/skills` (Claude Code)
et `~/.agents/skills` (Codex et les agents compatibles). Des liens, pas des copies : un
`git pull` suffira ensuite à tout mettre à jour.

| Système | Tous les skills | Certains skills |
|---|---|---|
| Windows | `pwsh -NoProfile -ExecutionPolicy Bypass -File "<clone>\install.ps1"` | `pwsh -NoProfile -ExecutionPolicy Bypass -File "<clone>\install.ps1" site-indexing custom-skills` |
| macOS, Linux | `sh "<clone>/install.sh"` | `sh "<clone>/install.sh" site-indexing custom-skills` |

Sous Windows, sans `pwsh` (PowerShell 7), remplacer `pwsh` par `powershell` : le script
fonctionne aussi avec Windows PowerShell 5.1.

Lire la sortie, ligne par ligne :

| Marque | Sens |
|---|---|
| `+` | lien créé |
| `=` | lien déjà en place : c'est **normal** si le skill était déjà installé |
| `-` | lien orphelin retiré (skill supprimé ou renommé dans le dépôt) |
| `!` | problème ; le script finit alors avec le code de sortie **1** |

Un code 1 n'est pas un échec complet : les lignes `+` et `=` restent valables. Le `!` le plus
courant, « existe déjà et ne vient pas du dépôt », signifie qu'un autre skill porte ce nom, ou
qu'un ancien clone ailleurs sur la machine est encore relié : **ne rien supprimer**, le
signaler à l'utilisateur et lui demander quoi faire.

## 3b. Installer dans un seul projet

**Copier** (pas lier) le dossier de chaque skill voulu dans le projet :

- `<projet>/.claude/skills/<nom>/` pour Claude Code ;
- `<projet>/.agents/skills/<nom>/` pour Codex.

Choisir selon les agents que le projet utilise déjà (un `CLAUDE.md`, un `AGENTS.md`, un dossier
`.claude/`) ; dans le doute, les deux. On copie parce que le projet est partagé : un lien vers
un dossier de cette machine ne marcherait chez personne d'autre. Ne jamais écraser un dossier
qui existe déjà : demander. Pour mettre à jour plus tard, recopier depuis un clone à jour.

Ne pas commiter dans le projet de l'utilisateur sans qu'il l'ait demandé.

## 3c. Autres agents

Seulement si l'utilisateur se sert d'un agent qui ne lit ni `~/.claude/skills` ni
`~/.agents/skills` (Cursor, Gemini CLI, Windsurf, Cline…) : le paquet npm `skills`
(skills.sh, de Vercel) sait installer depuis GitHub, par copie, pour ces agents. C'est du code
tiers : le proposer à l'utilisateur plutôt que le lancer d'office.

```
npx skills add pedrokarim/custom-skills
npx skills add pedrokarim/custom-skills --skill site-indexing
```

Pour mettre à jour ces copies, relancer la même commande.

## 4. Vérifier

Lire l'en-tête d'un `SKILL.md` **à travers le lien**, pour chaque skill installé :

| Système | Commande |
|---|---|
| Windows | `Get-Content "$HOME\.claude\skills\<nom>\SKILL.md" -TotalCount 3` |
| macOS, Linux | `head -n 3 "$HOME/.claude/skills/<nom>/SKILL.md"` |

La sortie doit commencer par `---` puis `name: <nom>`. Pour une installation dans un projet,
même vérification dans `<projet>/.claude/skills/` ou `<projet>/.agents/skills/`.

Ne lancer **aucun** script des skills eux-mêmes : ils servent plus tard, quand la tâche se
présente.

## 5. Rendre compte

Dire à l'utilisateur, en quelques lignes :

1. ce qui est installé, et où (clone, liens ou copies) ; si tout était déjà en place (`=`
   partout et clone déjà à jour), le dire simplement : rien n'a changé ;
2. si des skills ont été ajoutés (`+`) : ils seront proposés **à partir de la prochaine
   session**, il faut redémarrer l'agent ;
3. comment les appeler : décrire simplement la tâche, ou par le nom, `/site-indexing` dans
   Claude Code, `$site-indexing` dans Codex ;
4. comment mettre à jour plus tard : `git pull` dans le clone, puis relancer le script
   seulement si des skills ont été ajoutés ou renommés ;
5. les `!` du script et les échecs de `git pull`, s'il y en a eu, avec ce que tu proposes.

## Ce que tu ne fais pas

- Modifier la configuration git, ou écrire ailleurs que dans le clone et les dossiers de
  skills.
- Supprimer ou remplacer un skill qui ne vient pas de ce dépôt.
- Forcer une mise à jour du clone (`reset`, `stash`, `checkout` d'une autre branche).
- Installer des dépendances (Python, Node) pour les scripts des skills : chaque skill dit
  lui-même ce dont il a besoin, au moment de s'en servir.
