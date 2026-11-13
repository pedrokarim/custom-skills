/**
 * Capture de code : met en page et colore l'extrait décrit par window.SHOT.
 *
 *   window.SHOT = {
 *     title: 'Un verrou',                 première ligne du titre
 *     second: 'en trois lignes de Lua',   seconde ligne (encre chaude)
 *     lede: 'Ce qu\'il faut regarder…',   chapô, trois lignes au plus
 *     file: 'apps/api/src/jobs/lock.ts',  chemin affiché dans l'en-tête de la carte
 *     lang: 'ts',                         langage Shiki (ts, tsx, js, vue, css, lua, py, rust…)
 *     langLabel: 'TypeScript',            nom affiché (facultatif)
 *     start: 120,                         numéro de la première ligne
 *     code: `…`,                          l'extrait ; « @@ 148 » seul sur une ligne = coupure,
 *                                         la numérotation reprend à 148
 *     focus: [122, '130-133'],            lignes mises en avant (numéros du fichier), les autres s'estompent
 *     notes: [{ line: 131, text: '…' }],  notes numérotées, alignées sur leur ligne (« **gras** » permis)
 *     width: 1600,                        largeur de la planche (1200 pour un format carré)
 *     fontSize: 17,                       taille du code en px (19 par défaut), pour des lignes longues
 *     foot: 'Projet · bot Discord',        texte en pied à gauche (facultatif)
 *
 *     Options d'habillage, toutes facultatives (par défaut : papier de la DA, pas de fenêtre) :
 *     background: 'sunset',               fond : un préréglage (paper, ink, sunset, ocean, candy,
 *                                         midnight, mint, dusk), une couleur ou un dégradé CSS,
 *                                         ou { image: 'assets/fond.jpg', position: 'center',
 *                                         overlay: 'rgba(0,0,0,.25)', tone: 'dark' }
 *     tone: 'dark',                       texte de la planche clair (fond sombre) ; deviné pour
 *                                         les préréglages, à donner pour une image ou une couleur
 *     window: 'mac',                      boutons de fenêtre façon macOS dans l'en-tête de la carte
 *     layout: 'frame',                    la carte seule sur son fond, à la ray.so (sans titre,
 *                                         chapô, notes ni pied) ; 'poster' par défaut
 *     halftone: true,                     garder la trame des coins sur un fond personnalisé
 *   };
 *
 * Expose window.boardReady et window.checkBoard, comme les planches de poster-diagrams :
 * le même render.mjs les exporte.
 */
(function () {
  const SHIKI = 'https://cdn.jsdelivr.net/npm/shiki@3.7.0/+esm';
  const LANG_LABELS = {
    ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript', vue: 'Vue', css: 'CSS',
    scss: 'SCSS', html: 'HTML', json: 'JSON', lua: 'Lua', py: 'Python', python: 'Python', rust: 'Rust',
    rs: 'Rust', go: 'Go', java: 'Java', kotlin: 'Kotlin', sh: 'Shell', bash: 'Bash', sql: 'SQL',
    yaml: 'YAML', yml: 'YAML', prisma: 'Prisma', php: 'PHP', csharp: 'C#', cs: 'C#',
  };

  const shot = window.SHOT;

  // Fonds prêts à l'emploi. `dark` : le texte posé dessus passe en clair.
  const BACKGROUNDS = {
    paper: { css: 'var(--paper)', dark: false },
    ink: { css: '#1A1A1A', dark: true },
    sunset: { css: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)', dark: false },
    ocean: { css: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)', dark: true },
    candy: { css: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)', dark: true },
    midnight: { css: 'radial-gradient(120% 120% at 20% 0%, #3A3F8F 0%, #15172E 55%, #0B0C18 100%)', dark: true },
    mint: { css: 'linear-gradient(135deg, #D4FC79 0%, #96E6A1 100%)', dark: false },
    dusk: { css: 'linear-gradient(160deg, #F6D365 0%, #FDA085 45%, #8E6CB0 100%)', dark: false },
  };

  function applyBackground(board) {
    const bg = shot.background;
    if (!bg || bg === 'paper') return;
    let dark = false;
    if (typeof bg === 'string') {
      const preset = BACKGROUNDS[bg];
      board.style.background = preset ? preset.css : bg;
      dark = preset ? preset.dark : false;
    } else if (bg.image) {
      const overlay = bg.overlay ? `linear-gradient(${bg.overlay}, ${bg.overlay}), ` : '';
      board.style.background = `${overlay}url("${bg.image}") ${bg.position || 'center'} / ${bg.size || 'cover'} no-repeat`;
      dark = bg.tone === 'dark';
    }
    if (shot.tone) dark = shot.tone === 'dark';
    board.classList.add('custom-bg');
    if (dark) board.classList.add('on-dark');
    if (!shot.halftone) board.classList.add('no-halftone');
  }
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function focusSet(spec) {
    const set = new Set();
    for (const item of spec || []) {
      if (typeof item === 'number') set.add(item);
      else {
        const [a, b] = String(item).split('-').map(Number);
        for (let n = a; n <= (b || a); n++) set.add(n);
      }
    }
    return set;
  }

  // Le thème de coloration est construit à partir des jetons CSS : une marque change shot.css, pas ce code.
  function theme() {
    return {
      name: 'poster-ink',
      type: 'dark',
      colors: { 'editor.background': css('--code-bg'), 'editor.foreground': css('--code-fg') },
      tokenColors: [
        { settings: { foreground: css('--code-fg') } },
        { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: css('--code-comment'), fontStyle: 'italic' } },
        { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.logical', 'variable.language'], settings: { foreground: css('--code-keyword') } },
        { scope: ['string', 'string.template', 'punctuation.definition.string', 'string.quoted'], settings: { foreground: css('--code-string') } },
        { scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'], settings: { foreground: css('--code-number') } },
        { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function', 'variable.function'], settings: { foreground: css('--code-function') } },
        { scope: ['entity.name.type', 'support.type', 'entity.name.class', 'support.class', 'entity.other.inherited-class', 'entity.name.tag'], settings: { foreground: css('--code-type') } },
        { scope: ['variable.other.property', 'meta.object-literal.key', 'support.type.property-name', 'entity.other.attribute-name'], settings: { foreground: css('--code-property') } },
        { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: css('--code-punctuation') } },
      ],
    };
  }

  function build() {
    const board = document.querySelector('.board');
    // La signature (.brand) posée dans la page est gardée telle quelle.
    const brand = board.querySelector('.brand')?.outerHTML || '';
    board.classList.add('shot');
    board.style.setProperty('--w', `${shot.width || 1600}px`);
    board.style.setProperty('--h', 'auto');
    if (shot.fontSize) board.style.setProperty('--code-size', `${shot.fontSize}px`);
    const frame = shot.layout === 'frame';
    if (frame) {
      board.classList.add('frame');
      if (!shot.width) board.style.setProperty('--w', '1200px');
    }
    applyBackground(board);
    const hasNotes = !frame && (shot.notes || []).length > 0;
    const first = shot.start || 1;
    const lines = shot.code.replace(/\t/g, '  ').replace(/\s+$/, '').split('\n');
    const last = (() => {
      let n = first - 1;
      for (const l of lines) {
        const gap = l.match(/^@@\s*(\d+)\s*$/);
        n = gap ? Number(gap[1]) - 1 : n + 1;
      }
      return n;
    })();
    const label = shot.langLabel || LANG_LABELS[shot.lang] || shot.lang;
    const range = last > first ? `lignes ${first} à ${last}` : `ligne ${first}`;

    const controls = shot.window
      ? '<span class="controls" aria-hidden="true"><i class="close"></i><i class="minimize"></i><i class="zoom"></i></span>'
      : '';
    const head = frame
      ? ''
      : `<div class="head">
        <h1>${shot.title}${shot.second ? `<br><span class="second">${shot.second}</span>` : ''}</h1>
        ${shot.lede ? `<p>${shot.lede}</p>` : ''}
      </div>`;
    board.innerHTML = `
      ${head}
      <div class="shot-body${hasNotes ? ' with-notes' : ''}">
        <div class="code-card${shot.window ? ' windowed' : ''}" data-id="card">
          <div class="code-head">${controls}<b>${escape(shot.file || '')}</b><span>${range}</span><span class="lang">${label}</span></div>
          <div class="code" id="code"></div>
        </div>
        ${hasNotes ? '<div class="notes" id="notes"></div>' : ''}
      </div>
      ${!frame && shot.foot ? `<div class="shot-foot">${shot.foot}</div>` : ''}
      ${frame ? '' : brand}`;
    return { lines, first, hasNotes };
  }

  async function render() {
    const { lines, first, hasNotes } = build();
    const focus = focusSet(shot.focus);
    const plain = lines.filter((l) => !/^@@\s*\d+\s*$/.test(l)).join('\n');
    const { codeToTokens } = await import(SHIKI);
    const { tokens } = await codeToTokens(plain, { lang: shot.lang || 'ts', theme: theme() });

    const code = document.getElementById('code');
    if (focus.size) code.classList.add('dim');
    let n = first - 1;
    let t = 0;
    const rows = {};
    for (const line of lines) {
      const gap = line.match(/^@@\s*(\d+)\s*$/);
      const row = document.createElement('div');
      if (gap) {
        n = Number(gap[1]) - 1;
        row.className = 'row gap';
        row.innerHTML = '<span class="ln">⋯</span><span class="src"></span>';
        code.appendChild(row);
        continue;
      }
      n++;
      const spans = (tokens[t++] || [])
        .map((tok) => {
          const style = [`color:${tok.color}`];
          if (tok.fontStyle & 1) style.push('font-style:italic');
          if (tok.fontStyle & 2) style.push('font-weight:700');
          return `<span style="${style.join(';')}">${escape(tok.content)}</span>`;
        })
        .join('');
      row.className = `row${focus.has(n) ? ' focus' : ''}`;
      row.dataset.line = n;
      row.innerHTML = `<span class="ln">${n}</span><span class="src">${spans || ' '}</span>`;
      code.appendChild(row);
      rows[n] = row;
    }

    if (hasNotes) {
      const notes = document.getElementById('notes');
      shot.notes.forEach((note, i) => {
        const row = rows[note.line];
        if (row) row.insertAdjacentHTML('beforeend', `<span class="mark">${i + 1}</span>`);
        const el = document.createElement('div');
        el.className = 'note';
        el.dataset.line = note.line;
        el.innerHTML = `<span class="n">${i + 1}</span><p>${note.text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>`;
        notes.appendChild(el);
      });
    }
    await document.fonts.ready;
    placeNotes(rows);
  }

  // Chaque note se pose à la hauteur de sa ligne, sans chevaucher la précédente.
  function placeNotes(rows) {
    const notes = document.getElementById('notes');
    if (!notes) return;
    const top0 = notes.getBoundingClientRect().top;
    let floor = 0;
    let height = 0;
    for (const el of notes.querySelectorAll('.note')) {
      const row = rows[el.dataset.line];
      const wanted = row ? row.getBoundingClientRect().top - top0 + row.offsetHeight / 2 - 15 : floor;
      const top = Math.max(wanted, floor);
      el.style.top = `${top}px`;
      floor = top + el.offsetHeight + 16;
      height = floor;
    }
    notes.style.height = `${height}px`;
  }

  window.checkBoard = function () {
    const issues = [];
    const board = document.querySelector('.board');
    for (const row of document.querySelectorAll('.code .row:not(.gap)')) {
      const src = row.querySelector('.src');
      if (src.scrollWidth > src.clientWidth + 1) issues.push(`ligne ${row.dataset.line} trop longue pour la carte : couper la ligne ou élargir la planche`);
    }
    for (const note of shot.layout === 'frame' ? [] : shot.notes || []) {
      if (!document.querySelector(`.code .row[data-line="${note.line}"]`)) issues.push(`note sur la ligne ${note.line}, absente de l'extrait`);
    }
    const b = board.getBoundingClientRect();
    for (const el of board.querySelectorAll('.code-card, .notes, .shot-foot, .brand')) {
      const r = el.getBoundingClientRect();
      if (r.right > b.right + 0.5 || r.bottom > b.bottom + 0.5) issues.push(`hors planche : ${el.className}`);
    }
    const notes = document.getElementById('notes');
    if (notes) {
      const card = document.querySelector('.code-card').getBoundingClientRect();
      if (notes.getBoundingClientRect().bottom > card.bottom + 40) issues.push('les notes dépassent la carte : les raccourcir');
    }
    const foot = board.querySelector('.shot-foot, .brand');
    if (foot && foot.getBoundingClientRect().top < document.querySelector('.shot-body').getBoundingClientRect().bottom) {
      issues.push('le pied de planche touche le code');
    }
    return { issues, notes: [] };
  };

  window.boardReady = render().then(() => true);
})();
