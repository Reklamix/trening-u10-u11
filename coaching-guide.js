'use strict';

// Headings describe the existing instructions; the training remains the source of every step.
const CoachingGuideModel = {
  titles: {
    'football-warmup': ['Rozhýbanie', 'Vedenie lopty', 'Prihrávky v pohybe', 'Voda a skupiny'],
    'football-pass': ['Ukáž poradie', 'Priprav prvý dotyk', 'Pohyb po prihrávke', 'Série a prestávky', 'Voda'],
    'football-rondo': ['Ukážka a série', 'Kto bráni', 'Zisk a obnovenie hry', 'Bodovanie a ponuka', 'Úprava náročnosti a voda'],
    'football-zones': ['Časovanie kôl', 'Ako získať bod', 'Úloha neutrálneho', 'Výmena neutrálneho', 'Dávka hry'],
    'football-mini-games': ['Organizácia a časovanie', 'Priprav bránky', 'Pravidlá minihry', 'Výmena neutrálneho', 'Skórovanie', 'Obnovenie a prestávka'],
    'football-finish': ['Upokojenie', 'Otázka deťom', 'Konkrétna pochvala']
  },
  supports(block) { return this.titles[block.diagram]?.length === block.steps.length; },
  tables(block, attendance, size) {
    return (block.tables || []).filter(table => !table.groupSize || table.groupSize === size).map(table => ({
      ...table,
      rows: table.headers[0] === 'Detí spolu' ? table.rows.filter(row => Number(row[0]) === attendance) : table.rows
    }));
  }
};

// COACHING_BROWSER
(() => {
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  let active = null;
  function close() { if (active?.open) active.close(); }
  function open({ block, training, attendance, size, section = 'prepare', layoutMap }) {
    close();
    const returnFocus = document.activeElement;
    const groups = training.attendanceCases.find(item => item.total === attendance)?.groups || [];
    const dialog = node('dialog', 'coaching-guide');
    dialog.setAttribute('aria-labelledby', 'guide-title');
    const header = node('header', 'guide-header');
    const heading = node('div');
    heading.append(node('p', 'eyebrow', 'SPRIEVODCA CVIČENÍM'), node('h2', '', block.title));
    heading.querySelector('h2').id = 'guide-title';
    const dismiss = node('button', 'guide-close', '×'); dismiss.type = 'button'; dismiss.setAttribute('aria-label', 'Zavrieť návod');
    dismiss.addEventListener('click', close); header.append(heading, dismiss);
    const nav = node('nav', 'guide-tabs'); nav.setAttribute('aria-label', 'Časti návodu');
    const body = node('div', 'guide-body'); body.tabIndex = -1;
    const footer = node('footer', 'guide-footer');
    const tabs = [['prepare', 'Príprava'], ['steps', 'Postup'], ['rotations', 'Striedanie'], ['cues', 'Tréner']];
    let step = 0;
    for (const [key, label] of tabs) {
      const button = node('button', '', label); button.type = 'button'; button.dataset.guideSection = key;
      button.addEventListener('click', () => { section = key; render(); }); nav.append(button);
    }
    function card(label, text, className = '') {
      const box = node('section', 'guide-card ' + className);
      box.append(node('h3', '', label), node('p', '', text)); return box;
    }
    function details(label, text) {
      const disclosure = node('details', 'guide-disclosure');
      disclosure.append(node('summary', '', label), node('p', '', text)); return disclosure;
    }
    function render() {
      nav.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.guideSection === section)));
      body.replaceChildren(); footer.replaceChildren(); body.scrollTop = 0;
      if (section === 'prepare') {
        body.append(node('p', 'guide-intro', block.summary));
        const facts = node('div', 'guide-facts'), stage = training.quarterPitch?.stages?.[block.diagram];
        facts.append(card('Detí spolu', String(attendance)));
        if (block.diagram === 'football-warmup') facts.append(card('Zóny A + B', Math.ceil(attendance / 2) + ' + ' + Math.floor(attendance / 2)));
        else if (stage) facts.append(card('Skupiny', groups.join(' + ')));
        else facts.append(card('Organizácia', 'Celé mužstvo'));
        if (stage) facts.append(card('Jedna plocha', `${stage.areas[0].length} × ${stage.areas[0].width} m`));
        if (block.coneSetup) facts.append(card('Kužele spolu', String(block.coneSetup.perArea * block.coneSetup.areas)));
        body.append(facts);
        if (block.coneSetup) {
          body.append(card('Rozlož kužele', block.coneSetup.placement));
          if (block.coneSetup.extra) body.append(details('Ďalšie pokyny ku kužeľom', block.coneSetup.extra));
        }
        if (layoutMap) {
          const map = node('details', 'guide-disclosure'); map.append(node('summary', '', 'Mapa celej 1/4 ihriska'), layoutMap.cloneNode(true));
          if (stage) map.append(node('p', '', stage.instructions)); body.append(map);
        }
        body.append(details('Podrobné rozloženie', block.space));
      } else if (section === 'steps') {
        const progress = node('p', 'guide-progress', `Krok ${step + 1} z ${block.steps.length}`); progress.setAttribute('role', 'status');
        const dots = node('div', 'guide-step-track'); dots.setAttribute('aria-hidden', 'true');
        block.steps.forEach((_, index) => dots.append(node('span', index <= step ? 'is-done' : '')));
        body.append(progress, dots, card(CoachingGuideModel.titles[block.diagram][step], block.steps[step], 'guide-current-step'));
      } else if (section === 'rotations') {
        if ((block.tables || []).some(table => table.groupSize)) {
          const label = node('label', 'guide-group', 'Skupina, ktorú práve vedieš');
          const select = node('select'); select.setAttribute('aria-label', 'Skupina v návode');
          [...new Set(groups)].sort().forEach(value => { const option = node('option', '', 'Skupina ' + value); option.value = value; select.append(option); });
          select.value = String(size); select.addEventListener('change', () => { size = Number(select.value); render(); body.querySelector('select').focus(); });
          label.append(select); body.append(label);
        }
        const tables = CoachingGuideModel.tables(block, attendance, size);
        if (!tables.length) body.append(card('Bez rotačnej tabuľky', 'Postupuj podľa časti Postup.'));
        for (const table of tables) {
          body.append(node('p', 'guide-intro', table.caption));
          for (const row of table.rows) {
            const list = node('dl', 'guide-rotation');
            row.forEach((value, index) => { const pair = node('div'); pair.append(node('dt', '', table.headers[index]), node('dd', '', value)); list.append(pair); });
            body.append(list);
          }
        }
        if (block.variantNotes?.[String(size)]) body.append(card('Pre túto skupinu', block.variantNotes[String(size)]));
      } else {
        body.append(node('h3', 'guide-section-title', 'Čo povedať hráčom'));
        block.cues.forEach(text => body.append(node('blockquote', 'guide-quote', '„' + text + '“')));
        body.append(node('h3', 'guide-section-title', 'Čo sledovať a ako upraviť'));
        const list = node('ul', 'guide-watch'); block.adjustments.forEach(text => list.append(node('li', '', text))); body.append(list);
      }
      body.append(details('Čas a prestávky · ' + (block.end - block.start) + ' min', block.dose));
      if (section === 'steps') {
        const previous = node('button', 'secondary-button', '← Späť'); previous.type = 'button'; previous.disabled = step === 0;
        previous.addEventListener('click', () => { step--; render(); (step ? footer.firstElementChild : footer.lastElementChild).focus(); });
        const last = step === block.steps.length - 1;
        const next = node('button', 'button', last ? 'Späť na nákres' : 'Ďalší bod →'); next.type = 'button';
        next.addEventListener('click', () => { if (last) close(); else { step++; render(); footer.lastElementChild.focus(); } }); footer.append(previous, next);
      } else {
        const next = node('button', 'button', section === 'prepare' ? 'Prejsť na postup →' : 'Späť na nákres'); next.type = 'button';
        next.addEventListener('click', () => { if (section === 'prepare') { section = 'steps'; render(); footer.lastElementChild.focus(); } else close(); }); footer.append(next);
      }
    }
    dialog.append(header, nav, body, footer); document.body.append(dialog); active = dialog;
    dialog.addEventListener('close', () => { dialog.remove(); if (active === dialog) active = null; if (returnFocus?.isConnected) returnFocus.focus(); }, { once: true });
    render(); window.FootballBoard?.pause(); dialog.showModal();
  }
  window.CoachingGuide = { supports: block => CoachingGuideModel.supports(block), open, close };
})();
