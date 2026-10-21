# Installer custom-skills – instructions pour un agent

Ce fichier s'adresse à toi, l'agent de code (Claude Code, Codex, ou un autre) à qui
l'utilisateur a demandé d'installer les skills de `https://github.com/pedrokarim/custom-skills`.
Fais toute l'installation toi-même, dans l'ordre, sans renvoyer l'utilisateur taper des
commandes. Ne lui pose une question que là où ce fichier le dit.

## 1. Comprendre la demande

Deux choix, à lire dans la phrase de l'utilisateur. Sans précision, prendre le défaut.

| Choix | Défaut | Autre cas |
|---|---|---|
| Quels skills | **tous** | seulement ceux qu'il a nommés |
| Pour qui | **toute la machine**, tous les projets | **ce projet seulement** s'il dit « dans ce projet », « pour l'équipe », « dans le dépôt » |

Les skills disponibles sont les dossiers du dépôt qui contiennent un `SKILL.md` ; le tableau
du `README.md` dit à quoi sert chacun.

## 2. Récupérer le dépôt

1. **Chercher un clone existant.** Si `~/.claude/skills/custom-skills` ou
   `~/.agents/skills/custom-skills` est un lien, le dossier parent de sa cible est le clone :
   - Windows : `Split-Path (Get-Item "$HOME\.claude\skills\custom-skills").Target`
   - macOS, Linux : `dirname "$(readlink ~/.claude/skills/custom-skills)"`

   Le mettre à jour : `git -C <clone> pull --ff-only`.
2. **Sinon, cloner** dans `~/custom-skills`, ou dans le dossier que l'utilisateur a indiqué :
   ```
   git clone https://github.com/pedrokarim/custom-skills.git ~/custom-skills
   ```
3. **Sans git**, télécharger
   `https://github.com/pedrokarim/custom-skills/archive/refs/heads/main.zip`, le décompresser
   au même endroit, et prévenir l'utilisateur que les mises à jour ne viendront pas toutes
   seules.

## 3a. Installer pour toute la machine

Lancer le script du clone. Il crée un **lien** par skill dans `~/.claude/skills` (Claude Code)
et `~/.agents/skills` (Codex et les agents compatibles). Des liens, pas des copies : un
`git pull` suffira ensuite à tout mettre à jour.

| Système | Tous les skills | Certains skills |
|---|---|---|
| Windows | `pwsh -NoProfile -File <clone>\install.ps1` | `… install.ps1 site-indexing custom-skills` |
| macOS, Linux | `sh <clone>/install.sh` | `sh <clone>/install.sh site-indexing custom-skills` |

Sous Windows, sans `pwsh`, utiliser
`powershell -NoProfile -ExecutionPolicy Bypass -File <clone>\install.ps1`.

Lire la sortie : `+` lien créé, `=` déjà en place, `-` lien orphelin retiré, `!` problème.
Un `!` « existe déjà et ne vient pas du dépôt » signifie qu'un autre skill porte ce nom :
**ne rien supprimer**, le signaler à l'utilisateur et lui demander quoi faire.

## 3b. Installer dans un seul projet

**Copier** (pas lier) le dossier de chaque skill voulu dans le projet :

- `<projet>/.claude/skills/<nom>/` pour Claude Code ;
- `<projet>/.agents/skills/<nom>/` pour Codex.

Choisir selon les agents que le projet utilise déjà (un `CLAUDE.md`, un `AGENTS.md`, un dossier
`.claude/`) ; dans le doute, les deux. On copie parce que le projet est partagé : un lien vers
un dossier de cette machine ne marcherait chez personne d'autre. Ne jamais écraser un dossier
qui existe déjà : demander.

Ne pas commiter dans le projet de l'utilisateur sans qu'il l'ait demandé.

## 3c. Autres agents

Pour Cursor, Gemini CLI, Windsurf, Cline et les autres, la CLI `skills` sait installer depuis
GitHub, par copie :

```
npx skills add pedrokarim/custom-skills
npx skills add pedrokarim/custom-skills --skill site-indexing
```

## 4. Vérifier

- Lister le dossier de skills visé et confirmer qu'il contient chaque skill demandé, avec son
  `SKILL.md` lisible à travers le lien.
- Ne lancer **aucun** script des skills eux-mêmes : ils servent plus tard, quand la tâche se
  présente.

## 5. Rendre compte

Dire à l'utilisateur, en quelques lignes :

1. ce qui est installé, et où (clone, liens ou copies) ;
2. que les skills sont proposés **à partir de la prochaine session** : redémarrer l'agent ;
3. comment les appeler : décrire simplement la tâche, ou par le nom, `/site-indexing` dans
   Claude Code, `$site-indexing` dans Codex ;
4. comment mettre à jour plus tard : `git pull` dans le clone, puis relancer le script
   seulement si des skills ont été ajoutés ou renommés ;
5. les `!` du script, s'il y en a eu.

## Ce que tu ne fais pas

- Modifier la configuration git, ou écrire ailleurs que dans le clone et les dossiers de
  skills.
- Supprimer ou remplacer un skill qui ne vient pas de ce dépôt.
- Installer des dépendances (Python, Node) pour les scripts des skills : chaque skill dit
  lui-même ce dont il a besoin, au moment de s'en servir.
