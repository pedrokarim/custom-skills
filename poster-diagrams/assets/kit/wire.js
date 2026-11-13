/**
 * Fils, légende et contrôle d'une planche.
 *
 * Une planche déclare, avant de charger ce script :
 *
 *   window.WIRES = [
 *     { from: 'api', fs: 'r', fo: 0.5, to: 'db', ts: 'l', to2: 0.5,
 *       color: 'ink' | 'accent' | 'accent2' | 'muted' | 'ok',
 *       dash: false, both: false,
 *       mid: 0.5, viaX: 958, viaY: 400, via: [[x, y], ...],
 *       label: 'texte', lp: 0.5, lo: [dx, dy], la: 'start' | 'middle' | 'end' },
 *   ];
 *   window.LEGEND = [{ color: 'accent', label: 'un ordre', dash: false }];
 *
 * - `from` / `to` : `data-id` d'un élément de la planche (nœud, ligne de liste, zone).
 * - `fs` / `ts` : côté de départ et d'arrivée (t, r, b, l) ; `fo` / `to2` : position sur ce côté (0 à 1).
 * - Tracé orthogonal aux angles arrondis. `mid` place le coude, `viaX` / `viaY` forcent un
 *   couloir vertical ou horizontal, `via` donne les points de passage exacts.
 * - `label` accepte « \n » pour plusieurs lignes ; `lp` est la position sur le fil (0 à 1).
 *
 * Les couleurs viennent de theme.css (--ink, --accent-line, --accent-2-line, --muted-line, --ok).
 * Anciens noms acceptés : terracotta = accent, violet = accent2, green = ok.
 */
(function () {
  const ALIASES = { terracotta: 'accent', violet: 'accent2', green: 'ok' };
  const VARS = {
    ink: '--ink',
    accent: '--accent-line',
    accent2: '--accent-2-line',
    muted: '--muted-line',
    ok: '--ok',
  };
  const RADIUS = 12;
  const drawn = [];

  function colorOf(name) {
    const key = ALIASES[name] || name || 'ink';
    const variable = VARS[key];
    if (!variable) throw new Error(`Couleur de fil inconnue : ${name}`);
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }

  function element(board, id) {
    const el = board.querySelector(`[data-id="${id}"]`);
    if (!el) throw new Error(`Nœud introuvable : ${id}`);
    return el;
  }

  function anchor(board, id, side, offset) {
    const b = board.getBoundingClientRect();
    const r = element(board, id).getBoundingClientRect();
    const x0 = r.left - b.left;
    const y0 = r.top - b.top;
    const f = offset ?? 0.5;
    switch (side) {
      case 't': return [x0 + r.width * f, y0];
      case 'b': return [x0 + r.width * f, y0 + r.height];
      case 'l': return [x0, y0 + r.height * f];
      case 'r': return [x0 + r.width, y0 + r.height * f];
      default: throw new Error(`Côté inconnu : ${side}`);
    }
  }

  const horizontal = (side) => side === 'l' || side === 'r';

  function route(p1, s1, p2, s2, mid) {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const m = mid ?? 0.5;
    if (horizontal(s1) && horizontal(s2)) {
      if (Math.abs(y1 - y2) < 1) return [p1, p2];
      const mx = x1 + (x2 - x1) * m;
      return [p1, [mx, y1], [mx, y2], p2];
    }
    if (!horizontal(s1) && !horizontal(s2)) {
      if (Math.abs(x1 - x2) < 1) return [p1, p2];
      const my = y1 + (y2 - y1) * m;
      return [p1, [x1, my], [x2, my], p2];
    }
    if (horizontal(s1)) return [p1, [x2, y1], p2];
    return [p1, [x1, y2], p2];
  }

  function pathData(points) {
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
      const [px, py] = points[i - 1];
      const [cx, cy] = points[i];
      const [nx, ny] = points[i + 1];
      const l1 = Math.hypot(cx - px, cy - py) || 1;
      const l2 = Math.hypot(nx - cx, ny - cy) || 1;
      const r = Math.min(RADIUS, l1 / 2, l2 / 2);
      const ax = cx - ((cx - px) / l1) * r;
      const ay = cy - ((cy - py) / l1) * r;
      const bx = cx + ((nx - cx) / l2) * r;
      const by = cy + ((ny - cy) / l2) * r;
      d += ` L ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
    }
    const last = points[points.length - 1];
    return `${d} L ${last[0]} ${last[1]}`;
  }

  function pointAt(points, t) {
    const lengths = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const len = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      lengths.push(len);
      total += len;
    }
    let target = total * t;
    for (let i = 0; i < lengths.length; i++) {
      if (target <= lengths[i] || i === lengths.length - 1) {
        const k = lengths[i] === 0 ? 0 : target / lengths[i];
        const [ax, ay] = points[i];
        const [bx, by] = points[i + 1];
        return [ax + (bx - ax) * k, ay + (by - ay) * k];
      }
      target -= lengths[i];
    }
    return points[points.length - 1];
  }

  function arrowHead(tip, from, color) {
    const [x, y] = tip;
    const angle = Math.atan2(y - from[1], x - from[0]);
    const len = 11;
    const half = 5.5;
    const bx = x - Math.cos(angle) * len;
    const by = y - Math.sin(angle) * len;
    const px = Math.sin(angle) * half;
    const py = -Math.cos(angle) * half;
    return `<path d="M ${x} ${y} L ${bx + px} ${by + py} L ${bx - px} ${by - py} Z" fill="${color}" stroke="${color}" stroke-width="1.5"/>`;
  }

  // Le trait s'arrête avant la pointe, pour qu'elle reste nette.
  function trim(points, atStart) {
    const out = points.map((p) => [...p]);
    const [a, b] = atStart ? [0, 1] : [out.length - 1, out.length - 2];
    const len = Math.hypot(out[a][0] - out[b][0], out[a][1] - out[b][1]) || 1;
    out[a][0] -= ((out[a][0] - out[b][0]) / len) * 8;
    out[a][1] -= ((out[a][1] - out[b][1]) / len) * 8;
    return out;
  }

  function drawWires(board) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'wires');
    let html = '';
    for (const w of window.WIRES || []) {
      const color = colorOf(w.color);
      const p1 = anchor(board, w.from, w.fs, w.fo);
      const p2 = anchor(board, w.to, w.ts, w.to2);
      let points;
      if (w.via) points = [p1, ...w.via, p2];
      else if (w.viaX != null) points = [p1, [w.viaX, p1[1]], [w.viaX, p2[1]], p2];
      else if (w.viaY != null) points = [p1, [p1[0], w.viaY], [p2[0], w.viaY], p2];
      else points = route(p1, w.fs, p2, w.ts, w.mid);
      drawn.push({ wire: w, points });

      let line = trim(points, false);
      if (w.both) line = trim(line, true);
      const dash = w.dash ? ' stroke-dasharray="7 6"' : '';
      html += `<path d="${pathData(line)}" stroke="${color}"${dash}/>`;
      html += arrowHead(points[points.length - 1], points[points.length - 2], color);
      if (w.both) html += arrowHead(points[0], points[1], color);

      if (w.label) {
        const [lx, ly] = pointAt(points, w.lp ?? 0.5);
        const [dx, dy] = w.lo || [0, -8];
        const fill = w.color === 'muted' ? getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() : color;
        const tspans = String(w.label)
          .split('\n')
          .map((t, i) => `<tspan x="${lx + dx}" dy="${i === 0 ? 0 : 15}">${t}</tspan>`)
          .join('');
        html += `<text x="${lx + dx}" y="${ly + dy}" text-anchor="${w.la || 'middle'}" fill="${fill}">${tspans}</text>`;
      }
    }
    svg.innerHTML = html;
    (board.querySelector('.stage') || board).appendChild(svg);
  }

  function drawLegend(board) {
    if (!window.LEGEND) return;
    let legend = board.querySelector('.legend');
    if (!legend) {
      legend = document.createElement('div');
      legend.className = 'legend';
      board.appendChild(legend);
    }
    legend.innerHTML = window.LEGEND.map((item) => {
      const color = colorOf(item.color);
      const width = item.thick ? 6 : 2.4;
      const dash = item.dash ? ' stroke-dasharray="7 6"' : '';
      return `<div><svg viewBox="0 0 34 10"><line x1="2" y1="5" x2="32" y2="5" stroke="${color}" stroke-width="${width}"${dash}/></svg>${item.label}</div>`;
    }).join('');
  }

  /**
   * Contrôle de la planche. Renvoie { issues, notes } :
   * - issues : défauts à corriger (débordement, chevauchement, étiquette sur un bloc, fil qui
   *   traverse un bloc) ;
   * - notes : informations (nombre de croisements entre fils).
   */
  window.checkBoard = function () {
    const board = document.querySelector('.board');
    const b = board.getBoundingClientRect();
    const issues = [];
    const notes = [];
    const rect = (el) => el.getBoundingClientRect();
    const name = (el) => el.dataset?.id || (typeof el.className === 'string' ? el.className : el.tagName);
    const overlap = (a, c, m = 1) => a.left < c.right - m && c.left < a.right - m && a.top < c.bottom - m && c.top < a.bottom - m;

    for (const el of board.querySelectorAll('.node, .step, .legend, .zone')) {
      const r = rect(el);
      if (r.left < b.left - 0.5 || r.top < b.top - 0.5 || r.right > b.right + 0.5 || r.bottom > b.bottom + 0.5) {
        issues.push(`hors planche : ${name(el)}`);
      }
      if (el.classList.contains('zone')) continue;
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
        issues.push(`contenu qui déborde : ${name(el)} (${el.scrollWidth}×${el.scrollHeight} pour ${el.clientWidth}×${el.clientHeight})`);
      }
    }

    const blocks = [...board.querySelectorAll('.node, .head, .legend, .brand')];
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[i].contains(blocks[j]) || blocks[j].contains(blocks[i])) continue;
        if (overlap(rect(blocks[i]), rect(blocks[j]))) issues.push(`chevauchement : ${name(blocks[i])} / ${name(blocks[j])}`);
      }
    }

    const labels = [...board.querySelectorAll('svg.wires text, .zone-label')];
    for (const t of labels) {
      for (const el of blocks) {
        if (overlap(rect(t), rect(el))) issues.push(`étiquette sur un bloc : « ${t.textContent.trim()} » / ${name(el)}`);
      }
    }
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        if (overlap(rect(labels[i]), rect(labels[j]))) {
          issues.push(`étiquettes superposées : « ${labels[i].textContent.trim()} » / « ${labels[j].textContent.trim()} »`);
        }
      }
    }

    // Un fil ne traverse que ses deux extrémités (et ce qui les contient).
    const nodes = [...board.querySelectorAll('.node')].filter((n) => !n.classList.contains('bare'));
    const segments = [];
    for (const { wire, points } of drawn) {
      const ends = [element(board, wire.from), element(board, wire.to)];
      for (let i = 1; i < points.length; i++) {
        const [x1, y1] = points[i - 1];
        const [x2, y2] = points[i];
        segments.push({ wire, x1, y1, x2, y2 });
        const seg = {
          left: Math.min(x1, x2) + b.left,
          right: Math.max(x1, x2) + b.left,
          top: Math.min(y1, y2) + b.top,
          bottom: Math.max(y1, y2) + b.top,
        };
        for (const n of nodes) {
          if (ends.some((e) => e === n || e.contains(n) || n.contains(e))) continue;
          const r = rect(n);
          const inner = { left: r.left + 3, right: r.right - 3, top: r.top + 3, bottom: r.bottom - 3 };
          const hits = seg.left <= inner.right && seg.right >= inner.left && seg.top <= inner.bottom && seg.bottom >= inner.top;
          if (hits) issues.push(`fil à travers un bloc : ${wire.from} → ${wire.to} traverse ${name(n)}`);
        }
      }
    }

    let crossings = 0;
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const s = segments[i];
        const t = segments[j];
        if (s.wire === t.wire) continue;
        const sv = Math.abs(s.x1 - s.x2) < 0.5;
        const tv = Math.abs(t.x1 - t.x2) < 0.5;
        if (sv === tv) continue;
        const [v, h] = sv ? [s, t] : [t, s];
        const x = v.x1;
        const y = h.y1;
        const inV = y > Math.min(v.y1, v.y2) + 2 && y < Math.max(v.y1, v.y2) - 2;
        const inH = x > Math.min(h.x1, h.x2) + 2 && x < Math.max(h.x1, h.x2) - 2;
        if (inV && inH) crossings++;
      }
    }
    if (crossings) notes.push(`${crossings} croisement(s) entre fils : un seul, net et à angle droit, se tolère`);
    return { issues, notes };
  };

  window.boardReady = document.fonts.ready.then(() => {
    const board = document.querySelector('.board');
    drawWires(board);
    drawLegend(board);
    return true;
  });
})();
