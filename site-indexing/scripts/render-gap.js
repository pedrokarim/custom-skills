// Écart entre le HTML servi et la page une fois le JavaScript exécuté.
//
// Google lit le HTML servi, puis le rend. Quand les deux ne disent pas la même chose, ses
// documents sont prudents : un canonical changé par le JavaScript est un signal de plus à
// départager, un `noindex` retiré par le JavaScript « peut ne pas marcher comme prévu », et
// sur une réponse autre que 200 le rendu « peut être sauté ». Ce qu'il faut dans le HTML
// servi : title, robots, canonical, hreflang, JSON-LD, le texte principal et les liens.
//
// Coller ce fichier tel quel dans le paramètre `function` d'`evaluate_script` (MCP brave),
// sur un onglet déjà chargé sur la page à tester, de préférence émulé en Googlebot comme
// pour page-weight.js (le `fetch` ci-dessous part alors avec le même user-agent).
async () => {
  const response = await fetch(location.href, { cache: "no-store", credentials: "omit", redirect: "manual" });
  const rawHtml = response.type === "opaqueredirect" ? "" : await response.text();
  const raw = new DOMParser().parseFromString(rawHtml, "text/html");

  const textOf = (doc) => {
    const clone = doc.body ? doc.body.cloneNode(true) : null;
    if (!clone) return "";
    clone.querySelectorAll("script, style, noscript, template, svg").forEach((node) => node.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  };
  const jsonLdTypes = (doc) => {
    const types = new Set();
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === "object") {
        [].concat(node["@type"] || []).forEach((type) => types.add(type));
        Object.values(node).forEach(walk);
      }
    };
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try { walk(JSON.parse(script.textContent)); } catch { types.add("(JSON illisible)"); }
    });
    return [...types].sort();
  };
  const signals = (doc) => {
    const text = textOf(doc);
    return {
      title: doc.querySelector("title")?.textContent.trim() ?? null,
      robots: [...doc.querySelectorAll('meta[name="robots" i], meta[name="googlebot" i]')]
        .map((meta) => meta.content).join(" | ") || null,
      canonical: [...doc.querySelectorAll('link[rel~="canonical" i]')]
        .map((link) => (link.closest("head") ? "" : "[BODY] ") + link.getAttribute("href")),
      hreflang: doc.querySelectorAll("link[hreflang]").length,
      h1: [...doc.querySelectorAll("h1")].map((h1) => h1.textContent.replace(/\s+/g, " ").trim()),
      jsonLd: jsonLdTypes(doc),
      words: text ? text.split(" ").length : 0,
      links: new Set([...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))).size,
    };
  };

  const served = signals(raw);
  const rendered = signals(document);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const findings = [];
  if (response.status !== 200) findings.push(`statut ${response.status} : Google peut sauter le rendu, seul le HTML servi compte`);
  for (const key of ["title", "robots", "canonical", "h1"]) {
    if (!same(served[key], rendered[key])) findings.push(`${key} change après JavaScript`);
  }
  if (served.hreflang !== rendered.hreflang) findings.push(`hreflang : ${served.hreflang} servis, ${rendered.hreflang} après rendu`);
  const lateTypes = rendered.jsonLd.filter((type) => !served.jsonLd.includes(type));
  if (lateTypes.length) findings.push(`JSON-LD ajouté par JavaScript : ${lateTypes.join(", ")}`);
  if (rendered.words > 50 && served.words < rendered.words * 0.5) {
    findings.push(`${Math.round(100 - (100 * served.words) / rendered.words)} % du texte n'existe qu'après JavaScript`);
  }
  if (rendered.links > 10 && served.links < rendered.links * 0.5) {
    findings.push(`${rendered.links - served.links} liens n'existent qu'après JavaScript`);
  }

  return { status: response.status, rawKilobytes: Math.round(rawHtml.length / 1024), served, rendered, findings };
}
