#!/usr/bin/env node
// Recopie les règles globales de Claude Code (~/.claude/CLAUDE.md) dans celles de Codex
// (~/.codex/AGENTS.md), pour qu'il n'y ait qu'un texte à écrire.
//
//   node sync-rules.mjs           recopie si la cible manque ou a déjà été générée ici
//   node sync-rules.mjs --check   dit seulement si la cible diffère (code 1 dans ce cas)
//   node sync-rules.mjs --force   remplace aussi une cible écrite à la main, après l'avoir
//                                 copiée dans AGENTS.md.bak
//   node sync-rules.mjs --hook    comme sans option, mais silencieux tant que tout va bien :
//                                 ce qu'il écrit arrive dans le contexte de la session
//
// Une cible écrite à la main n'est jamais écrasée sans --force : la première ligne générée
// porte une marque, et seul un fichier qui l'a est réécrit d'office.
//
// Le seul changement apporté au texte : les chemins ~/.claude/skills/ deviennent
// ~/.agents/skills/, le dossier où Codex trouve les mêmes skills.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARK = '<!-- Généré depuis ~/.claude/CLAUDE.md par custom-skills/hooks/sync-rules.mjs. ' +
  'Modifier la source : ce fichier est réécrit. -->';

const claudeDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
const codexDir = process.env.CODEX_HOME || join(homedir(), '.codex');
const source = join(claudeDir, 'CLAUDE.md');
const target = join(codexDir, 'AGENTS.md');

export function render(sourceText) {
  const text = sourceText.replace(/^﻿/, '');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  return MARK + eol + eol + text.replaceAll('~/.claude/skills/', '~/.agents/skills/');
}

const args = new Set(process.argv.slice(2));
const hook = args.has('--hook');

function say(message) {
  if (hook) {
    process.stdout.write(`Règles globales : ${message}\n`);
  } else {
    console.log(message);
  }
}

try {
  if (!existsSync(source)) {
    if (!hook) say(`${source} n'existe pas, rien à recopier.`);
    process.exit(0);
  }
  const wanted = render(readFileSync(source, 'utf8'));
  const current = existsSync(target) ? readFileSync(target, 'utf8') : null;

  if (current === wanted) {
    if (!hook) say(`${target} est à jour.`);
    process.exit(0);
  }
  if (args.has('--check')) {
    say(`${target} diffère de ${source}.`);
    process.exit(1);
  }
  const handWritten = current !== null && !current.startsWith(MARK);
  if (handWritten && !args.has('--force')) {
    say(`${target} a été écrit à la main et diffère de ${source} : Codex ne suit donc pas les ` +
      `mêmes règles. Le signaler à l'utilisateur ; s'il est d'accord, lancer ` +
      `\`node "${fileURLToPath(import.meta.url).replace(/\\/g, '/')}" --force\` ` +
      `(l'ancien fichier est gardé dans AGENTS.md.bak).`);
    process.exit(hook ? 0 : 1);
  }
  mkdirSync(codexDir, { recursive: true });
  if (handWritten) copyFileSync(target, `${target}.bak`);
  writeFileSync(target, wanted);
  if (!hook) say(`${target} recopié depuis ${source}${handWritten ? ` (ancien fichier : ${target}.bak)` : ''}.`);
} catch (error) {
  // En hook, une erreur ne doit pas bloquer la session : on la signale et on sort normalement.
  say(`échec de la recopie vers ${target} : ${error.message}`);
  process.exit(hook ? 0 : 1);
}
