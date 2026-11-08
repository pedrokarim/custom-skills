// Détecte dans une page les motifs « AI slop » mesurables.
// Usage : coller dans la console, ou passer la fonction à un evaluate_script.
// Renvoie un objet dont chaque clé liste au plus dix éléments fautifs ; une clé vide = rien à signaler :
// { mono, eyebrows, gradientText, textOnPattern, lowContrast, pills, sideStripe, nestedCards,
//   ghostCard, iconTiles, headingRhythm, transitionAll, flatType, repeatedAction, copyTics }.
// Les seuils de sideStripe, nestedCards, ghostCard, iconTiles, headingRhythm et flatType s'inspirent
// des règles du détecteur d'impeccable (pbakaus/impeccable, Apache 2.0), réécrites ici.
() => {
  const LIMIT = 10;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.opacity !== "0";
  };
  // Une illustration composée en HTML (carte de jeu, visuel de produit) n'est pas de l'interface :
  // la marquer `data-slop-ignore` la retire des mesures de structure et de hiérarchie.
  const inArt = (el) => !!el.closest("[data-slop-ignore], [role=img], svg, canvas");
  const ownText = (el) =>
    [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
  const label = (el) => ownText(el).slice(0, 48) || el.textContent.trim().slice(0, 48);
  // Balise, deux classes au plus, et le début du texte : de quoi retrouver l'élément sans l'ouvrir.
  const describe = (el, withText = true) => {
    const tag = el.tagName.toLowerCase();
    const cls = typeof el.className === "string"
      ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((c) => `.${c}`).join("")
      : "";
    const text = withText ? (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 32) : "";
    return text ? `${tag}${cls} « ${text} »` : `${tag}${cls}`;
  };

  const parseColor = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const luminance = ({ r, g, b }) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const isNeutral = (c) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) < 20;

  // Premier fond opaque en remontant les parents ; signale aussi un fond à motif traversé.
  // Un motif peut venir du fond de l'élément ou de ses pseudo-éléments ; une image sous le texte
  // rend la mesure de contraste impossible (on la saute plutôt que d'inventer un défaut).
  const isPattern = (value) => /url\(|repeating-|radial-gradient\([^)]*\d+px/.test(value);
  const backdrop = (el) => {
    let pattern = false;
    let image = false;
    for (let node = el; node; node = node.parentElement) {
      const cs = getComputedStyle(node);
      const layers = [cs.backgroundImage, getComputedStyle(node, "::before").backgroundImage, getComputedStyle(node, "::after").backgroundImage];
      if (node !== el && layers.some(isPattern)) pattern = true;
      if (/url\(|gradient/.test(cs.backgroundImage) || node.querySelector(":scope > img, :scope > picture")) image = true;
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0.95) return { color: c, pattern, image, surface: node };
    }
    return { color: { r: 255, g: 255, b: 255, a: 1 }, pattern, image, surface: document.documentElement };
  };

  // Bords, rayons et ombres calculés : c'est ce que l'œil voit, quelle que soit la façon de l'écrire.
  const SIDES = { Top: "haut", Right: "droit", Bottom: "bas", Left: "gauche" };
  const borderSides = (cs) => Object.keys(SIDES).map((side) => {
    const color = parseColor(cs[`border${side}Color`]);
    const drawn = cs[`border${side}Style`] !== "none" && color && color.a > 0;
    return { side, width: drawn ? parseFloat(cs[`border${side}Width`]) : 0, color };
  });
  const maxRadius = (cs) => Math.max(...["TopLeft", "TopRight", "BottomRight", "BottomLeft"]
    .map((corner) => parseFloat(cs[`border${corner}Radius`]) || 0));
  const shadows = (cs) => (cs.boxShadow === "none" ? [] : cs.boxShadow.split(/,(?![^(]*\))/).map((part) => {
    const color = parseColor(part) || { r: 0, g: 0, b: 0, a: 1 };
    const [x = 0, y = 0, blur = 0] = (part.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+px/g) || []).map(parseFloat);
    return { inset: /inset/.test(part), color, x, y, blur };
  }));
  const styles = new Map();
  const style = (el) => {
    if (!styles.has(el)) styles.set(el, getComputedStyle(el));
    return styles.get(el);
  };
  // Une « carte » : un bord sur deux côtés au moins ou une ombre, plus un arrondi ou un fond.
  const cards = new Map();
  const isCard = (el) => {
    if (!cards.has(el)) {
      const cs = style(el);
      const bordered = borderSides(cs).filter((b) => b.width >= 1).length >= 2;
      const shadowed = shadows(cs).some((s) => !s.inset && s.color.a > 0.02 && s.blur > 0);
      const bg = parseColor(cs.backgroundColor);
      cards.set(el, (bordered || shadowed) && (maxRadius(cs) >= 4 || Boolean(bg && bg.a > 0.05)));
    }
    return cards.get(el);
  };
  const CONTROL = "a, button, input, select, textarea, label, summary, [role=button], [role=tab], img, svg, video, canvas";
  const prevShown = (el) => {
    let p = el.previousElementSibling;
    while (p && !visible(p)) p = p.previousElementSibling;
    return p;
  };
  const nextShown = (el) => {
    let n = el.nextElementSibling;
    while (n && !visible(n)) n = n.nextElementSibling;
    return n;
  };

  const out = {
    mono: [], eyebrows: [], gradientText: [], textOnPattern: [], lowContrast: [], pills: [],
    sideStripe: [], nestedCards: [], ghostCard: [], iconTiles: [], headingRhythm: [],
    transitionAll: [], flatType: [], repeatedAction: [], copyTics: [],
  };

  // Textes : polices, surtitres, dégradés, motifs, contraste, pilules, et les tailles employées.
  const sizes = new Map();
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el) || !ownText(el)) continue;
    if (el.closest("code, pre, kbd, samp")) continue;
    const cs = style(el);
    const size = parseFloat(cs.fontSize);
    // Sous 11 px, c'est une mention ou le texte d'une illustration : il ne fait pas la hiérarchie.
    if (size >= 11 && !inArt(el)) sizes.set(Math.round(size), (sizes.get(Math.round(size)) || 0) + 1);

    if (/mono|consol|courier|menlo|jetbrains|fira code|source code/i.test(cs.fontFamily)) out.mono.push(label(el));
    if (cs.textTransform === "uppercase" && parseFloat(cs.letterSpacing) >= 0.5 && size <= 16) out.eyebrows.push(label(el));
    if (/text/.test(cs.webkitBackgroundClip || cs.backgroundClip) && /gradient/.test(cs.backgroundImage)) out.gradientText.push(label(el));

    const bg = backdrop(el);
    if (bg.pattern) out.textOnPattern.push(label(el));
    const fg = parseColor(cs.color);
    if (fg && !bg.image) {
      const ratio = contrast(fg, bg.color);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5)) out.lowContrast.push(`${label(el)} (${ratio.toFixed(2)})`);
    }
    const r = el.getBoundingClientRect();
    if (parseFloat(cs.borderRadius) >= r.height / 2 - 1 && r.height <= 36 && r.width > r.height * 2 && el.closest("header, section, [class*=hero]")) {
      out.pills.push(label(el));
    }
  }

  // Boîtes : bandes latérales, cartes imbriquées, cartes fantômes, transitions sur tout.
  const ghosts = new Map();
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const cs = style(el);
    const r = el.getBoundingClientRect();
    const sides = borderSides(cs);

    // Le bas est laissé de côté : un trait sous un onglet actif ou un lien a une fonction.
    if (r.width >= 40 && r.height >= 24 && maxRadius(cs) >= 4) {
      const widest = sides.reduce((p, q) => (q.width > p.width ? q : p));
      if (widest.width >= 2 && widest.side !== "Bottom" && widest.color && !isNeutral(widest.color)
        && sides.every((o) => o === widest || o.width * 2 <= widest.width)) {
        out.sideStripe.push(`${describe(el)} (bord ${SIDES[widest.side]} ${widest.width} px)`);
      }
    }

    // Le même liseré dessiné par un pseudo-élément : bande étroite, pleine hauteur, collée à un bord.
    if (r.width >= 60 && r.height >= 24) {
      for (const pseudo of ["::before", "::after"]) {
        const ps = getComputedStyle(el, pseudo);
        if (ps.content === "none" || ps.position !== "absolute") continue;
        const w = parseFloat(ps.width), h = parseFloat(ps.height);
        const bg = parseColor(ps.backgroundColor);
        if (!bg || bg.a < 0.5 || isNeutral(bg)) continue;
        const atEdge = parseFloat(ps.left) <= 1 || parseFloat(ps.right) <= 1;
        if (atEdge && w >= 2 && w <= 8 && h >= r.height * 0.8) {
          out.sideStripe.push(`${describe(el)} (liseré ${pseudo} ${w} px)`);
        }
      }
    }

    if (!el.matches(CONTROL) && !inArt(el) && r.width >= 50 && r.height >= 30 && el.textContent.trim().length >= 10 && isCard(el)) {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (!p.matches(CONTROL) && isCard(p)) {
          out.nestedCards.push(`${describe(el)} dans ${describe(p, false)}`);
          break;
        }
      }
    }

    // Trait fin et grande ombre floue sur la même boîte : compté par rangée de cartes sœurs.
    if (isCard(el) && sides.filter((b) => b.width >= 1).length >= 2
      && shadows(cs).some((s) => !s.inset && s.blur >= 24 && s.color.a >= 0.04)) {
      const parent = el.parentElement;
      const row = parent && parent.childElementCount === 1 && parent.parentElement ? parent.parentElement : parent;
      ghosts.set(row, [...(ghosts.get(row) || []), el]);
    }

    // La propriété vaut « all » par défaut avec une durée nulle : seule une durée réelle compte.
    const durations = cs.transitionDuration.split(",").map(parseFloat);
    if (cs.transitionProperty.split(",").some((p, i) => p.trim() === "all" && (durations[i % durations.length] || 0) > 0)) {
      out.transitionAll.push(describe(el));
    }
  }
  for (const group of ghosts.values()) {
    if (group.length >= 3) out.ghostCard.push(`${describe(group[0])} ×${group.length}`);
  }

  // Titres : tuile d'icône posée au-dessus, et titre plus près du bloc précédent que du sien.
  const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(visible);
  const tiles = [];
  const rhythm = [];
  for (const h of headings) {
    const hr = h.getBoundingClientRect();
    const tile = prevShown(h);
    if (tile) {
      const tr = tile.getBoundingClientRect();
      const tcs = style(tile);
      const bg = parseColor(tcs.backgroundColor);
      const icon = tile.querySelector("svg, img, i, [class*=icon]");
      const ratio = tr.width / tr.height;
      if (tr.width >= 32 && tr.width <= 128 && tr.height >= 32 && tr.height <= 128 && ratio >= 0.7 && ratio <= 1.4
        && ((bg && bg.a >= 0.05) || borderSides(tcs).some((b) => b.width >= 1))
        && maxRadius(tcs) < tr.width / 2 - 0.5
        && icon && icon.getBoundingClientRect().width < tr.width * 0.95
        && tr.bottom <= hr.top + 4 && hr.top - tr.bottom <= 40) {
        tiles.push(describe(h));
      }
    }

    if (!/^H[234]$/.test(h.tagName)) continue;
    // Une petite étiquette collée au titre fait partie de son groupe : on mesure au-dessus d'elle.
    let top = hr.top;
    let prev = prevShown(h);
    while (prev && prev.getBoundingClientRect().height < 40 && top - prev.getBoundingClientRect().bottom < 16) {
      top = prev.getBoundingClientRect().top;
      prev = prevShown(prev);
    }
    for (let a = h.parentElement; !prev && a && a !== document.body; a = a.parentElement) prev = prevShown(a);
    const next = nextShown(h);
    if (!prev || !next) continue;
    const above = top - prev.getBoundingClientRect().bottom;
    const below = next.getBoundingClientRect().top - hr.bottom;
    if (above < 0 || below < 6 || below > 160) continue;
    if (above < below * 0.75 && below - above >= 12) {
      rhythm.push(`${describe(h)} (${Math.round(above)} px au-dessus, ${Math.round(below)} px dessous)`);
    }
  }
  if (tiles.length >= 3) out.iconTiles.push(...tiles);
  if (rhythm.length >= 2) out.headingRhythm.push(...rhythm);

  // Hiérarchie : trop de tailles, ou un h1 à peine plus grand que le niveau suivant.
  const sizeList = [...sizes.keys()].sort((a, b) => b - a);
  if (sizeList.length > 8) out.flatType.push(`${sizeList.length} tailles de texte : ${sizeList.join(", ")} px`);
  const h1 = headings.find((h) => h.tagName === "H1");
  if (h1) {
    const h1Size = parseFloat(style(h1).fontSize);
    const nextSize = sizeList.find((s) => s < h1Size - 0.5);
    if (nextSize && h1Size / nextSize < 1.25) {
      out.flatType.push(`h1 ${h1Size} px, taille suivante ${nextSize} px (×${(h1Size / nextSize).toFixed(2)})`);
    }
  }

  // Même action sur trois contrôles du premier écran ; un bouton par article d'une liste est normal.
  const actions = new Map();
  for (const el of document.querySelectorAll("a, button, [role=button], input[type=submit], input[type=button]")) {
    if (!visible(el) || el.closest("li, tr, article, [class*=card], [class*=item]")) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight) continue;
    const text = (el.tagName === "INPUT" ? el.value : el.textContent).trim().replace(/\s+/g, " ").toLowerCase();
    if (text.length < 2 || text.length > 40) continue;
    actions.set(text, (actions.get(text) || 0) + 1);
  }
  for (const [text, n] of actions) if (n >= 3) out.repeatedAction.push(`« ${text} » ×${n}`);

  // Tics de cadence des textes, en français : on compte, et on montre les premiers exemples.
  const body = document.body.innerText || "";
  const sample = (re) => [...body.matchAll(re)].map((m) => m[0].replace(/\s+/g, " ").trim().replace(/^[.!?]\s*/, "").slice(0, 60));
  const examples = (list) => list.slice(0, 3).map((t) => `« ${t} »`).join(", ");
  const dashes = (body.match(/—/g) || []).length;
  if (dashes > 2) out.copyTics.push(`${dashes} tirets cadratins (—)`);
  const contrasts = sample(/\b(?:pas|non) (?:seulement|juste|simplement|qu['’]une?)\b[^.!?\n]{0,40}|\bpas\b[^.!?;\n]{1,50},? mais\b|\bplutôt que\b[^.!?\n]{0,30}|\bau lieu de\b[^.!?\n]{0,30}|\bce n['’]est pas\b[^.!?\n]{0,50}/gi);
  if (contrasts.length > 2) out.copyTics.push(`${contrasts.length} contrastes « pas X, mais Y » : ${examples(contrasts)}`);
  const riders = sample(/, (?:permettant|garantissant|offrant|assurant|facilitant|aidant|rendant|apportant|renforçant|soulignant)\b[^.!?\n]{0,40}/gi);
  if (riders.length > 2) out.copyTics.push(`${riders.length} queues en « -ant » : ${examples(riders)}`);
  const reveals = sample(/(?:^|[.!?]\s+)(?:Le résultat|La raison|Le secret|La différence|La suite|Et ensuite|Pourquoi c['’]est important)\s?[?:]/gim);
  if (reveals.length) out.copyTics.push(`révélations mises en scène : ${examples(reveals)}`);
  const negations = sample(/\b(?:Pas|Sans|Ni) [^.!?\n]{1,30}\.\s+(?:Pas|Sans|Ni) [^.!?\n]{1,30}\./g);
  if (negations.length) out.copyTics.push(`listes de négations : ${examples(negations)}`);
  for (const line of body.split("\n")) {
    if ((line.match(/\s·\s/g) || []).length >= 2) out.copyTics.push(`chaîne « A · B · C » : « ${line.trim().slice(0, 60)} »`);
  }
  const twoFragments = [];
  for (const h of headings) {
    const t = h.innerText.trim().replace(/\s+/g, " ");
    if (/^(?:[^.?!…]{2,48}[.!] ){1,2}[^.?!…]{2,55}[.!]?$/.test(t) && t.split(" ").length <= 14) twoFragments.push(t);
    if (t.includes("!")) out.copyTics.push(`point d'exclamation dans un titre : « ${t.slice(0, 60)} »`);
  }
  if (twoFragments.length >= 2) out.copyTics.push(`${twoFragments.length} titres en fragments : ${examples(twoFragments)}`);

  for (const key of Object.keys(out)) {
    const list = [...new Set(out[key])];
    out[key] = list.length > LIMIT ? [...list.slice(0, LIMIT), `… et ${list.length - LIMIT} autres`] : list;
  }
  return out;
};
