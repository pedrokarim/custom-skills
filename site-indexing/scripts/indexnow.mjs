/**
 * Signale les URL d'un sitemap aux moteurs qui suivent IndexNow : Bing, Yandex, Seznam,
 * Naver. DuckDuckGo, Ecosia, Yahoo et Qwant s'appuient sur l'index de Bing. Google ne lit
 * PAS IndexNow : pour lui, c'est le sitemap déclaré dans la Search Console.
 *
 * Préparer une fois par site :
 *   1. une clé de 32 caractères hexadécimaux :
 *        node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
 *   2. un fichier public `<clé>.txt` à la racine du site, qui contient la clé et rien
 *      d'autre (dans Next.js : `public/<clé>.txt`). La clé n'est pas un secret : le
 *      protocole exige qu'elle soit lisible, c'est ce qui prouve qu'on contrôle le domaine.
 *   3. déployer.
 *
 * Puis, après chaque déploiement qui change des pages :
 *   node indexnow.mjs --host exemple.com --key <clé>          → tout le sitemap
 *   node indexnow.mjs --host exemple.com --key <clé> --dry    → affiche sans envoyer
 *   node indexnow.mjs --host exemple.com --key <clé> --retry  → réessaie toutes les 3 min
 *
 * Le premier envoi répond souvent `403 SiteVerificationNotCompleted` : le service n'a pas
 * encore lu le fichier de clé. `--retry` réessaie jusqu'à 30 min ; sur le site d'origine, c'est passé en
 * moins de 5 min.
 */

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const host = option("host");
const key = option("key");
const sitemapUrl = option("sitemap") ?? `https://${host}/sitemap.xml`;
const dryRun = args.includes("--dry");
const retry = args.includes("--retry");

if (!host || !key) {
  console.error("Usage : node indexnow.mjs --host exemple.com --key <clé> [--sitemap <url>] [--dry] [--retry]");
  process.exit(1);
}

const ENDPOINT = "https://api.indexnow.org/indexnow";
// Plafond du protocole par requête.
const MAX_URLS_PER_REQUEST = 10_000;
const RETRY_DELAY_MS = 3 * 60 * 1000;
const MAX_ATTEMPTS = 10;

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} : HTTP ${response.status}`);
  return response.text();
}

const keyLocation = `https://${host}/${key}.txt`;
const servedKey = (await fetchText(keyLocation)).trim();
if (servedKey !== key) {
  throw new Error(`${keyLocation} ne sert pas la clé attendue : fichier absent ou pas encore déployé ?`);
}

// Index de sitemaps ou sitemap simple : on suit un niveau d'index.
let xml = await fetchText(sitemapUrl);
let urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (xml.includes("<sitemapindex")) {
  const children = urls;
  urls = [];
  for (const child of children) {
    xml = await fetchText(child);
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  }
}
console.log(`${urls.length} URL dans le sitemap`);

async function submit(urlList) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  });
  return { status: response.status, text: await response.text() };
}

for (let start = 0; start < urls.length; start += MAX_URLS_PER_REQUEST) {
  const urlList = urls.slice(start, start + MAX_URLS_PER_REQUEST);
  if (dryRun) {
    console.log(`[dry] lot de ${urlList.length} URL, ex. ${urlList[0]}`);
    continue;
  }
  for (let attempt = 1; attempt <= (retry ? MAX_ATTEMPTS : 1); attempt++) {
    const { status, text } = await submit(urlList);
    // 200 = reçu ; 202 = reçu, clé en cours de vérification.
    console.log(`lot de ${urlList.length} URL → HTTP ${status} ${text}`);
    if (status === 200 || status === 202) break;
    if (retry && attempt < MAX_ATTEMPTS) {
      console.log(`nouvel essai dans ${RETRY_DELAY_MS / 60000} min…`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
