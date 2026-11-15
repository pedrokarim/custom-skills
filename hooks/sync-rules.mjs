#!/usr/bin/env node
// Recopie les règles globales communes (~/AGENTS.md) dans le fichier global de chaque agent
// installé qui ne lit pas ~/AGENTS.md lui-même.
//
// ~/AGENTS.md est la source, pour tous les agents. Claude Code la lit par ~/.claude/CLAUDE.md, qui
// l'importe (@~/AGENTS.md). Les autres ont chacun leur fichier global :
//
//   Codex           ~/.codex/AGENTS.md (ou $CODEX_HOME/AGENTS.md)
//   Copilot CLI     ~/.copilot/copilot-instructions.md
//   Windsurf        ~/.codeium/windsurf/memories/global_rules.md
//
// Un agent n'est servi que si son dossier existe : rien n'est créé pour un agent absent.
// Cursor garde ses règles globales dans ses réglages, pas dans un fichier : il n'est pas servi.
//
//   node sync-rules.mjs           recopie là où la cible manque, est vide ou a été générée ici
//   node sync-rules.mjs --check   dit seulement quelles cibles diffèrent (code 1 s'il y en a)
//   node sync-rules.mjs --force   remplace aussi une cible écrite à la main, après l'avoir
//                                 copiée à côté avec l'extension .bak
//   node sync-rules.mjs --hook    comme sans option, mais silencieux tant que tout va bien :
//                                 ce qu'il écrit arrive dans le contexte de la session
//
// Une cible écrite à la main n'est jamais écrasée sans --force : la première ligne générée
// porte une marque, et seul un fichier qui l'a (ou un fichier vide) est réécrit d'office.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Toute marque qui commence ainsi vient de ce script, y compris d'une version précédente.
const MARK_PREFIX = '<!-- Généré depuis ~/';
const MARK = MARK_PREFIX + 'AGENTS.md par custom-skills/hooks/sync-rules.mjs. ' +
  'Modifier ~/AGENTS.md : ce fichier est réécrit. -->';

const home = homedir();
const codexDir = process.env.CODEX_HOME || join(home, '.codex');
const source = join(home, 'AGENTS.md');
const TARGETS = [
  { agent: 'Codex', root: codexDir, file: join(codexDir, 'AGENTS.md') },
  { agent: 'Copilot CLI', root: join(home, '.copilot'), file: join(home, '.copilot', 'copilot-instructions.md') },
  { agent: 'Windsurf', root: join(home, '.codeium', 'windsurf'),
    file: join(home, '.codeium', 'windsurf', 'memories', 'global_rules.md') },
];

export function render(sourceText) {
  const text = sourceText.replace(/^﻿/, '');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  return MARK + eol + eol + text;
}

const args = new Set(process.argv.slice(2));
const hook = args.has('--hook');
const force = args.has('--force');
const self = fileURLToPath(import.meta.url).replace(/\\/g, '/');

function say(message) {
  if (hook) {
    process.stdout.write(`Règles globales : ${message}\n`);
  } else {
    console.log(message);
  }
}

if (!existsSync(source)) {
  if (!hook) say(`${source} n'existe pas, rien à recopier.`);
  process.exit(0);
}

let failed = false;
const wanted = render(readFileSync(source, 'utf8'));
for (const { agent, root, file } of TARGETS) {
  try {
    if (!existsSync(root)) continue;
    const current = existsSync(file) ? readFileSync(file, 'utf8') : null;
    if (current === wanted) {
      if (!hook) say(`${agent} : ${file} est à jour.`);
      continue;
    }
    if (args.has('--check')) {
      say(`${agent} : ${file} diffère de ${source}.`);
      failed = true;
      continue;
    }
    const handWritten = current !== null && current.trim() !== '' && !current.startsWith(MARK_PREFIX);
    if (handWritten && !force) {
      say(`${agent} : ${file} a été écrit à la main et diffère de ${source}, donc ${agent} ne suit ` +
        `pas les mêmes règles. Le signaler à l'utilisateur ; s'il est d'accord, lancer ` +
        `\`node "${self}" --force\` (l'ancien fichier est gardé avec l'extension .bak).`);
      failed = true;
      continue;
    }
    mkdirSync(dirname(file), { recursive: true });
    if (handWritten) copyFileSync(file, `${file}.bak`);
    writeFileSync(file, wanted);
    if (!hook) say(`${agent} : ${file} recopié${handWritten ? ` (ancien fichier : ${file}.bak)` : ''}.`);
  } catch (error) {
    // En hook, une erreur ne doit pas bloquer la session : on la signale et on passe à la suite.
    say(`${agent} : échec de la recopie vers ${file} : ${error.message}`);
    failed = true;
  }
}
process.exit(failed && !hook ? 1 : 0);
