#!/usr/bin/env node
// Hook Claude Code : met dans le contexte les passages « toujours actifs » des skills du dépôt.
//
//   node always-on.mjs session-start    texte brut, lu par SessionStart
//   node always-on.mjs subagent-start   JSON hookSpecificOutput, seul format que SubagentStart garde
//   node always-on.mjs                  affiche ce qui serait injecté, avec la taille
//
// Un skill devient « toujours actif » en entourant des passages de son SKILL.md par
// <!-- always-on: start --> et <!-- always-on: end -->. Le texte n'existe qu'à un endroit : le
// hook le relit à chaque session, il n'y a pas de copie à tenir à jour.
//
// Le hook ne lit pas l'entrée standard : sous Windows, elle peut ne jamais se fermer et bloquer
// le démarrage de la session. Il ne doit jamais faire échouer une session : toute erreur le
// fait sortir sans rien écrire.

import { existsSync, readdirSync, readFileSync, writeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGION = /<!-- always-on: start -->\r?\n([\s\S]*?)<!-- always-on: end -->/g;

export function collectAlwaysOn(root = repo) {
  const blocks = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const file = join(root, entry.name, 'SKILL.md');
    if (!entry.isDirectory() || !existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const regions = [...text.matchAll(REGION)]
      .map((match) => match[1].replace(/<!--[\s\S]*?-->\r?\n?/g, '').trim())
      .filter(Boolean);
    if (!regions.length) continue;
    blocks.push(
      `# Skill \`${entry.name}\`, toujours actif\n\n` +
      `Passages de ${file.replace(/\\/g, '/')}, injectés à chaque session. ` +
      `Le skill complet reste à charger quand la tâche le demande.\n\n` +
      regions.join('\n\n'),
    );
  }
  return blocks.join('\n\n');
}

function emit(text) {
  // Écriture synchrone : le processus sort juste après, une écriture asynchrone serait perdue.
  writeSync(1, text);
}

const event = process.argv[2];
try {
  const context = collectAlwaysOn();
  if (event === 'session-start') {
    if (context) emit(context);
  } else if (event === 'subagent-start') {
    if (context) {
      emit(JSON.stringify({
        hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: context },
      }));
    }
  } else {
    emit(`${context || '(aucun passage always-on dans le dépôt)'}\n\n-- ${context.length} caractères\n`);
  }
} catch {
  // Rien : une session sans le contexte vaut mieux qu'une session qui ne démarre pas.
}
