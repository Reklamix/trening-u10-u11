'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const state = { trainings: [], selected: null, observer: null, loading: false };
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
    return { id: params.get('trening'), block: params.get('blok'), section: params.get('sekcia') };
  }

  function linkFor(id, block = null, section = null) {
    const url = new URL(location.href);
    url.search = '';
    const params = new URLSearchParams({ trening: id });
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
        + text(180, 21, '2 na 2 · voľný počet dotykov') + text(180, 218, 'Tretia dvojica oddychuje'),
      caption: 'Príklad šesťčlennej skupiny s B. Bez neho dve malé bránky na oboch koncoch. Päťčlenná skupina má vlastnú rotáciu a oddych.'
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
    figure.append(document.importNode(doc.documentElement, true), el('figcaption', '', draw.caption));
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
    parent.append(legend);
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

  function updateExpandButton() {
    const allOpen = [...$('blocks').children].every(block => block.open);
    $('expand-all').textContent = allOpen ? 'Zbaliť všetko' : 'Rozbaliť všetko';
    $('expand-all').setAttribute('aria-expanded', String(allOpen));
  }

  function renderBlocks(training) {
    const root = $('blocks');
    root.replaceChildren();
    training.blocks.forEach((block, index) => {
      const details = el('details', 'block');
      details.id = `block-${block.id}`;
      details.open = index === 0;
      const summary = el('summary');
      const description = el('span');
      description.append(el('span', 'block-meta', `${block.start}–${block.end} min · trvanie ${block.end - block.start} min`), el('span', 'block-title', block.title));
      const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrowSvg.setAttribute('viewBox', '0 0 20 20');
      arrowSvg.setAttribute('class', 'chevron');
      arrowSvg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'm5 8 5 5 5-5');
      arrowSvg.append(path);
      summary.append(el('span', 'block-number', String(index + 1)), description, arrowSvg);
      const body = el('div', 'block-body');
      body.append(el('p', 'block-description', block.summary), el('p', '', block.space));
      const dose = el('div', 'dose');
      dose.append(el('strong', '', 'DÁVKA A ODDYCH'), document.createTextNode(block.dose));
      body.append(dose);
      addDiagram(body, block.diagram, `${training.id}-${block.id}`, block.title);
      addList(body, 'Ako to prebieha', block.steps);
      block.tables?.forEach(table => addTable(body, table));
      const cue = el('div', 'cue-box');
      cue.append(el('h3', '', 'Čo povedať hráčom'), el('p', '', block.cues.map(item => `„${item}“`).join(' ')));
      body.append(cue);
      addList(body, 'Čo sledovať a ako upraviť', block.adjustments, 'adjust');
      const blockShare = el('button', 'block-link', 'Zdieľať tento blok');
      blockShare.type = 'button';
      blockShare.addEventListener('click', () => share(linkFor(training.id, block.id)));
      body.append(blockShare);
      details.append(summary, body);
      details.addEventListener('toggle', updateExpandButton);
      root.append(details);
    });
    updateExpandButton();
  }

  function render(training) {
    state.selected = training;
    document.title = `${training.title} · Tréningy U10 / U11`;
    $('training-select').value = training.id;
    $('training-date').textContent = `${dateLabel(training.date)} · ${training.category}`;
    $('training-title').textContent = training.title;
    $('training-focus').textContent = training.focus;
    $('training-cue').textContent = `„${training.cue}“`;
    $('training-meta').replaceChildren(...[
      `${training.duration} minút`, training.players, training.coaches, training.surface
    ].map(item => el('span', '', item)));
    renderBlocks(training);
    $('equipment-list').replaceChildren(...training.equipment.map(item => {
      const card = el('div', 'equipment-card');
      card.append(el('span', '', item.quantity), el('h3', '', item.name), el('p', '', item.detail));
      return card;
    }));
    $('coaching-notes').replaceChildren(...training.notes.map(item => {
      const card = el('div', 'note-card');
      card.append(el('h3', '', item.title), el('p', '', item.text));
      return card;
    }));
    $('sources-list').replaceChildren(...training.sources.map(source => {
      const p = el('p');
      if (source.url && /^https:\/\//.test(source.url)) {
        const a = el('a', '', source.label);
        a.href = source.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        p.append(a);
      } else p.textContent = source.label;
      return p;
    }));
    $('training').hidden = false;
    $('bottom-nav').hidden = false;
    $('share').disabled = false;
    state.observer?.disconnect();
    if ('IntersectionObserver' in window) {
      state.observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) setCurrentSection(visible[0].target.id);
      }, { rootMargin: '-10% 0px -55% 0px', threshold: 0 });
      ['plan', 'equipment', 'coaching'].forEach(id => state.observer.observe($(id)));
    }
  }

  function setCurrentSection(id) {
    document.querySelectorAll('[data-section]').forEach(a => {
      if (a.dataset.section === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }

  function onRoute(initial = false) {
    if (!state.trainings.length) return;
    const current = route();
    const requested = state.trainings.find(item => item.id === current.id);
    const training = requested || state.trainings[0];
    if (!requested) {
      history.replaceState(null, '', linkFor(training.id));
      if (current.id) message('Tento tréning sa nenašiel. Zobrazujem najnovší plán.');
    }
    const changed = state.selected?.id !== training.id;
    if (changed) render(training);
    const targetBlock = current.block && training.blocks.find(item => item.id === current.block);
    if (targetBlock) {
      const target = $(`block-${targetBlock.id}`);
      target.open = true;
      setCurrentSection('plan');
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }));
    } else if (['plan', 'equipment', 'coaching'].includes(current.section)) {
      setCurrentSection(current.section);
      requestAnimationFrame(() => $(current.section).scrollIntoView({ behavior: 'instant', block: 'start' }));
    } else if (!initial && changed) {
      setCurrentSection('plan');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
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

  async function load() {
    if (state.loading) return;
    state.loading = true;
    $('error').hidden = true;
    $('loading').hidden = false;
    $('training').hidden = true;
    $('bottom-nav').hidden = true;
    $('share').disabled = true;
    $('training-select').disabled = true;
    try {
      const response = await fetch('./trainings.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = validateData(await response.json());
      state.trainings = [...data.trainings].sort((a, b) => b.date.localeCompare(a.date));
      state.selected = null;
      $('training-select').replaceChildren(...state.trainings.map(training => {
        const option = el('option', '', `${dateLabel(training.date)} · ${training.category}`);
        option.value = training.id;
        return option;
      }));
      $('training-select').disabled = false;
      onRoute(true);
    } catch {
      $('error').hidden = false;
    } finally {
      state.loading = false;
      $('loading').hidden = true;
    }
  }

  $('training-select').addEventListener('change', event => { location.hash = new URL(linkFor(event.target.value)).hash; });
  $('share').addEventListener('click', () => share(linkFor(state.selected.id)));
  $('copy-link').addEventListener('click', copyLink);
  $('native-share').addEventListener('click', async () => {
    try {
      await navigator.share({ title: `${state.selected.category}: ${state.selected.title}`, url: $('share-url').value });
    } catch (error) {
      if (error.name !== 'AbortError') message('Použi tlačidlo Skopírovať odkaz.');
    }
  });
  $('retry').addEventListener('click', load);
  $('expand-all').addEventListener('click', () => {
    const open = ![...$('blocks').children].every(block => block.open);
    [...$('blocks').children].forEach(block => { block.open = open; });
    updateExpandButton();
  });
  document.querySelectorAll('[data-section]').forEach(a => a.addEventListener('click', event => {
    if (!state.selected) return;
    event.preventDefault();
    const section = a.dataset.section;
    history.pushState(null, '', linkFor(state.selected.id, null, section));
    setCurrentSection(section);
    $(section).scrollIntoView({ block: 'start' });
  }));
  window.addEventListener('hashchange', () => onRoute());
  window.addEventListener('popstate', () => onRoute());
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.block').forEach(block => { block.dataset.wasOpen = String(block.open); block.open = true; });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('.block').forEach(block => { block.open = block.dataset.wasOpen === 'true'; delete block.dataset.wasOpen; });
  });
  load();
})();
