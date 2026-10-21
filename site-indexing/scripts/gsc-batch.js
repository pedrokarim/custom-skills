// Enchaîne « Tester l'URL active » ou « Demander une indexation » sur une liste d'URL, dans
// la Search Console ouverte sur la bonne propriété (interface en français).
//
// Deux appels `evaluate_script` (MCP brave) sur l'onglet de la Search Console :
//   1. () => { window.__gscJob = { mode: "test", urls: ["https://exemple.com/"] }; }
//      mode : "test" ou "request"
//   2. ce fichier collé tel quel dans `function` (`sourcePath` est refusé hors des dossiers
//      de travail), waitForStableDom: false
// Rend { url: verdict }. Compter 30 s à 2 min par URL.
//
// Quota : environ 10 demandes d'indexation par jour et par propriété. Ne pas relancer en
// boucle une URL qui échoue : tester plutôt une page plus légère pour isoler la cause.
async () => {
  const job = window.__gscJob;
  if (!job || !Array.isArray(job.urls)) return "Poser d'abord window.__gscJob = { mode, urls }";

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const visible = (element) => element.offsetParent !== null;
  const buttonByText = (pattern) =>
    [...document.querySelectorAll('[role=button],button')].find((b) => pattern.test(b.innerText) && visible(b));
  const openDialogs = () =>
    [...document.querySelectorAll('[role=dialog],[role=alertdialog]')]
      .filter(visible)
      .map((d) => d.innerText.replace(/\n+/g, " "))
      // La navigation latérale est aussi un role=dialog : on l'écarte.
      .filter((text) => !text.includes("Vue d'ensemble"));

  const closeDialogs = async () => {
    document.querySelectorAll('[role=dialog] [role=button], [role=dialog] button').forEach((b) => {
      if (/Masquer|OK|Fermer|Ignorer/i.test(b.innerText)) b.click();
    });
    await wait(800);
  };

  const inspect = async (url) => {
    let input;
    for (let i = 0; i < 30 && !input; i++) {
      input = document.querySelector('input[aria-label^="Inspecter"]');
      if (!input) await wait(500);
    }
    if (!input) return false;
    input.focus();
    input.value = url;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
    return true;
  };

  const runTest = async (url) => {
    let button;
    for (let i = 0; i < 40; i++) {
      await wait(1000);
      button = buttonByText(/TESTER L'URL ACTIVE/i);
      // On attend la fiche de CETTE url, pas le résultat d'un test précédent.
      if (button && document.body.innerText.includes(url) && !/Testé le/.test(document.body.innerText)) break;
    }
    if (!button) return "bouton « Tester l'URL active » introuvable";
    await wait(1500);
    button.click();
    for (let i = 0; i < 150; i++) {
      await wait(2000);
      const dialogs = openDialogs();
      if (dialogs.some((d) => d.includes("problème"))) return "ÉCHEC : " + dialogs.join(" / ").slice(0, 160);
      const text = document.body.innerText;
      const verdict = (text.match(/Google (a|n'a pas) accès[^\n]*/) || [null])[0];
      if (verdict && /Testé le/.test(text)) return "OK : " + verdict;
    }
    return "délai dépassé";
  };

  const runRequest = async (url) => {
    let button;
    for (let i = 0; i < 40; i++) {
      await wait(1000);
      button = buttonByText(/^\s*Demander une indexation/i);
      const ready = /Dernière exploration|n'a pas été indexée|est indexée|est sur Google/.test(document.body.innerText);
      if (button && document.body.innerText.includes(url) && ready) break;
    }
    if (!button) return "bouton « Demander une indexation » introuvable";
    await wait(1500);
    button.click();
    for (let i = 0; i < 150; i++) {
      await wait(2000);
      const dialogs = openDialogs().filter((d) => !d.includes("peut durer"));
      const done = dialogs.find((d) => /Indexation demandée|quota|problème|Impossible/i.test(d));
      if (done) return done.slice(0, 160);
    }
    return "délai dépassé";
  };

  const results = {};
  for (const url of job.urls) {
    await closeDialogs();
    if (!(await inspect(url))) {
      results[url] = "champ d'inspection introuvable (mauvaise page ?)";
      continue;
    }
    results[url] = job.mode === "request" ? await runRequest(url) : await runTest(url);
    // Quota épuisé : les URL suivantes échoueraient toutes de la même façon.
    if (/quota/i.test(results[url])) break;
  }
  return results;
}
