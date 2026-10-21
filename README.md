<p align="center">
  <img src=".github/banner.svg" alt="custom-skills : des procédés éprouvés, écrits pour être refaits sans tâtonner" width="100%">
</p>

Une bibliothèque de skills pour agents de code (Claude Code, Codex et les agents compatibles).
Chaque skill est un procédé qui a fonctionné une fois, écrit pour être refait sans tâtonner :
quand s’en servir, comment, pourquoi chaque étape existe, et les erreurs déjà payées.

## Les skills

| Skill | À quoi il sert |
|---|---|
| [`custom-skills`](custom-skills/SKILL.md) | Le point d’entrée : connaît ce dépôt, sait y ajouter un skill ou en corriger un. Dans n’importe quel projet, « ajoute ça aux custom skills » suffit. |
| [`flat-pixel-art-scenes`](flat-pixel-art-scenes/SKILL.md) | Créer des scènes en pixel art à grands aplats, profondes et calmes, et les animer en boucle (fond de menu, GIF) |
| [`site-indexing`](site-indexing/SKILL.md) | Faire indexer un site par Google et Bing : diagnostic dans la Search Console et Bing Webmaster Tools pilotées depuis Brave (MCP `brave`), correctifs côté code, demandes d’indexation |

## Installation

### En une phrase, par votre agent

Coller ceci dans Claude Code, Codex ou tout autre agent de code :

```
Installe les skills de https://github.com/pedrokarim/custom-skills en suivant https://raw.githubusercontent.com/pedrokarim/custom-skills/main/INSTALL.md
```

L’agent clone le dépôt, lance le bon script pour votre système, vérifie, puis vous dit comment
appeler les skills. La phrase s’adapte :

- « Installe **seulement le skill site-indexing** de … »
- « Installe les skills de … **dans ce projet** » : copiés dans le projet, pour toute l’équipe.

Ce que l’agent suit est dans [`INSTALL.md`](INSTALL.md).

### À la main

```sh
git clone https://github.com/pedrokarim/custom-skills.git
cd custom-skills
./install.ps1        # Windows
sh install.sh        # macOS, Linux
```

Ajouter des noms pour n’installer que certains skills : `./install.ps1 site-indexing`.

Le script relie chaque skill dans `~/.claude/skills` (Claude Code) et `~/.agents/skills`
(Codex). Ce sont des **liens**, pas des copies : un skill modifié dans le dépôt est à jour
partout, immédiatement, et un `git pull` suffit pour récupérer les nouveautés. On le relance
après avoir ajouté, renommé ou supprimé un skill ; il vérifie aussi l’en-tête de chaque
`SKILL.md`.

Pour les autres agents (Cursor, Gemini CLI…), `npx skills add pedrokarim/custom-skills`
installe les skills par copie.

## S’en servir

- **Sans rien dire** : l’agent propose un skill dès que la demande correspond à sa description.
- **Par son nom** : `/site-indexing` dans Claude Code, `$site-indexing` dans Codex.
- **« custom skills »** dans n’importe quelle conversation : l’agent charge `custom-skills` et
  sait où se trouve ce dépôt.

## Ajouter un skill

Un dossier par skill, nommé en anglais, en minuscules avec des tirets :

```
nom-du-skill/
├── SKILL.md        obligatoire : name, description, puis le procédé
├── scripts/        ce qui doit s'exécuter à l'identique à chaque fois
├── references/     les explications longues, lues seulement au besoin
└── assets/         exemples réussis, et contre-exemples
```

La `description` décide seule si le skill sera proposé : y lister les situations concrètes et
les mots que l’on emploierait vraiment. Ensuite, ajouter une ligne au tableau ci-dessus, lancer
`./install.ps1` et commiter. Le procédé complet est dans
[`custom-skills/SKILL.md`](custom-skills/SKILL.md).

Trois habitudes qui rendent un skill utile six mois plus tard :

- écrire **pourquoi** une étape existe, pas seulement quoi faire ;
- garder un **contre-exemple** : l’erreur déjà commise est ce qui se réapprend le plus cher ;
- joindre des **exemples du résultat**, surtout quand il se juge à l’œil.

Le dépôt est public : aucun nom de client, aucune clé, aucun chemin personnel dans un skill.
