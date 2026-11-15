# Hooks

Des scripts que Claude Code lance de lui-même, au démarrage d’une session ou d’un sous-agent. Ils
ne s’installent que sur demande : `./install.ps1 -Hooks` (Windows) ou `sh install.sh --hooks`
(macOS, Linux). Ils ont besoin de Node.js.

| Script | Lancé par | Ce qu’il fait |
|---|---|---|
| `always-on.mjs` | `SessionStart`, `SubagentStart` | met dans le contexte les passages « toujours actifs » des skills |
| `sync-rules.mjs` | `SessionStart` | recopie `~/.claude/CLAUDE.md` dans `~/.codex/AGENTS.md` |
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
`node hooks/always-on.mjs`.

Le contexte de `SessionStart` n’arrive pas aux sous-agents (constaté par le projet ponytail,
issue #252) : `SubagentStart` le leur redonne. Un sous-agent de Claude Code reçoit déjà
`CLAUDE.md`, la mémoire et la liste des skills ; c’est le texte des skills qui lui manque.

## Règles recopiées pour Codex

Claude Code lit `~/.claude/CLAUDE.md`, Codex lit `~/.codex/AGENTS.md` (ou `$CODEX_HOME/AGENTS.md`).
Tenus à la main, les deux finissent par dire des choses différentes. `CLAUDE.md` est la source ;
`sync-rules.mjs` en fait `AGENTS.md`, à chaque démarrage de session Claude Code, et change un
seul détail : `~/.claude/skills/` devient `~/.agents/skills/`.

Le fichier généré commence par une marque. Sans elle, le fichier a été écrit à la main : le script
ne l’écrase pas et le signale dans la session. `node hooks/sync-rules.mjs --force` le remplace
après l’avoir copié dans `AGENTS.md.bak`. `--check` dit seulement si les deux fichiers diffèrent.

Une règle qui vaut aussi pour Codex nomme les deux agents, ou dit « l’assistant ».

## Garde-fous

- Bloquer une session : une erreur les fait sortir sans rien écrire, et ils ne lisent pas
  l’entrée standard (sous Windows, elle peut ne jamais se fermer).
- Toucher aux autres hooks de `settings.json` : `register.mjs` ne remplace que ceux dont la
  commande lance un script de ce dossier, et garde l’ancien fichier dans `settings.json.bak`.

Codex a ses propres hooks ; ils ne sont pas branchés ici. Il reçoit les règles par `AGENTS.md`,
mais pas les passages toujours actifs des skills.
