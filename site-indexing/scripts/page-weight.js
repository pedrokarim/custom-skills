// Poids d'une page une fois chargée, comme Googlebot la charge.
//
// Coller ce fichier tel quel dans le paramètre `function` d'`evaluate_script` (MCP brave ;
// `sourcePath` est refusé hors des dossiers de travail), avec `waitForStableDom: false`,
// sur un onglet ouvert dans un `isolatedContext` NEUF et émulé en 412x9000 mobile (voir
// references/brave-mcp-consoles.md). Sinon le cache et la petite fenêtre faussent tout.
//
// Attend 20 s que les chargements se terminent, puis rend le total, les dossiers qui pèsent
// le plus et les 12 ressources les plus lourdes.
async () => {
  await new Promise((resolve) => setTimeout(resolve, 20000));

  const entries = performance.getEntriesByType("resource");
  // encodedBodySize reste juste même si une ressource sort du cache (transferSize vaut 0).
  const size = (entry) => entry.encodedBodySize || entry.transferSize || 0;
  const shortPath = (url) => url.replace(location.origin, "");

  // Regroupe par dossier ; pour l'optimiseur de Next, par dossier de l'image d'origine.
  const groupOf = (url) => {
    const path = shortPath(url);
    if (path.startsWith("/_next/image")) {
      const source = decodeURIComponent((path.match(/url=([^&]+)/) || [])[1] || "");
      return "/_next/image ← " + source.split("/").slice(0, 3).join("/");
    }
    return path.split("?")[0].split("/").slice(0, 3).join("/");
  };

  const groups = {};
  for (const entry of entries) {
    const key = groupOf(entry.name);
    groups[key] = groups[key] || { requests: 0, kilobytes: 0 };
    groups[key].requests += 1;
    groups[key].kilobytes += size(entry) / 1024;
  }

  const navigation = performance.getEntriesByType("navigation")[0];
  return {
    totalMegabytes: (entries.reduce((sum, entry) => sum + size(entry), 0) / 1e6).toFixed(1),
    requests: entries.length,
    htmlKilobytes: navigation ? Math.round(navigation.encodedBodySize / 1024) : null,
    pageHeight: document.documentElement.scrollHeight,
    heaviestGroups: Object.entries(groups)
      .sort((a, b) => b[1].kilobytes - a[1].kilobytes)
      .slice(0, 12)
      .map(([key, value]) => `${Math.round(value.kilobytes)} Ko · ${value.requests} req · ${key}`),
    heaviestResources: [...entries]
      .sort((a, b) => size(b) - size(a))
      .slice(0, 12)
      .map((entry) => `${Math.round(size(entry) / 1024)} Ko · ${entry.initiatorType} · ${shortPath(entry.name).slice(0, 110)}`),
  };
}
