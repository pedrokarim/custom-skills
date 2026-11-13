#!/usr/bin/env node
/**
 * Installe le kit des planches dans un dossier, ou y ajoute une planche depuis un gabarit.
 *
 *   node init.mjs <dossier>                              installe ou met à jour le kit
 *   node init.mjs <dossier> --board <nom> --layout <gabarit>
 *   node init.mjs --list                                 liste les gabarits
 *
 * Gabarits : flow, columns, metro, matrix, zones, layers, sequence.
 *
 * Ce que fait l'installation :
 *   <dossier>/render.mjs          le rendu PNG + PDF (remplacé à chaque mise à jour)
 *   <dossier>/src/kit.css         la structure (remplacée)
 *   <dossier>/src/wire.js         les fils et le contrôle (remplacé)
 *   <dossier>/src/theme.css       le thème : créé une fois, jamais écrasé
 *   <dossier>/src/assets/         créé vide, pour les logos et icônes
 *   <dossier>/exports/            créé vide
 * Une planche existante n'est jamais écrasée.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const kitDir = join(skillDir, 'assets', 'kit');
const templateDir = join(kitDir, 'templates');
const layouts = readdirSync(templateDir).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));

const args = process.argv.slice(2);
if (args.includes('--list')) {
  console.log(`Gabarits : ${layouts.join(', ')}`);
  process.exit(0);
}
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return null;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const board = option('board');
const layout = option('layout');
const target = args[0];
if (!target) {
  console.log('Usage : node init.mjs <dossier> [--board <nom> --layout <gabarit>]');
  process.exit(1);
}

const root = resolve(target);
const src = join(root, 'src');
for (const dir of [root, src, join(src, 'assets'), join(root, 'exports')]) mkdirSync(dir, { recursive: true });

const replaced = [
  ['render.mjs', join(root, 'render.mjs')],
  ['kit.css', join(src, 'kit.css')],
  ['wire.js', join(src, 'wire.js')],
];
for (const [from, to] of replaced) {
  const existed = existsSync(to);
  copyFileSync(join(kitDir, from), to);
  console.log(`${existed ? 'mis à jour' : 'créé'}   ${to}`);
}
const theme = join(src, 'theme.css');
if (existsSync(theme)) console.log(`gardé      ${theme}`);
else {
  copyFileSync(join(kitDir, 'theme.css'), theme);
  console.log(`créé       ${theme}`);
}

if (board || layout) {
  if (!board || !layout) {
    console.log('--board et --layout vont ensemble.');
    process.exit(1);
  }
  if (!layouts.includes(layout)) {
    console.log(`Gabarit inconnu : ${layout}. Gabarits : ${layouts.join(', ')}`);
    process.exit(1);
  }
  const page = join(src, `${board}.html`);
  if (existsSync(page)) {
    console.log(`La planche ${page} existe déjà : rien n'est écrasé.`);
    process.exit(1);
  }
  copyFileSync(join(templateDir, `${layout}.html`), page);
  console.log(`créé       ${page} (gabarit ${layout})`);
}
