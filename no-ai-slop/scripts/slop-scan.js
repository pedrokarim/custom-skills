// Détecte dans une page les motifs « AI slop » mesurables.
// Usage : coller dans la console, ou passer la fonction à un evaluate_script.
// Renvoie un objet { mono, eyebrows, gradientText, textOnPattern, lowContrast, pills }.
() => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.opacity !== "0";
  };
  const ownText = (el) =>
    [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
  const label = (el) => ownText(el).slice(0, 48) || el.textContent.trim().slice(0, 48);

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

  const out = { mono: [], eyebrows: [], gradientText: [], textOnPattern: [], lowContrast: [], pills: [] };
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el) || !ownText(el)) continue;
    if (el.closest("code, pre, kbd, samp")) continue;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);

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
  for (const key of Object.keys(out)) out[key] = [...new Set(out[key])];
  return out;
};
