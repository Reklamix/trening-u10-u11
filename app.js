'use strict';

class TrainingClock {
  constructor(milliseconds) { this.total = milliseconds; this.left = milliseconds; this.deadline = null; this.started = false; }
  remaining(now = Date.now()) { return this.deadline === null ? this.left : Math.max(0, this.deadline - now); }
  start(now = Date.now()) { if (this.remaining(now) <= 0) this.reset(); if (this.deadline === null) { this.deadline = now + this.left; this.started = true; } }
  pause(now = Date.now()) { this.left = this.remaining(now); this.deadline = null; }
  reset() { this.left = this.total; this.deadline = null; this.started = false; }
}

const PrivateVault = {
  iterations: 250000,
  async key(password, salt, iterations) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },
  valid(blob) {
    return blob?.vaultVersion === 1 && blob.iterations === this.iterations && Array.isArray(blob.salt) && blob.salt.length === 16 && Array.isArray(blob.iv) && blob.iv.length === 12 && [...blob.salt, ...blob.iv].every(x => Number.isInteger(x) && x >= 0 && x <= 255) && typeof blob.data === 'string' && blob.data.length < 200000;
  },
  async encrypt(value, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.key(password, salt, this.iterations);
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value))));
    let binary = ''; for (const byte of cipher) binary += String.fromCharCode(byte);
    return { vaultVersion: 1, iterations: this.iterations, salt: Array.from(salt), iv: Array.from(iv), data: btoa(binary) };
  },
  async decrypt(blob, password) {
    if (!this.valid(blob)) throw new Error('Invalid backup');
    const key = await this.key(password, new Uint8Array(blob.salt), blob.iterations);
    const cipher = Uint8Array.from(atob(blob.data), x => x.charCodeAt(0));
    const value = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(blob.iv) }, key, cipher)));
    if (value?.version !== 1 || !Array.isArray(value.sections) || value.sections.some(s => typeof s.title !== 'string' || !Array.isArray(s.items) || s.items.some(x => typeof x !== 'string')) || typeof value.notes !== 'string') throw new Error('Invalid personal content');
    return value;
  }
};

// BROWSER_APP
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { trainings: [], selected: null, blockIndex: 0, view: 'field', detail: null, loading: false, attendance: 19, clocks: new Map(), done: {}, gear: {}, vault: null, vaultPassword: null };
  let toastTimeout;

  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function message(content) {
    clearTimeout(toastTimeout);
    $('status').textContent = content;
    toastTimeout = setTimeout(() => { $('status').textContent = ''; }, 6500);
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat('sk-SK', {
      weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(`${date}T12:00:00Z`));
  }

  function route() {
    const params = new URLSearchParams(location.hash.slice(1));
    return { id: params.get('trening'), block: params.get('blok'), section: params.get('sekcia'), attendance: Number(params.get('pocet')) };
  }

  function linkFor(id, block = null, section = null) {
    const url = new URL(location.href);
    url.search = '';
    const params = new URLSearchParams({ trening: id });
    if (state.selected?.id === id && state.selected.attendanceCases) params.set('pocet', String(state.attendance));
    if (block) params.set('blok', block);
    if (section) params.set('sekcia', section);
    url.hash = params.toString();
    return url.href;
  }

  function share(url) {
    $('share-url').value = url;
    $('native-share').hidden = typeof navigator.share !== 'function';
    $('share-dialog').showModal();
    $('copy-link').focus();
  }

  async function copyLink() {
    const url = $('share-url').value;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        $('share-dialog').close();
        message('Odkaz skopírovaný. Môžeš ho poslať kolegovi.');
        return;
      } catch { /* Read-only field below remains usable without clipboard permission. */ }
    }
    $('share-url').focus();
    $('share-url').select();
    message('Podrž prst na odkaze alebo použi klávesy na jeho skopírovanie.');
  }

  const player = (x, y, name, type = 'player') => {
    const color = { player: '#16729c', opponent: '#ab4e22', keeper: '#7250a4', target: '#17674c' }[type];
    const shape = type === 'opponent'
      ? `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="3" fill="${color}"/>`
      : `<circle cx="${x}" cy="${y}" r="11" fill="${color}"/>`;
    return `${shape}<text class="player-label" x="${x}" y="${y + 4}" text-anchor="middle" font-size="12">${name}</text>`;
  };
  const ball = (x, y) => `<circle cx="${x}" cy="${y}" r="3.8" fill="white" stroke="#18372f"/><circle cx="${x}" cy="${y}" r="1.4" fill="#18372f"/>`;
  const field = (x = 30, y = 35, w = 300, h = 155) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white" stroke="#76a388" stroke-width="1.5"/>`;
  const text = (x, y, content, size = 12) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}">${content}</text>`;
  const gate = (x, y) => `<path d="M${x - 5} ${y - 13}l5 -8 5 8zM${x - 5} ${y + 20}l5 -8 5 8z" fill="#ab4e22"/>`;
  const goal = (x, y, right = false) => `<rect x="${right ? x : x - 8}" y="${y - 20}" width="8" height="40" fill="none" stroke="#18372f" stroke-width="2"/>`;
  function arrow(x, y, x2, y2, pass = false) {
    const angle = Math.atan2(y2 - y, x2 - x);
    const a = [x2 - 7 * Math.cos(angle - .4), y2 - 7 * Math.sin(angle - .4)];
    const b = [x2 - 7 * Math.cos(angle + .4), y2 - 7 * Math.sin(angle + .4)];
    const color = pass ? '#52665f' : '#16729c';
    return `<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2"${pass ? ' stroke-dasharray="5 4"' : ''}/><path d="M${x2} ${y2}L${a[0]} ${a[1]}L${b[0]} ${b[1]}Z" fill="${color}"/>`;
  }

  const drawings = {
    warmup: () => ({
      height: 230,
      body: field() + [gate(80, 75), gate(170, 155), gate(264, 77), gate(300, 150)].join('')
        + player(62, 130, '1') + ball(78, 131) + arrow(79, 121, 103, 103) + arrow(103, 103, 136, 118)
        + player(188, 64, '2') + player(291, 75, '3') + arrow(201, 66, 277, 74, true)
        + text(180, 20, 'Kľučka do voľna · prihrávka cez bránku'),
      caption: 'Príklad jednej zóny. Bránky aj hráči sú zobrazení iba čiastočne; po prihrávke sa znovu ponúkni.'
    }),
    coordination: () => ({
      height: 230,
      body: `<rect x="49" y="44" width="38" height="115" fill="none" stroke="#18372f"/>`
        + [63, 82, 101, 120, 139].map(y => `<path d="M49 ${y}h38" stroke="#18372f"/>`).join('')
        + player(68, 188, '1') + arrow(107, 155, 107, 46) + text(79, 22, 'Rebrík / čiary')
        + player(172, 151, '2') + ball(188, 148) + player(297, 65, '3') + arrow(187, 140, 285, 75, true)
        + arrow(184, 159, 245, 184) + text(246, 128, '5–7 m') + text(240, 211, 'Nový uhol'),
      caption: 'Ukážka dráhy a jednej dvojice. Medzi prechodmi pokojný návrat; po prihrávke zmena uhla.'
    }),
    duel: () => ({
      height: 236,
      body: field() + goal(330, 112, true) + player(309, 112, 'B', 'keeper')
        + player(65, 113, 'A') + ball(81, 114) + player(123, 97, 'O', 'opponent')
        + arrow(81, 126, 129, 151) + arrow(129, 151, 215, 133)
        + text(180, 21, 'Útočník 10–12 m od cieľa') + text(180, 218, 'Obranca asi 2 m pred útočníkom'),
      caption: 'Príklad s brankárom. Bez neho sú na cieľovej čiare dve malé bránky. Obranca sa zapojí po prvom dotyku.'
    }),
    'two-one': () => ({
      height: 246,
      body: field() + goal(330, 112, true) + player(309, 112, 'B', 'keeper')
        + player(64, 152, '1') + ball(80, 150) + player(116, 65, '2') + player(159, 112, 'O', 'opponent')
        + arrow(80, 140, 110, 78, true) + arrow(131, 68, 252, 85)
        + arrow(84, 159, 246, 153) + text(180, 21, 'Čo nechal obranca voľné?')
        + text(180, 219, 'Možnosť prihrávky aj vedenia lopty'),
      caption: 'Šípky ukazujú dve možnosti, nie povinné poradie. Keď obranca ide k lopte, hľadaj spoluhráča; keď kryje prihrávku, využij cestu.'
    }),
    'two-two': () => ({
      height: 237,
      body: field() + goal(30, 112) + player(49, 112, 'B', 'keeper') + gate(330, 74) + gate(330, 157)
        + player(107, 75, '1') + player(120, 158, '2') + ball(136, 158)
        + player(221, 83, 'O', 'opponent') + player(240, 155, 'O', 'opponent') + arrow(120, 87, 160, 119)
        + text(180, 21, '2 na 2 · voľný počet dotykov') + text(180, 218, 'Striedanie a oddych v Rotáciách'),
      caption: 'Príklad s brankárom. Bez neho sú na oboch koncoch malé bránky. Dávku a oddych vyber podľa počtu hráčov v Rotáciách.'
    }),
    target: () => ({
      height: 238,
      body: field() + `<path d="M65 35v155" stroke="#8ba493" stroke-dasharray="4 4"/>`
        + player(46, 112, 'B', 'keeper') + ball(58, 102) + player(105, 63, '1')
        + player(112, 164, '2') + player(230, 124, '3') + player(171, 89, 'O', 'opponent')
        + player(185, 154, 'O', 'opponent') + player(330, 95, 'C', 'target')
        + arrow(59, 100, 94, 70, true) + arrow(119, 66, 216, 119, true) + arrow(243, 119, 315, 100, true)
        + arrow(330, 82, 330, 52) + text(180, 21, '18 × 14 m · 3 na 2 + B + C')
        + text(180, 218, 'C sa pohybuje po koncovej čiare'),
      caption: 'C = cieľový hráč. Bod za kontrolované prevzatie na opačnej strane. Prvé dve kolá môže mať B chránené pásmo 2 m.'
    }),
    buildout: () => ({
      height: 238,
      body: field() + goal(30, 112) + `<path d="M105 35v155" stroke="#8ba493" stroke-dasharray="4 4"/>`
        + player(48, 112, 'B', 'keeper') + ball(62, 105) + player(78, 64, '1') + player(82, 164, '2') + player(200, 125, '3')
        + player(144, 74, 'O', 'opponent') + player(149, 163, 'O', 'opponent') + player(260, 116, 'O', 'opponent')
        + gate(330, 72) + gate(330, 160) + arrow(63, 99, 74, 77, true) + arrow(92, 68, 186, 119, true)
        + text(180, 21, '24 × 18 m · 3 na 3 + B') + text(180, 218, 'Dočasná čiara pri rozohre: asi 6 m'),
      caption: 'S brankárom na malé bránky; po zisku súperi na veľkú. Bod za vedenie cez bránku alebo prihrávku cez ňu s prevzatím.'
    }),
    'sprint-jump': () => ({
      height: 260,
      body: text(180, 22, '4 dráhy · 8 m naplno + 8–10 m brzdenie')
        + `<path d="M24 102h312" stroke="#18372f" stroke-width="1.5"/>`
        + [62, 139, 216, 293].map((x, i) => player(x, 171, String(i + 1)) + arrow(x, 156, x, 109) + arrow(x, 95, x, 47)).join('')
        + text(180, 200, 'Návrat chôdzou bokom')
        + `<path d="M30 215h300" stroke="#c9dcd4"/>`
        + text(180, 241, 'Skok: odraz → stabilný dopad → výdrž 2 s'),
      caption: '4 štarty na dieťa, medzi nimi 60–90 s skutočného oddychu. Potom 2 × 3 skoky. Šípky ukazujú smer bezpečného dobehu.'
    }),
    match: () => {
      let body = field() + goal(30, 112) + goal(330, 112, true)
        + `<path d="M180 35v155" stroke="#c9dcd4"/><circle cx="180" cy="112" r="24" fill="none" stroke="#c9dcd4"/>`
        + player(46, 112, 'B', 'keeper') + player(313, 112, 'B', 'keeper');
      [[84, 65], [84, 160], [120, 100], [142, 54], [149, 168], [198, 137]].forEach(([x, y], i) => { body += player(x, y, String(i + 1)); });
      [[270, 62], [270, 162], [233, 100], [213, 54], [221, 169], [166, 90]].forEach(([x, y], i) => { body += player(x, y, String(i + 1), 'opponent'); });
      return { height: 232, body: body + text(180, 21, '42 × 30 m · 6 na 6 + 2 B') + ball(97, 64), caption: 'Voľný počet dotykov a bežné skórovanie. Tréner sleduje viditeľnú ponuku a necháva hráčov rozhodovať.' };
    },
    'two-matches': () => {
      let body = text(180, 21, 'A · veľké brány + 2 brankári') + field(30, 36, 300, 111)
        + goal(30, 92) + goal(330, 92, true) + player(47, 92, 'B', 'keeper') + player(313, 92, 'B', 'keeper');
      [[93, 63], [105, 121], [170, 91]].forEach(([x, y], i) => { body += player(x, y, String(i + 1)); });
      [[266, 64], [260, 123], [212, 91]].forEach(([x, y], i) => { body += player(x, y, String(i + 1), 'opponent'); });
      body += text(180, 180, 'B · štyri malé bránky') + field(30, 195, 300, 111)
        + gate(30, 224) + gate(30, 275) + gate(330, 224) + gate(330, 275);
      [[86, 224], [100, 282], [171, 251]].forEach(([x, y], i) => { body += player(x, y, String(i + 1)); });
      [[268, 225], [261, 284], [212, 250]].forEach(([x, y], i) => { body += player(x, y, String(i + 1), 'opponent'); });
      return { height: 331, body, caption: 'Zobrazená iba časť hráčov. Počty podľa tabuľky nižšie; oba zápasy hrajú súčasne. Po druhom úseku si skupiny vymenia ihriská.' };
    },
    finish: () => ({
      height: 128,
      body: [42, 143, 244].map(x => `<rect x="${x}" y="33" width="76" height="62" rx="10" fill="white" stroke="#91b299"/>`).join('')
        + text(80, 69, 'Chôdza', 14) + text(181, 69, 'Voda', 14) + text(282, 69, 'Otázka', 14)
        + arrow(121, 64, 139, 64) + arrow(222, 64, 240, 64),
      caption: 'Spoločné pokojné ukončenie. Jedna otázka a krátke konkrétne ocenenie.'
    })
  };

  function addDiagram(parent, key, id, title) {
    const draw = drawings[key]?.();
    if (!draw) return;
    const figure = el('figure', 'diagram');
    // Only fixed, code-owned geometry enters the SVG parser; training text uses textContent.
    const doc = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${draw.height}" role="img" aria-labelledby="diagram-${id}"><title id="diagram-${id}"></title>${draw.body}</svg>`,
      'image/svg+xml'
    );
    doc.querySelector('title').textContent = `Schéma: ${title}`;
    const help = el('details', 'diagram-help');
    help.append(el('summary', '', 'Značky a vysvetlenie schémy'), el('p', '', draw.caption));
    figure.append(document.importNode(doc.documentElement, true), help);
    parent.append(figure);
    if (key === 'finish' || key === 'sprint-jump') return;
    const legend = el('div', 'diagram-legend');
    [['player', 'Hráč'], ['opponent', 'Súper'], ['keeper', 'Brankár B'], ['pass', 'Prihrávka'], ['move', 'Pohyb / vedenie']].forEach(([kind, label]) => {
      const item = el('span', 'legend-item');
      const symbol = el('span', ['pass', 'move'].includes(kind) ? `legend-line ${kind}` : `legend-dot ${kind}`);
      symbol.setAttribute('aria-hidden', 'true');
      item.append(symbol, document.createTextNode(label));
      legend.append(item);
    });
    help.append(legend);
  }

  function addList(parent, title, items, className = '') {
    if (!items?.length) return;
    const group = el('div', `detail-group ${className}`.trim());
    const list = el('ul');
    items.forEach(item => list.append(el('li', '', item)));
    group.append(el('h3', '', title), list);
    parent.append(group);
  }

  function addTable(parent, data) {
    const wrap = el('div', 'table-wrap');
    const table = el('table');
    table.append(el('caption', '', data.caption));
    const thead = el('thead');
    const row = el('tr');
    data.headers.forEach(header => {
      const cell = el('th', '', header);
      cell.scope = 'col';
      row.append(cell);
    });
    thead.append(row);
    const tbody = el('tbody');
    data.rows.forEach(cells => {
      const tr = el('tr');
      cells.forEach(value => tr.append(el('td', '', value)));
      tbody.append(tr);
    });
    table.append(thead, tbody);
    wrap.append(table);
    parent.append(wrap);
  }

  function validateData(data) {
    if (data?.version !== 1 || !Array.isArray(data.trainings) || !data.trainings.length) throw new Error('Unsupported training data.');
    const ids = new Set();
    for (const training of data.trainings) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(training.id) || ids.has(training.id) || training.date !== training.id) throw new Error('Invalid training identifier.');
      ids.add(training.id);
      if (!Number.isFinite(new Date(`${training.date}T12:00:00Z`).getTime())) throw new Error('Invalid date.');
      for (const key of ['title', 'focus', 'cue', 'category', 'players', 'coaches', 'surface']) {
        if (typeof training[key] !== 'string' || !training[key].trim()) throw new Error(`Missing ${key}.`);
      }
      if (!Array.isArray(training.blocks) || !training.blocks.length) throw new Error('Missing training blocks.');
      let end = 0;
      const blockIds = new Set();
      for (const block of training.blocks) {
        if (typeof block.id !== 'string' || !/^\d+$/.test(block.id) || blockIds.has(block.id)
          || block.start !== end || !Number.isFinite(block.end) || block.end <= block.start || !Object.hasOwn(drawings, block.diagram)) throw new Error('Invalid block sequence.');
        blockIds.add(block.id);
        end = block.end;
        for (const key of ['title', 'summary', 'space', 'dose']) if (typeof block[key] !== 'string' || !block[key].trim()) throw new Error('Missing block information.');
        for (const key of ['steps', 'cues', 'adjustments']) if (!Array.isArray(block[key]) || block[key].some(item => typeof item !== 'string')) throw new Error('Invalid coaching text.');
        if (!block.steps.length || !block.cues.length) throw new Error('Missing coaching text.');
        for (const table of block.tables || []) {
          if (!Array.isArray(table.headers) || !table.headers.length || !Array.isArray(table.rows) || table.rows.some(row => !Array.isArray(row) || row.length !== table.headers.length)) throw new Error('Invalid rotation table.');
        }
      }
      if (end !== training.duration) throw new Error('Training duration mismatch.');
      for (const key of ['equipment', 'notes', 'sources']) if (!Array.isArray(training[key]) || !training[key].length) throw new Error(`Missing ${key}.`);
    }
    return data;
  }

  const storageKeys = { done: 'training-completed-v2', gear: 'training-equipment-v2', vault: 'training-private-v1' };
  let groupSize = 4;
  let vaultEpoch = 0;
  let lastTimerState = '';
  function readLocal(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
  function writeLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { message('Prehliadač nepovolil uloženie. Údaje po zatvorení nemusia zostať.'); return false; } }
  function completed() { const value = state.done[state.selected.id]; return Array.isArray(value) ? value : []; }
  function checkedGear() { const value = state.gear[state.selected.id]; return Array.isArray(value) ? value : []; }
  function activeBlock() { return state.selected.blocks[state.blockIndex]; }
  function clockKey() { return state.selected.id + '/' + activeBlock().id; }
  function currentClock() { const key = clockKey(); if (!state.clocks.has(key)) state.clocks.set(key, new TrainingClock((activeBlock().end - activeBlock().start) * 60000)); return state.clocks.get(key); }
  function clockText(milliseconds) { const seconds = Math.ceil(milliseconds / 1000); return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
  function updateTimer() {
    if (!state.selected) return;
    const clock = currentClock();
    const remaining = clock.remaining();
    const value = clockText(remaining);
    $('timer-value').textContent = value;
    $('timer-preview').textContent = value;
    const status = remaining === 0 ? 'Čas bloku uplynul' : clock.deadline !== null ? 'Beží' : clock.started ? 'Pozastavený' : 'Pripravený';
    if (status !== lastTimerState) { $('timer-state').textContent = status; lastTimerState = status; }
    $('timer-toggle').textContent = clock.deadline !== null && remaining > 0 ? 'Pauza' : remaining === 0 ? 'Spustiť znova' : clock.started ? 'Pokračovať' : 'Spustiť';
  }
  function attendanceCase() { return state.selected.attendanceCases?.find(x => x.total === state.attendance); }
  function updateSessionMeta() {
    const training = state.selected;
    const currentCase = attendanceCase();
    $('session-meta').textContent = training.duration + ' min · ' + (currentCase ? currentCase.total + ' detí · 2 brankári' : training.players);
    const options = currentCase ? [...new Set(currentCase.groups)].sort() : [6];
    if (!options.includes(groupSize)) groupSize = options[0];
    $('grouping').textContent = currentCase ? 'Štyri skupiny: ' + currentCase.groups.join(' + ') + ' hráčov do poľa. Dvaja brankári zostávajú pri bránach.' : training.players + '. ' + training.coaches + '.';
  }
  function navigate(view, index = state.blockIndex) {
    const training = state.selected;
    const block = training.blocks[index];
    const section = view === 'field' ? null : view;
    const url = linkFor(training.id, block.id, section);
    if (url !== location.href) { history.pushState(null, '', url); onRoute(); }
    else onRoute();
  }
  function renderProgress() {
    const done = completed();
    $('completion-count').textContent = 'Dokončené: ' + done.length + ' z ' + state.selected.blocks.length + '. Označenie vidíš iba v tomto prehliadači.';
    $('block-rail').replaceChildren(...state.selected.blocks.map((block, index) => {
      const button = el('button', done.includes(block.id) ? 'is-complete' : '', done.includes(block.id) ? '✓ ' + (index + 1) : String(index + 1));
      button.type = 'button';
      button.setAttribute('aria-label', 'Blok ' + (index + 1) + ': ' + block.title + (done.includes(block.id) ? ', dokončený' : ''));
      if (index === state.blockIndex) button.setAttribute('aria-current', 'step');
      button.addEventListener('click', () => navigate('field', index));
      return button;
    }));
    $('overview-blocks').replaceChildren(...state.selected.blocks.map((block, index) => {
      const button = el('button', 'overview-item' + (done.includes(block.id) ? ' is-complete' : ''));
      button.type = 'button';
      const description = el('span');
      description.append(el('small', '', block.start + '–' + block.end + ' min · ' + (block.end - block.start) + ' min'), el('strong', '', block.title));
      button.append(el('span', 'overview-index', done.includes(block.id) ? '✓' : String(index + 1)), description);
      button.addEventListener('click', () => navigate('field', index));
      return button;
    }));
  }
  function renderActive() {
    const block = activeBlock();
    $('block-meta').textContent = 'Časť ' + (state.blockIndex + 1) + ' zo ' + state.selected.blocks.length + ' · ' + block.start + '–' + block.end + ' min';
    $('activity-title').textContent = block.title;
    $('active-dose').textContent = block.dose;
    $('active-cue').textContent = '„' + block.cues[0] + '“';
    $('active-diagram').replaceChildren();
    addDiagram($('active-diagram'), block.diagram, state.selected.id + '-' + block.id, block.title);
    $('previous-block').disabled = state.blockIndex === 0;
    const last = state.blockIndex === state.selected.blocks.length - 1;
    const allDone = completed().length === state.selected.blocks.length;
    const lastDone = last && completed().includes(block.id);
    $('complete-block').textContent = last ? lastDone ? 'Posledná časť hotová ✓' : 'Dokončiť tréning ✓' : 'Hotovo → ďalej';
    $('complete-block').disabled = lastDone;
    const next = state.selected.blocks[state.blockIndex + 1];
    $('next-preview').textContent = next ? 'Nasleduje: ' + next.title + ' · ' + (next.end - next.start) + ' min' : 'Posledná časť tréningu.';
    $('finished').hidden = !lastDone;
    $('finished').querySelector('h2').textContent = allDone ? 'Tréning je dokončený' : 'Posledná časť je hotová';
    $('finished').querySelector('p').textContent = allDone ? 'Všetky časti máš označené. Doprajte si vodu a pokojný záver.' : 'V prehľade je označených ' + completed().length + ' z ' + state.selected.blocks.length + ' častí. Ostatné môžeš skontrolovať v prehľade.';
    document.querySelector('[data-detail="rotations"]').hidden = !block.tables?.length;
    state.detail = null;
    renderDetail();
    renderProgress();
    lastTimerState = '';
    updateTimer();
  }
  function renderDetail() {
    const panel = $('detail-panel');
    document.querySelectorAll('[data-detail]').forEach(button => button.setAttribute('aria-expanded', String(button.dataset.detail === state.detail)));
    panel.hidden = !state.detail;
    panel.replaceChildren();
    if (!state.detail) return;
    const block = activeBlock();
    if (state.detail === 'steps') {
      panel.append(el('h2', '', 'Ako to prebieha'), el('p', 'muted', block.summary), el('p', '', block.space));
      addList(panel, 'Postup', block.steps);
    } else if (state.detail === 'cues') {
      addList(panel, 'Čo povedať hráčom', block.cues.map(x => '„' + x + '“'));
      addList(panel, 'Čo sledovať a ako upraviť', block.adjustments);
    } else {
      panel.append(el('h2', '', 'Striedanie a rotácie'));
      const currentCase = attendanceCase();
      if (currentCase && ['2', '3', '4'].includes(block.id)) {
        const choices = el('div', 'detail-buttons');
        [...new Set(currentCase.groups)].sort().forEach(size => {
          const button = el('button', '', 'Skupina ' + size);
          button.type = 'button';
          button.setAttribute('aria-pressed', String(groupSize === size));
          if (groupSize === size) button.style.backgroundColor = 'var(--soft)';
          button.addEventListener('click', () => { groupSize = size; renderDetail(); });
          choices.append(button);
        });
        panel.append(choices);
      }
      for (const table of block.tables || []) {
        if (currentCase && block.id === '5') addTable(panel, { ...table, rows: table.rows.filter(row => Number(row[0]) === state.attendance) });
        else if (currentCase && block.id === '2') addTable(panel, { ...table, rows: table.rows.filter(row => row[0].startsWith(String(groupSize))) });
        else if (currentCase && block.id === '3') {
          const column = groupSize === 4 ? 1 : 2;
          addTable(panel, { caption: table.caption, headers: ['Akcia', groupSize + ' hráčov: útok / obrana'], rows: table.rows.filter(row => row[column] !== 'Oddych').map(row => [row[0], row[column]]) });
        } else if (!(currentCase && block.id === '4' && groupSize === 5)) addTable(panel, table);
      }
      if (block.variantNotes?.[String(groupSize)]) panel.append(el('p', '', block.variantNotes[String(groupSize)]));
    }
  }
  function renderEquipment() {
    const checked = checkedGear();
    $('equipment-progress').textContent = 'Pripravené: ' + checked.length + ' z ' + state.selected.equipment.length;
    $('equipment-list').replaceChildren(...state.selected.equipment.map(item => {
      const label = el('label', 'equipment-card');
      const input = el('input');
      input.type = 'checkbox';
      input.checked = checked.includes(item.name);
      const content = el('span');
      content.append(el('strong', '', item.name), el('small', '', item.quantity), el('p', '', item.detail));
      input.addEventListener('change', () => {
        const values = new Set(checkedGear());
        if (input.checked) values.add(item.name); else values.delete(item.name);
        state.gear[state.selected.id] = [...values];
        writeLocal(storageKeys.gear, state.gear);
        $('equipment-progress').textContent = 'Pripravené: ' + values.size + ' z ' + state.selected.equipment.length;
      });
      label.append(input, content);
      return label;
    }));
  }
  function render(training) {
    state.selected = training;
    $('training-select').value = training.id;
    $('training-title').textContent = training.title;
    $('training-focus').textContent = training.focus;
    $('training-cue').textContent = '„' + training.cue + '“';
    document.title = training.title + ' · Tréningy U10 / U11';
    $('attendance-wrap').hidden = !training.attendanceCases;
    if (training.attendanceCases) {
      $('attendance').replaceChildren(...training.attendanceCases.map(item => {
        const option = el('option', '', String(item.total)); option.value = item.total; return option;
      }));
      if (!training.attendanceCases.some(x => x.total === state.attendance)) state.attendance = training.attendanceCases[0].total;
      $('attendance').value = String(state.attendance);
    }
    updateSessionMeta();
    renderEquipment();
    $('coaching-notes').replaceChildren(...training.notes.map(item => {
      const details = el('details', 'note-card');
      details.append(el('summary', '', item.title), el('p', '', item.text));
      return details;
    }));
    $('sources-list').replaceChildren(...training.sources.map(source => {
      const p = el('p');
      if (source.url && /^https:\/\//.test(source.url)) {
        const a = el('a', '', source.label); a.href = source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; p.append(a);
      } else p.textContent = source.label;
      return p;
    }));
    $('training').hidden = false;
    $('bottom-nav').hidden = false;
    $('share').disabled = false;
  }
  function setView(view) {
    if (state.view === 'private' && view !== 'private') lockVault();
    state.view = view;
    $('main').classList.toggle('private-mode', view === 'private');
    for (const name of ['field', 'overview', 'equipment', 'coaching', 'private']) $(name + '-view').hidden = name !== view;
    document.querySelectorAll('[data-view]').forEach(a => {
      if (a.dataset.view === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (view === 'private') renderVault();
  }
  function onRoute(initial = false) {
    if (!state.trainings.length) return;
    const current = route();
    const training = state.trainings.find(x => x.id === current.id) || state.trainings[0];
    const index = Math.max(0, training.blocks.findIndex(x => x.id === current.block));
    const changed = state.selected?.id !== training.id;
    if (training.attendanceCases?.some(x => x.total === current.attendance)) state.attendance = current.attendance;
    const blockChanged = changed || state.blockIndex !== index;
    if (state.selected && blockChanged) currentClock().pause();
    if (changed) { lockVault(); render(training); }
    else if (training.attendanceCases) { $('attendance').value = String(state.attendance); updateSessionMeta(); }
    state.blockIndex = index;
    if (blockChanged || initial) renderActive();
    const view = ['overview', 'equipment', 'coaching', 'private'].includes(current.section) ? current.section : 'field';
    setView(view);
    if (!current.id || current.id !== training.id) {
      history.replaceState(null, '', linkFor(training.id, training.blocks[index].id, view === 'field' ? null : view));
      if (current.id) message('Tento tréning sa nenašiel. Zobrazujem najnovší.');
    }
    if (!initial) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  const personalPlanId = 'u11-2026-10-27-v1';
  const personalStorageKey = 'training-private-plan-' + personalPlanId;
  let personalBundle = null;
  let personalIndex = 0;
  function personalSteps() {
    return state.vault.sections.flatMap((section, sectionIndex) => section.items.map((text, itemIndex) => ({ title: section.title, text, sectionIndex, itemIndex, count: section.items.length })));
  }
  async function loadPersonalBundle() {
    if (!personalBundle) {
      const response = await fetch('./personal-plan.enc.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('Plan unavailable');
      const blob = await response.json();
      if (!PrivateVault.valid(blob) || blob.planId !== personalPlanId) throw new Error('Invalid plan');
      personalBundle = blob;
    }
    return personalBundle;
  }
  function lockVault() {
    vaultEpoch++;
    state.vault = null; state.vaultPassword = null; state.vaultStorageKey = null;
    personalIndex = 0;
    $('private-notes').value = '';
    $('personal-sections').replaceChildren();
    for (const id of ['restore-password', 'unlock-password']) $(id).value = '';
    $('restore-form').reset(); $('backup-options').open = false; $('personal-options').open = false;
    $('personal-topic').replaceChildren();
    $('vault-content').hidden = true;
    if (state.view === 'private') renderVault();
  }
  function renderVault() {
    const unlocked = Boolean(state.vault);
    $('vault-locked').hidden = unlocked;
    $('private-intro').hidden = unlocked;
    $('vault-content').hidden = !unlocked;
    $('private-message').textContent = '';
    if (!unlocked) return;
    $('personal-topic').replaceChildren(...state.vault.sections.flatMap((section, index) => {
      if (!section.items.length) return [];
      const option = el('option', '', section.title); option.value = index; return [option];
    }));
    renderPersonalStep();
    $('private-notes').value = state.vault.notes;
  }
  function renderPersonalStep() {
    if (!state.vault) return;
    const steps = personalSteps();
    personalIndex = Math.max(0, Math.min(personalIndex, steps.length - 1));
    const step = steps[personalIndex];
    const card = el('div', 'personal-step');
    if (step) {
      $('personal-topic').value = step.sectionIndex;
      card.append(el('p', 'eyebrow', `Bod ${step.itemIndex + 1} z ${step.count} · celkovo ${personalIndex + 1}/${steps.length}`), el('p', 'personal-tip', step.text));
    } else card.append(el('p', '', 'Tento starší záznam obsahuje iba poznámky. Otvor Poznámky a možnosti.'));
    $('personal-sections').replaceChildren(card);
    $('personal-topic').hidden = !steps.length;
    $('personal-previous').disabled = personalIndex === 0;
    $('personal-next').disabled = !steps.length || personalIndex === steps.length - 1;
    $('personal-next').textContent = personalIndex === steps.length - 1 ? 'Plán prejdený ✓' : 'Ďalší bod →';
  }
  async function saveVault() {
    const storageKey = state.vaultStorageKey;
    if (!storageKey || !state.vault) throw new Error('Locked');
    const blob = { ...await PrivateVault.encrypt(state.vault, state.vaultPassword), ...(storageKey === personalStorageKey ? { planId: personalPlanId } : {}) };
    localStorage.setItem(storageKey, JSON.stringify(blob));
    return blob;
  }
  async function restoreVault(event) {
    event.preventDefault();
    const epoch = vaultEpoch;
    const button = event.submitter;
    const password = $('restore-password').value;
    button.disabled = true;
    try {
      if (!crypto.subtle) throw new Error('Secure context required');
      const file = $('private-file').files[0];
      if (!file || file.size > 250000) throw new Error('Invalid file');
      const parsed = JSON.parse(await file.text());
      const content = await PrivateVault.decrypt(parsed, password);
      if (epoch !== vaultEpoch || document.hidden || state.view !== 'private') return;
      state.vault = content; state.vaultPassword = password; state.vaultStorageKey = parsed.planId === personalPlanId ? personalStorageKey : storageKeys.vault;
      personalIndex = 0;
      await saveVault();
      $('restore-form').reset(); $('backup-options').open = false; renderVault();
    } catch {
      lockVault();
      $('private-message').textContent = 'Zálohu sa nepodarilo otvoriť. Skontroluj súbor, heslo a povolené ukladanie. Pôvodné uloženie zostalo zachované.';
    } finally { button.disabled = false; }
  }
  async function unlockVault(event) {
    event.preventDefault(); const button = event.submitter; button.disabled = true;
    const epoch = vaultEpoch;
    try {
      const password = $('unlock-password').value;
      const savedPlan = readLocal(personalStorageKey, null);
      const legacy = readLocal(storageKeys.vault, null);
      const candidates = [];
      if (savedPlan) candidates.push({ blob: savedPlan, key: personalStorageKey });
      if (legacy) candidates.push({ blob: legacy, key: storageKeys.vault });
      let opened = null;
      for (const candidate of candidates) {
        try { opened = { content: await PrivateVault.decrypt(candidate.blob, password), key: candidate.key }; break; } catch { /* Preserve saved data while trying another vault. */ }
      }
      if (!opened && !savedPlan) opened = { content: await PrivateVault.decrypt(await loadPersonalBundle(), password), key: personalStorageKey };
      if (!opened) throw new Error('Saved notes could not be opened');
      if (epoch !== vaultEpoch || document.hidden || state.view !== 'private') return;
      state.vault = opened.content; state.vaultStorageKey = opened.key; personalIndex = 0;
      state.vaultPassword = password; $('unlock-password').value = ''; renderVault();
    } catch { if (epoch === vaultEpoch && state.view === 'private') $('private-message').textContent = 'Plán sa nepodarilo otvoriť. Skopíruj presné heslo z chatu a skontroluj pripojenie. Uložené poznámky zostali zachované.'; }
    finally { button.disabled = false; }
  }
  async function load() {
    if (state.loading) return;
    state.loading = true;
    $('error').hidden = true; $('loading').hidden = false; $('training').hidden = true; $('bottom-nav').hidden = true;
    $('share').disabled = true; $('training-select').disabled = true;
    try {
      const response = await fetch('./trainings.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = validateData(await response.json());
      state.trainings = [...data.trainings].sort((a, b) => b.date.localeCompare(a.date));
      state.selected = null;
      state.done = readLocal(storageKeys.done, {}); state.gear = readLocal(storageKeys.gear, {});
      if (!state.done || typeof state.done !== 'object' || Array.isArray(state.done)) state.done = {};
      if (!state.gear || typeof state.gear !== 'object' || Array.isArray(state.gear)) state.gear = {};
      $('training-select').replaceChildren(...state.trainings.map(training => {
        const option = el('option', '', dateLabel(training.date) + ' · ' + training.category); option.value = training.id; return option;
      }));
      $('training-select').disabled = false; onRoute(true);
    } catch { $('error').hidden = false; }
    finally { state.loading = false; $('loading').hidden = true; }
  }
  $('training-select').addEventListener('change', event => {
    history.pushState(null, '', linkFor(event.target.value)); onRoute();
  });
  document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); $('main').focus(); $('main').scrollIntoView({ block: 'start' }); });
  $('attendance').addEventListener('change', event => {
    state.attendance = Number(event.target.value); updateSessionMeta();
    history.replaceState(null, '', linkFor(state.selected.id, activeBlock().id, state.view === 'field' ? null : state.view));
    if (state.detail === 'rotations') renderDetail();
  });
  $('share').addEventListener('click', () => share(linkFor(state.selected.id)));
  $('share-block').addEventListener('click', () => share(linkFor(state.selected.id, activeBlock().id)));
  $('copy-link').addEventListener('click', copyLink);
  $('native-share').addEventListener('click', async () => {
    try { await navigator.share({ title: state.selected.title, url: $('share-url').value }); }
    catch (error) { if (error.name !== 'AbortError') message('Použi Skopírovať odkaz.'); }
  });
  $('retry').addEventListener('click', load);
  document.querySelectorAll('[data-view]').forEach(a => a.addEventListener('click', event => { event.preventDefault(); if (state.selected) navigate(a.dataset.view); }));
  document.querySelectorAll('[data-detail]').forEach(button => button.addEventListener('click', () => { state.detail = state.detail === button.dataset.detail ? null : button.dataset.detail; renderDetail(); }));
  $('previous-block').addEventListener('click', () => navigate('field', Math.max(0, state.blockIndex - 1)));
  $('complete-block').addEventListener('click', () => {
    currentClock().pause();
    state.done[state.selected.id] = [...new Set([...completed(), activeBlock().id])];
    writeLocal(storageKeys.done, state.done);
    if (state.blockIndex < state.selected.blocks.length - 1) navigate('field', state.blockIndex + 1); else renderActive();
  });
  $('review-training').addEventListener('click', () => navigate('overview'));
  $('reset-progress').addEventListener('click', () => { state.done[state.selected.id] = []; writeLocal(storageKeys.done, state.done); renderProgress(); renderActive(); });
  $('reset-equipment').addEventListener('click', () => { state.gear[state.selected.id] = []; writeLocal(storageKeys.gear, state.gear); renderEquipment(); });
  $('timer-toggle').addEventListener('click', () => { const clock = currentClock(); if (clock.deadline !== null && clock.remaining() > 0) clock.pause(); else clock.start(); updateTimer(); });
  $('timer-reset').addEventListener('click', () => { currentClock().reset(); updateTimer(); });
  $('restore-form').addEventListener('submit', restoreVault);
  $('personal-previous').addEventListener('click', () => { personalIndex--; renderPersonalStep(); });
  $('personal-next').addEventListener('click', () => { personalIndex++; renderPersonalStep(); });
  $('personal-topic').addEventListener('change', event => { personalIndex = personalSteps().findIndex(step => step.sectionIndex === Number(event.target.value)); renderPersonalStep(); });
  $('unlock-form').addEventListener('submit', unlockVault);
  $('lock-vault').addEventListener('click', lockVault);
  $('private-notes-form').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.submitter; button.disabled = true;
    try { state.vault.notes = $('private-notes').value; await saveVault(); $('private-message').textContent = 'Poznámky sú šifrovane uložené v tomto prehliadači.'; }
    catch { $('private-message').textContent = 'Uloženie sa nepodarilo. Poznámky zatiaľ zostali na obrazovke.'; }
    finally { button.disabled = false; }
  });
  $('export-vault').addEventListener('click', async () => {
    try {
      state.vault.notes = $('private-notes').value;
      const blob = await saveVault();
      const url = URL.createObjectURL(new Blob([JSON.stringify(blob)], { type: 'application/json' }));
      const a = el('a'); a.href = url; a.download = 'moj-sifrovany-tahak.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { $('private-message').textContent = 'Zálohu sa nepodarilo vytvoriť.'; }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) lockVault(); updateTimer(); });
  window.addEventListener('pagehide', lockVault);
  window.addEventListener('hashchange', () => onRoute());
  window.addEventListener('popstate', () => onRoute());
  setInterval(updateTimer, 250);
  load();
})();
