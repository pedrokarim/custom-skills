#!/usr/bin/env node
// Inscrit les hooks du dépôt dans ~/.claude/settings.json, ou les en retire.
//
//   node register.mjs             ajoute (ou remet à jour) les hooks du dépôt
//   node register.mjs uninstall   retire les hooks du dépôt, laisse tous les autres
//
// Un hook « du dépôt » se reconnaît à son chemin : sa commande lance un script de ce dossier
// hooks/. Relancer le script remplace ces hooks-là et ne touche à rien d'autre du fichier.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Barres obliques : la commande doit marcher dans Git Bash comme dans PowerShell.
const hooksDir = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const claudeDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
const settingsPath = join(claudeDir, 'settings.json');

const run = (script, arg) => `node "${hooksDir}/${script}" ${arg}`;
const WANTED = {
  SessionStart: [run('always-on.mjs', 'session-start'), run('sync-rules.mjs', '--hook')],
  SubagentStart: [run('always-on.mjs', 'subagent-start')],
};

const isOurs = (command) => typeof command === 'string' &&
  command.replace(/\\/g, '/').toLowerCase().includes(hooksDir.toLowerCase() + '/');

export function withoutOurHooks(hooks = {}) {
  const result = {};
  for (const [event, groups] of Object.entries(hooks)) {
    const kept = groups
      .map((group) => ({ ...group, hooks: (group.hooks || []).filter((hook) => !isOurs(hook.command)) }))
      .filter((group) => group.hooks.length);
    if (kept.length) result[event] = kept;
  }
  return result;
}

const uninstall = process.argv[2] === 'uninstall';
const raw = existsSync(settingsPath) ? readFileSync(settingsPath, 'utf8').replace(/^﻿/, '') : '{}';
let settings;
try {
  settings = JSON.parse(raw);
} catch (error) {
  console.error(`${settingsPath} n'est pas un JSON valide, rien n'est modifié : ${error.message}`);
  process.exit(1);
}

const hooks = withoutOurHooks(settings.hooks);
if (!uninstall) {
  for (const [event, commands] of Object.entries(WANTED)) {
    hooks[event] = [...(hooks[event] || []),
      { hooks: commands.map((command) => ({ type: 'command', command, timeout: 10 })) }];
  }
}
if (Object.keys(hooks).length) settings.hooks = hooks;
else delete settings.hooks;

const next = JSON.stringify(settings, null, 2) + '\n';
if (next === raw) {
  console.log(`  = hooks déjà en place dans ${settingsPath}`);
  process.exit(0);
}
mkdirSync(claudeDir, { recursive: true });
if (existsSync(settingsPath)) copyFileSync(settingsPath, `${settingsPath}.bak`);
writeFileSync(settingsPath, next);
console.log(uninstall
  ? `  - hooks du dépôt retirés de ${settingsPath}`
  : `  + hooks inscrits dans ${settingsPath} (SessionStart, SubagentStart)`);
