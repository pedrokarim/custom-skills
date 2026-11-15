# Hooks

Des scripts que Claude Code lance de lui-même, au démarrage d’une session ou d’un sous-agent. Ils
ne s’installent que sur demande : `./install.ps1 -Hooks` (Windows) ou `sh install.sh --hooks`
(macOS, Linux). Ils ont besoin de Node.js.

| Script | Lancé par | Ce qu’il fait |
|---|---|---|
| `always-on.mjs` | `SessionStart`, `SubagentStart` | met dans le contexte les passages « toujours actifs » des skills |
| `sync-rules.mjs` | `SessionStart` | recopie `~/AGENTS.md` dans `~/.codex/AGENTS.md` |
| `register.mjs` | `install.ps1 -Hooks` | inscrit les deux scripts dans `~/.claude/settings.json`, ou les en retire (`uninstall`) |

## Passages toujours actifs

Un skill n’est proposé que si sa description correspond à la demande. Pour une règle qui vaut à
chaque réponse, comme celles de `no-ai-writing`, ce n’est pas assez : l’agent l’oublie sur les
textes courts, et un sous-agent la charge rarement de lui-même.

Un passage de `SKILL.md` placé entre deux commentaires est injecté à chaque session et dans
chaque sous-agent :

```markdown
<!-- always-on: start -->
## La règle
…
<!-- always-on: end -->
```

Le texte reste dans le `SKILL.md` : le hook le relit à chaque démarrage, il n’y a aucune copie à
tenir à jour. Les commentaires HTML du passage sont retirés avant l’injection.

Chaque passage coûte des jetons dans chaque session et chaque sous-agent : celui de
`no-ai-writing` fait 8 900 caractères, environ 3 000 jetons. Ne marquer que ce qui doit
s’appliquer partout, sans qu’on y pense. Pour voir ce qui serait injecté et sa taille :
`node hooks/always-on.mjs`. `CUSTOM_SKILLS_ALWAYS_ON=0` coupe l’injection le temps d’une
session.

### Mesure du 15 novembre 2026

Dix consignes d’écriture (commit, README, annonce Discord, post LinkedIn, e-mail à un client,
notes de version, description de PR, « À propos », début de billet en anglais, état vide d’une
page), trois essais chacune, Opus 5.5 en `claude -p`. Les tics sont comptés par `tell-scan`, sans
la typographie.

| Bras | Tics sur 30 textes | Textes sans tic | Coût moyen | Tours moyens |
|---|--:|--:|--:|--:|
| Claude Code nu (`--safe-mode`) | 157 | 6 | 0,030 $ | 1,0 |
| Règle de `CLAUDE.md`, sans le hook | 3 | 28 | 0,202 $ | 3,4 |
| Règle et hook | 0 | 30 | 0,136 $ | 1,0 |

Sans rien, le modèle écrit un commit et un README propres. Les tics viennent de l’annonce
Discord, du post LinkedIn, de l’e-mail et des notes de version : émojis, gras, séries de trois,
formules de fin de chatbot, signatures laissées en blanc (`[Prénom Nom]`). Sans le hook, l’agent charge le skill à chaque
texte, d’où les tours en plus ; avec le hook, il écrit du premier coup et coûte un tiers de
moins. Le bras nu n’a ni `CLAUDE.md`, ni MCP, ni liste de skills : son coût ne se compare pas
aux deux autres.

Limite : `tell-scan` compte les motifs que le catalogue apprend à éviter, la mesure favorise
donc le skill par construction. Aucun lecteur ni juge à l’aveugle n’a comparé les textes.

Le contexte de `SessionStart` n’arrive pas aux sous-agents (constaté par le projet ponytail,
issue #252) : `SubagentStart` le leur redonne. Un sous-agent de Claude Code reçoit déjà
`CLAUDE.md`, la mémoire et la liste des skills ; c’est le texte des skills qui lui manque.

## Règles recopiées pour Codex

`~/AGENTS.md` est la source des règles globales, pour tous les agents. `~/.claude/CLAUDE.md`
l’importe par une ligne `@~/AGENTS.md` et ne garde que les règles propres à Claude Code. Claude
Code ne charge alors `~/AGENTS.md` qu’une fois, même quand il le trouve aussi en remontant les
dossiers parents (vérifié le 15 novembre 2026).

Codex ne remonte pas jusqu’au dossier personnel depuis un dépôt git : il lit
`~/.codex/AGENTS.md` (ou `$CODEX_HOME/AGENTS.md`). `sync-rules.mjs` y recopie `~/AGENTS.md` à
chaque démarrage de session Claude Code, sans rien y changer. Sans `~/AGENTS.md`, il ne fait rien.

Le fichier généré commence par une marque. Sans elle, le fichier a été écrit à la main : le script
ne l’écrase pas et le signale dans la session. `node hooks/sync-rules.mjs --force` le remplace
après l’avoir copié dans `AGENTS.md.bak`. `--check` dit seulement si les deux fichiers diffèrent.

Une règle de `~/AGENTS.md` parle de « l’assistant », ou nomme les agents qu’elle vise.

## Garde-fous

- Bloquer une session : une erreur les fait sortir sans rien écrire, et ils ne lisent pas
  l’entrée standard (sous Windows, elle peut ne jamais se fermer).
- Toucher aux autres hooks de `settings.json` : `register.mjs` ne remplace que ceux dont la
  commande lance un script de ce dossier, et garde l’ancien fichier dans `settings.json.bak`.

Codex a ses propres hooks ; ils ne sont pas branchés ici. Il reçoit les règles par `AGENTS.md`,
mais pas les passages toujours actifs des skills.
