#!/usr/bin/env node
/**
 * Rend chaque planche de `src/` en PNG (×2) et en PDF vectoriel dans `exports/`.
 *
 * Aucune dépendance : Chrome (ou Brave, Edge) est piloté par le protocole DevTools, avec le
 * WebSocket intégré à Node 22 et plus. Chaque planche est contrôlée avant la capture ; un
 * défaut s'affiche en rouge et le script se termine en erreur.
 *
 *   node render.mjs                     toutes les planches
 *   node render.mjs musique             celles dont le nom contient « musique »
 *   node render.mjs --formats png,webp  formats : png, webp, pdf (png,pdf par défaut)
 *   node render.mjs --scale 3           densité des images (2 par défaut)
 *   node render.mjs --src boards --out dist
 *
 * Variable d'environnement CHROME_PATH pour un navigateur installé ailleurs.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const srcDir = resolve(root, option('src', 'src'));
const outDir = resolve(root, option('out', 'exports'));
const scale = Number(option('scale', '2'));
const formats = option('formats', 'png,pdf').split(',').map((f) => f.trim());
const filter = args[0] || '';
mkdirSync(outDir, { recursive: true });

const boards = readdirSync(srcDir)
  .filter((f) => f.endsWith('.html') && !f.startsWith('_') && f.includes(filter))
  .sort();
if (!boards.length) {
  console.log(`Aucune planche dans ${srcDir}${filter ? ` pour « ${filter} »` : ''}.`);
  process.exit(1);
}

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chromePath = candidates.find((p) => existsSync(p));
if (!chromePath) throw new Error('Navigateur Chromium introuvable : définir CHROME_PATH.');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${join(tmpdir(), 'poster-diagrams-chrome')}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--allow-file-access-from-files',
  'about:blank',
]);

const wsUrl = await new Promise((done, fail) => {
  let buffer = '';
  chrome.stderr.on('data', (chunk) => {
    buffer += chunk;
    const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) done(match[1]);
  });
  chrome.on('exit', (code) => fail(new Error(`Le navigateur s'est arrêté (${code}).`)));
});

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let nextId = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { done, fail } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) fail(new Error(msg.error.message));
    else done(msg.result);
  } else if (msg.method) {
    for (const l of [...listeners]) l(msg);
  }
});

function send(method, params = {}, sessionId) {
  const id = ++nextId;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((done, fail) => pending.set(id, { done, fail }));
}

function once(method, sessionId) {
  return new Promise((done) => {
    const l = (msg) => {
      if (msg.method === method && msg.sessionId === sessionId) {
        listeners.splice(listeners.indexOf(l), 1);
        done(msg.params);
      }
    };
    listeners.push(l);
  });
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);

const pageErrors = [];
listeners.push((msg) => {
  if (msg.method === 'Runtime.exceptionThrown' && msg.sessionId === sessionId) {
    pageErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  }
});

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || 'Erreur dans la page');
  return res.result.value;
}

let failures = 0;
for (const file of boards) {
  const slug = file.replace(/\.html$/, '');
  pageErrors.length = 0;

  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: scale, mobile: false }, sessionId);
  const loaded = once('Page.loadEventFired', sessionId);
  await send('Page.navigate', { url: pathToFileURL(join(srcDir, file)).href }, sessionId);
  await loaded;

  let size;
  let report;
  try {
    // La planche se mesure une fois dessinée : une capture de code a une hauteur automatique.
    await evaluate(`window.boardReady.then(() => new Promise((r) => setTimeout(r, 250)))`);
    size = await evaluate(`(() => { const r = document.querySelector('.board').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })()`);
    await send('Emulation.setDeviceMetricsOverride', { width: size.w, height: size.h, deviceScaleFactor: scale, mobile: false }, sessionId);
    report = await evaluate(`new Promise((r) => setTimeout(r, 150)).then(() => window.checkBoard())`);
  } catch (error) {
    failures++;
    console.log(`\x1b[31m✗ ${slug}\x1b[0m : la planche ne s'est pas dessinée`);
    console.log(`    ${error.message.split('\n')[0]}`);
    for (const e of pageErrors) console.log(`    ${e.split('\n')[0]}`);
    continue;
  }
  const issues = Array.isArray(report) ? report : report.issues;
  const notes = Array.isArray(report) ? [] : report.notes;

  const written = [];
  const locked = [];
  // Un fichier ouvert dans un aperçu (Windows) refuse l'écriture : on le signale et on continue.
  const save = (name, data) => {
    try {
      writeFileSync(join(outDir, name), Buffer.from(data, 'base64'));
      return true;
    } catch (error) {
      locked.push(`${name} non écrit (${error.code || error.message}) : fichier ouvert ailleurs ?`);
      return false;
    }
  };
  const clip = { x: 0, y: 0, width: size.w, height: size.h, scale: 1 };
  for (const format of formats) {
    if (format === 'png' || format === 'webp') {
      const params = { format, clip };
      if (format === 'webp') params.quality = 92;
      const shot = await send('Page.captureScreenshot', params, sessionId);
      if (save(`${slug}.${format}`, shot.data)) written.push(format);
    } else if (format === 'pdf') {
      const pdf = await send('Page.printToPDF', {
        printBackground: true,
        paperWidth: size.w / 96,
        paperHeight: size.h / 96,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        pageRanges: '1',
      }, sessionId);
      if (save(`${slug}.pdf`, pdf.data)) written.push('pdf');
    }
  }

  const where = `${size.w} × ${size.h}, ${written.join(' + ') || 'rien d’écrit'}`;
  if (issues.length || pageErrors.length || locked.length) {
    failures++;
    console.log(`\x1b[31m✗ ${slug}\x1b[0m (${where})`);
    for (const i of [...pageErrors, ...issues, ...locked]) console.log(`    ${i.split('\n')[0]}`);
  } else {
    console.log(`\x1b[32m✓ ${slug}\x1b[0m (${where})`);
  }
  for (const n of notes) console.log(`    · ${n}`);
}

ws.close();
chrome.kill();
process.exit(failures ? 1 : 0);
