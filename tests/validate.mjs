import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { webcrypto, createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFileSync(path.join(root, name), 'utf8');
const data = JSON.parse(read('trainings.json'));
const diagrams = new Set(['warmup', 'coordination', 'duel', 'two-one', 'two-two', 'target', 'buildout', 'sprint-jump', 'match', 'two-matches', 'finish']);
let assertions = 0;
const check = (value, message) => { assert.ok(value, message); assertions++; };
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions++; };

equal(data.version, 1, 'Known data version');
check(Array.isArray(data.trainings) && data.trainings.length >= 2, 'Existing training archive preserved');
const seen = new Set();
for (const t of data.trainings) {
  check(/^\d{4}-\d{2}-\d{2}$/.test(t.id) && t.id === t.date && !seen.has(t.id), 'Unique date identifier');
  equal(new Date(`${t.date}T12:00:00Z`).toISOString().slice(0, 10), t.date, 'Valid calendar date');
  seen.add(t.id);
  for (const key of ['category', 'title', 'focus', 'cue', 'players', 'coaches', 'surface']) check(typeof t[key] === 'string' && t[key].trim().length > 0, `${t.id}: ${key}`);
  check(Number.isFinite(t.duration) && t.duration > 0, 'Positive duration');
  check(t.blocks.length > 0, 'Training has blocks');
  const blockIds = new Set();
  let total = 0;
  for (const b of t.blocks) {
    check(typeof b.id === 'string' && /^\d+$/.test(b.id) && !blockIds.has(b.id), 'Unique numeric block identifier');
    blockIds.add(b.id);
    equal(b.start, total, `${t.id}: no gaps or overlaps before block ${b.id}`);
    check(Number.isFinite(b.end) && b.end > b.start, 'Positive block length');
    total = b.end;
    check(diagrams.has(b.diagram), 'Known diagram');
    for (const key of ['title', 'summary', 'space', 'dose']) check(typeof b[key] === 'string' && b[key].trim(), `${t.id}/${b.id}: ${key}`);
    for (const key of ['steps', 'cues', 'adjustments']) check(Array.isArray(b[key]) && b[key].every(x => typeof x === 'string' && x.trim()), 'Valid list of coaching text');
    check(b.steps.length > 0 && b.cues.length > 0, 'Actionable instructions');
    for (const table of b.tables || []) {
      check(typeof table.caption === 'string' && table.caption.length > 0, 'Table has caption');
      check(table.headers.length > 0 && table.headers.every(x => typeof x === 'string'), 'Table has headers');
      check(table.rows.every(row => row.length === table.headers.length && row.every(x => typeof x === 'string')), 'Rectangular text table');
    }
  }
  equal(total, t.duration, `${t.id}: duration sums correctly`);
  check(t.equipment.length > 0 && t.equipment.every(x => ['name', 'quantity', 'detail'].every(k => typeof x[k] === 'string' && x[k].trim())), 'Equipment complete');
  check(t.notes.length > 0 && t.notes.every(x => typeof x.title === 'string' && typeof x.text === 'string'), 'Organisation complete');
  for (const source of t.sources) {
    check(typeof source.label === 'string' && source.label.length > 0, 'Source label present');
    if (source.url) check(new URL(source.url).protocol === 'https:', 'HTTPS sources only');
  }
}

const tue = data.trainings.find(x => x.id === '2026-10-27');
const mon = data.trainings.find(x => x.id === '2026-10-26');
equal(tue.blocks.map(x => [x.start, x.end]), [[0, 10], [10, 24], [24, 36], [36, 52], [52, 72], [72, 75]], 'Tuesday approved timing');
equal(mon.blocks.map(x => [x.start, x.end]), [[0, 10], [10, 20], [20, 34], [34, 50], [50, 72], [72, 75]], 'Monday approved timing');
check(tue.players.includes('19–22') && tue.players.includes('2 brankárov'), 'Tuesday current counts');
for (const entry of tue.attendanceCases) equal(entry.groups.reduce((a, b) => a + b, 2), entry.total, 'All attendees assigned including two keepers');
equal(tue.attendanceCases.map(x => x.total), [19, 20, 21, 22], 'All requested attendance variants');

// Use the published rotation text, not a second unconnected fixture.
const duelRows = tue.blocks[1].tables[0].rows;
for (const n of [4, 5]) {
  const row = duelRows.find(x => x[0].startsWith(String(n)));
  const pairs = [...row[1].matchAll(/(\d+)→(\d+)/g)].map(m => [Number(m[1]), Number(m[2])]);
  equal(pairs.length, n === 4 ? 4 : 5, 'Published 1v1 rotation length');
  const cycle = [...pairs, ...(n === 5 ? [null] : [])];
  const series = [...cycle, ...cycle];
  for (let p = 1; p <= n; p++) {
    equal(series.filter(x => x?.[0] === p).length, 2, `1v1 ${n}: player ${p} attacks twice per series`);
    equal(series.filter(x => x?.[1] === p).length, 2, `1v1 ${n}: player ${p} defends twice per series`);
    const interval = n === 4 ? 30 : 20;
    const starts = series.flatMap((x, i) => x?.includes(p) ? [i * interval] : []);
    check(starts.slice(1).every((start, i) => start - starts[i] >= (n === 4 ? 60 : 40)), 'Minimum 1v1 rest interval');
    check(starts.at(-1) + 8 <= 240, '1v1 series fits four minutes');
  }
}

const twoOne = tue.blocks[2].tables[0].rows;
for (const n of [4, 5]) {
  const actions = twoOne.map(row => row[n === 4 ? 1 : 2]).filter(x => x !== 'Oddych').map(x => x.match(/\d+/g).map(Number));
  equal(actions.length, n, '2v1 actions in one series');
  for (let p = 1; p <= n; p++) {
    equal(actions.filter(x => x.slice(0, 2).includes(p)).length, 2, '2v1 two attacks per series');
    equal(actions.filter(x => x[2] === p).length, 1, '2v1 one defence per series');
  }
  const seconds = n === 4 ? 50 : 40;
  check((actions.length - 1) * seconds + 10 <= 210, '2v1 series fits 3:30 including last action');
}

const pairRounds = tue.blocks[3].tables[0].rows;
for (const pair of ['A', 'B']) {
  equal(pairRounds.filter(row => row[1] === pair).length, 3, '2v2 pair attacks three rounds');
  equal(pairRounds.filter(row => row[2] === pair).length, 3, '2v2 pair defends three rounds');
}
equal(6 * 80, 8 * 60, 'Four-player 2v2 keeps eight minutes per player');
const restOrder = [1,2,3,4,5,1,2,3,4,5,1,2];
equal([1,2,3,4,5].map(p => 540 - 45 * restOrder.filter(x => x === p).length).sort((a,b) => a-b), [405,405,450,450,450], 'Five-player 2v2 play time and rest');
const gameRows = tue.blocks[4].tables[0].rows;
for (const row of gameRows) {
  const total = row.slice(1).reduce((sum, cell) => sum + Number(cell.split('=').at(-1).trim()), 0);
  equal(total, Number(row[0]), 'Every child assigned in final games');
}

const publicFiles = ['index.html', 'styles.css', 'app.js', 'trainings.json', 'personal-plan.enc.json', '.nojekyll', 'README.md'];
for (const file of publicFiles) {
  const content = read(file);
  check(!/\uFFFD/.test(content), 'No replacement glyphs');
  check(!/(sk-proj-|github_pat_|ghp_)[A-Za-z0-9_]{10,}/.test(content), 'No credentials in public files');
}
check(!/\b(syna|synovi|synov|osobný plán|osobné poznámky)\b/iu.test(read('trainings.json')), 'No private child coaching notes in public training data');
check(!readdirSync(root).some(x => /\.pdf$/i.test(x)), 'No private PDFs copied');
const html = read('index.html');
check(html.includes('lang="sk"') && html.includes('width=device-width'), 'Slovak responsive HTML');
for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)) check(read(match[1].split('?')[0]).length > 0, 'Local asset exists');
const css = read('styles.css');
check(css.includes('prefers-reduced-motion') && css.includes(':focus-visible'), 'Reduced motion and visible keyboard focus');
check(!/innerHTML\s*=|insertAdjacentHTML|eval\(/.test(read('app.js')), 'Content is not interpolated into HTML');

const stable = value => Array.isArray(value) ? '[' + value.map(stable).join(', ') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ': ' + stable(value[key])).join(', ') + '}' : JSON.stringify(value);
equal(createHash('sha256').update(stable(mon)).digest('hex'), 'ca3903386575776828717369261c0453161a9cedbc37238bce3af1f3c735c188', 'Monday archive unchanged');
const pure = read('app.js').split('// BROWSER_APP')[0];
const { TrainingClock, PrivateVault } = runInNewContext(pure + '\n({TrainingClock, PrivateVault})', { crypto: webcrypto, TextEncoder, TextDecoder, btoa, atob });
const clock = new TrainingClock(600000);
clock.start(1000); equal(clock.remaining(31000), 570000, 'Clock accounts for wall time');
clock.pause(61000); equal(clock.remaining(999000), 540000, 'Pause freezes time');
clock.start(121000); equal(clock.remaining(181000), 480000, 'Resume continues remaining time');
equal(clock.remaining(900000), 0, 'Clock never negative after background interval');
clock.pause(900000); clock.start(901000); equal(clock.remaining(901000), 600000, 'Restart finished block');
clock.reset(); equal(clock.remaining(999000), 600000, 'Reset restores exact block duration');
equal(clock.deadline, null, 'Reset does not auto-start');
// Synthetic cryptography fixture; no real browser vault or user password is created by this test.
const privateFixture = { version: 1, sections: [{ title: 'QA fixture', items: ['Confidential QA text'] }], notes: 'Test notes only' };
const encrypted = await PrivateVault.encrypt(privateFixture, 'qa-only-synthetic-password');
check(!JSON.stringify(encrypted).includes('Confidential QA text'), 'Backup has no plaintext content');
equal(JSON.stringify(await PrivateVault.decrypt(encrypted, 'qa-only-synthetic-password')), JSON.stringify(privateFixture), 'Encrypted backup round trip');
await assert.rejects(() => PrivateVault.decrypt(encrypted, 'wrong-synthetic-password')); assertions++;
const tampered = { ...encrypted, data: (encrypted.data[0] === 'A' ? 'B' : 'A') + encrypted.data.slice(1) };
await assert.rejects(() => PrivateVault.decrypt(tampered, 'qa-only-synthetic-password')); assertions++;
const encryptedAgain = await PrivateVault.encrypt(privateFixture, 'qa-only-synthetic-password');
check(JSON.stringify(encryptedAgain) !== JSON.stringify(encrypted), 'Fresh salt and nonce for each save');
check(!PrivateVault.valid({ ...encrypted, iterations: 1 }), 'Reject weakened KDF metadata');
const hostedPlan = JSON.parse(read('personal-plan.enc.json'));
check(PrivateVault.valid(hostedPlan), 'Hosted plan is an encrypted envelope');
equal(hostedPlan.planId, 'u11-2026-10-27-v1', 'Hosted plan has expected storage identity');
equal(Object.keys(hostedPlan).sort(), ['data', 'iterations', 'iv', 'planId', 'salt', 'vaultVersion'], 'Only encrypted envelope metadata is published');
await assert.rejects(() => PrivateVault.decrypt(hostedPlan, 'qa-only-synthetic-password')); assertions++;
check(!html.includes('id="setup-form"') && !html.includes('id="confirm-password"'), 'No account creation or password confirmation required');
check(html.includes('id="personal-next"') && html.includes('id="personal-previous"') && html.includes('id="personal-topic"'), 'Private plan has step navigation and topic picker');
check(html.includes('<details id="backup-options"') && !html.includes('<details id="backup-options" open'), 'Restore remains optional and collapsed');
check(!readdirSync(root).some(name => /osobny|tahak|syna/i.test(name)), 'No personal file deployed');

console.log(`PASS: ${assertions} checks; ${data.trainings.length} trainings; timing, rotations, counts, public content and local assets.`);
