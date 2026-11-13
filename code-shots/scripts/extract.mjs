#!/usr/bin/env node
/**
 * Extrait des lignes exactes d'un fichier, prêtes à coller dans window.SHOT.
 *
 *   node extract.mjs <fichier> <début>-<fin> [<début>-<fin> …] [--keep-indent] [--json]
 *
 * - Plusieurs plages : une ligne « @@ n » marque chaque coupure (la numérotation reprend à n).
 * - L'indentation commune à toutes les lignes est retirée, sauf avec --keep-indent.
 * - Les tabulations deviennent deux espaces.
 * - Sortie par défaut : `start` puis le code, échappé pour un gabarit JavaScript (`…`).
 *   --json : un objet { start, code } pour un script.
 *
 * Le code n'est jamais retouché à la main ensuite : une capture montre le vrai fichier.
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const keepIndent = args.includes('--keep-indent');
const asJson = args.includes('--json');
const [file, ...ranges] = args.filter((a) => !a.startsWith('--'));
if (!file || !ranges.length) {
  console.log('Usage : node extract.mjs <fichier> <début>-<fin> [<début>-<fin> …] [--keep-indent] [--json]');
  process.exit(1);
}

const source = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
const parts = ranges.map((r) => {
  const [a, b] = r.split('-').map(Number);
  if (!a || !b || b < a || b > source.length) throw new Error(`Plage invalide : ${r} (le fichier a ${source.length} lignes)`);
  return { start: a, lines: source.slice(a - 1, b).map((l) => l.replace(/\t/g, '  ')) };
});

if (!keepIndent) {
  const indents = parts
    .flatMap((p) => p.lines)
    .filter((l) => l.trim())
    .map((l) => l.match(/^ */)[0].length);
  const cut = Math.min(...indents);
  for (const p of parts) p.lines = p.lines.map((l) => l.slice(Math.min(cut, l.match(/^ */)[0].length)));
}

const out = [];
parts.forEach((p, i) => {
  if (i > 0) out.push(`@@ ${p.start}`);
  out.push(...p.lines);
});
while (out.length && !out[out.length - 1].trim()) out.pop();
const code = out.join('\n');

if (asJson) console.log(JSON.stringify({ start: parts[0].start, code }, null, 2));
else {
  console.log(`start: ${parts[0].start},`);
  console.log(`code: \`${code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`,`);
}
