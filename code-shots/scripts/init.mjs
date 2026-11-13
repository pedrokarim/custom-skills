#!/usr/bin/env node
/**
 * Installe le kit des captures de code dans un dossier, ou y ajoute une capture.
 *
 *   node init.mjs <dossier>               installe ou met à jour le kit
 *   node init.mjs <dossier> --shot <nom>  nouvelle capture depuis le gabarit
 *
 * Le kit s'appuie sur celui de poster-diagrams (même dépôt) : render.mjs, theme.css et kit.css
 * viennent de là. Un dossier qui sert déjà aux schémas reçoit simplement shot.css et shot.js
 * à côté, et partage le thème.
 *
 *   <dossier>/render.mjs       rendu PNG + PDF (de poster-diagrams, remplacé)
 *   <dossier>/src/kit.css      structure de planche (de poster-diagrams, remplacé)
 *   <dossier>/src/theme.css    thème (créé une fois, jamais écrasé)
 *   <dossier>/src/shot.css     mise en page et couleurs du code (remplacé)
 *   <dossier>/src/shot.js      coloration et contrôle (remplacé)
 * Une capture existante n'est jamais écrasée.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const kitDir = join(skillDir, 'assets', 'kit');
const posterKit = resolve(skillDir, '..', 'poster-diagrams', 'assets', 'kit');
if (!existsSync(posterKit)) {
  console.log(`Le skill poster-diagrams est introuvable à côté de celui-ci (${posterKit}).`);
  console.log('Il fournit le rendu et le thème : installer les deux skills du même dépôt.');
  process.exit(1);
}

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return null;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const shotName = option('shot');
const target = args[0];
if (!target) {
  console.log('Usage : node init.mjs <dossier> [--shot <nom>]');
  process.exit(1);
}

const root = resolve(target);
const src = join(root, 'src');
for (const dir of [root, src, join(src, 'assets'), join(root, 'exports')]) mkdirSync(dir, { recursive: true });

const replaced = [
  [join(posterKit, 'render.mjs'), join(root, 'render.mjs')],
  [join(posterKit, 'kit.css'), join(src, 'kit.css')],
  [join(posterKit, 'wire.js'), join(src, 'wire.js')],
  [join(kitDir, 'shot.css'), join(src, 'shot.css')],
  [join(kitDir, 'shot.js'), join(src, 'shot.js')],
];
for (const [from, to] of replaced) {
  const existed = existsSync(to);
  copyFileSync(from, to);
  console.log(`${existed ? 'mis à jour' : 'créé'}   ${to}`);
}
const theme = join(src, 'theme.css');
if (existsSync(theme)) console.log(`gardé      ${theme}`);
else {
  copyFileSync(join(posterKit, 'theme.css'), theme);
  console.log(`créé       ${theme}`);
}

if (shotName) {
  const page = join(src, `${shotName}.html`);
  if (existsSync(page)) {
    console.log(`La capture ${page} existe déjà : rien n'est écrasé.`);
    process.exit(1);
  }
  copyFileSync(join(kitDir, 'shot.html'), page);
  console.log(`créé       ${page}`);
}
