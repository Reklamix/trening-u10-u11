import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { webcrypto, createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFileSync(path.join(root, name), 'utf8');
const data = JSON.parse(read('trainings.json'));
const diagrams = new Set(['warmup', 'coordination', 'duel', 'two-one', 'two-two', 'target', 'buildout', 'sprint-jump', 'match', 'two-matches', 'finish', 'duel-no-keeper', 'two-one-no-keeper', 'two-two-no-keeper', 'two-matches-no-keeper']);
for(const key of ['warmup','pass','rondo','zones','matches','finish'])diagrams.add('football-'+key);
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
const thu = data.trainings.find(x => x.id === '2026-10-29');
equal(thu.startTime,'18:00','Thursday starts at 18:00');
equal(thu.blocks.map(b=>[b.start,b.end]),[[0,10],[10,22],[22,36],[36,52],[52,72],[72,75]],'Thursday approved blocks');
equal(thu.attendanceCases.map(c=>c.total),[16,17,18,19,20,21,22,23,24],'Thursday selectable counts');
for(const c of thu.attendanceCases){equal(c.groups.reduce((a,b)=>a+b,0),c.total,'Thursday every child assigned');check(c.groups.every(n=>n>=4&&n<=6),'Thursday groups fit drill rotations');}
for(const r of thu.blocks[2].rotation){equal(r.size,r.rounds,'Every child defends once in each rondo series');equal(r.rounds*(r.playSeconds+r.restSeconds)+r.bufferSeconds,270,'Rondo fits 4:30');equal(r.playSeconds*2,70,'Each child has two equal defence rounds');}
for(const row of thu.blocks[4].tables[0].rows)equal(row.slice(1).reduce((n,s)=>n+Number(s.split('=').at(-1).trim()),0),Number(row[0]),'Thursday final games include every selected child');
for(const p of [1,2,3,4,5,6]){const rounds=thu.blocks[3].tables.find(t=>t.groupSize===6).rows;equal(rounds.filter(r=>r[1].split(', ').map(Number).includes(p)).length*2,2,'Six-player zone game has two neutral rounds per player');}
equal(tue.blocks.map(x => [x.start, x.end]), [[0, 10], [10, 24], [24, 36], [36, 52], [52, 72], [72, 75]], 'Tuesday approved timing');
equal(mon.blocks.map(x => [x.start, x.end]), [[0, 10], [10, 20], [20, 34], [34, 50], [50, 72], [72, 75]], 'Monday approved timing');
check(tue.players.includes('17–22') && tue.players.includes('bez brankárov') && tue.keepers === 0, 'Tuesday has no goalkeepers');
for (const entry of tue.attendanceCases) equal(entry.groups.reduce((a, b) => a + b, 0), entry.total, 'All attendees assigned as field players');
equal(tue.attendanceCases.map(x => x.total), [17,18,19,20,21,22], 'Attendance includes absence of two previous keepers');
equal(tue.attendanceCases.find(x => x.total === 19).groups, [5,5,5,4], 'Nineteen children all assigned without keepers');
check(tue.blocks.slice(1,5).every(b=>b.diagram.endsWith('-no-keeper')), 'Tuesday action diagrams match no-keeper plan');

// Use the published rotation text, not a second unconnected fixture.
const duelRows = tue.blocks[1].tables[0].rows;
for (const n of [4, 5, 6]) {
  const row = duelRows.find(x => x[0].startsWith(String(n)));
  const pairs = [...row[1].matchAll(/(\d+)→(\d+)/g)].map(m => [Number(m[1]), Number(m[2])]);
  equal(pairs.length, n, 'Published 1v1 rotation length');
  const cycle = [...pairs, ...(n === 5 ? [null] : [])];
  const series = [...cycle, ...cycle];
  for (let p = 1; p <= n; p++) {
    equal(series.filter(x => x?.[0] === p).length, 2, `1v1 ${n}: player ${p} attacks twice per series`);
    equal(series.filter(x => x?.[1] === p).length, 2, `1v1 ${n}: player ${p} defends twice per series`);
    const interval = n === 4 ? 30 : 20;
    const starts = series.flatMap((x, i) => x?.includes(p) ? [i * interval] : []);
    check(starts.slice(1).every((start, i) => start - starts[i] >= (n === 5 ? 40 : 60)), 'Minimum 1v1 rest interval');
    check(starts.at(-1) + 8 <= 240, '1v1 series fits four minutes');
  }
}

const twoOne = tue.blocks[2].tables[0].rows;
for (const n of [4, 5, 6]) {
  const actions = twoOne.map(row => row[n - 3]).filter(x => x !== 'Oddych').map(x => x.match(/\d+/g).map(Number));
  equal(actions.length, n, '2v1 actions in one series');
  for (let p = 1; p <= n; p++) {
    equal(actions.filter(x => x.slice(0, 2).includes(p)).length, 2, '2v1 two attacks per series');
    equal(actions.filter(x => x[2] === p).length, 1, '2v1 one defence per series');
  }
  const seconds = n === 4 ? 50 : n === 5 ? 40 : 35;
  check((actions.length - 1) * seconds + 10 <= 210, '2v1 series fits 3:30 including last action');
}

const pairRounds = tue.blocks[3].tables[0].rows;
for (const pair of ['A', 'B']) {
  equal(pairRounds.filter(row => row[1] === pair).length, 3, '2v2 pair attacks three rounds');
  equal(pairRounds.filter(row => row[2] === pair).length, 3, '2v2 pair defends three rounds');
}
equal(6 * 80, 8 * 60, 'Four-player 2v2 keeps eight minutes per player');
const sixRounds = tue.blocks[3].tables.find(t=>t.groupSize===6).rows;
for (const pair of ['A','B','C']) {
  equal(sixRounds.filter(r=>r[1].includes(pair)).length,4,'Six-player 2v2 each pair plays four rounds');
  equal(sixRounds.filter(r=>r[2]===pair).length,2,'Six-player 2v2 each pair rests two rounds');
}
equal(4*90,6*60,'Six-player 2v2 each child has six minutes play');
const restOrder = [1,2,3,4,5,1,2,3,4,5,1,2];
equal([1,2,3,4,5].map(p => 540 - 45 * restOrder.filter(x => x === p).length).sort((a,b) => a-b), [405,405,450,450,450], 'Five-player 2v2 play time and rest');
const gameRows = tue.blocks[4].tables[0].rows;
for (const row of gameRows) {
  const total = row.slice(1).reduce((sum, cell) => sum + Number(cell.split('=').at(-1).trim()), 0);
  equal(total, Number(row[0]), 'Every child assigned in final games');
}

const publicFiles = ['index.html', 'styles.css', 'app.js', 'football.js', 'trainings.json', 'personal-plan.enc.json', 'personal-plan-2026-10-29.enc.json', '.nojekyll', 'README.md'];
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
check(!/innerHTML\s*=|insertAdjacentHTML|eval\(/.test(read('football.js')), 'Football diagrams use safe DOM construction');
check(readFileSync(path.join(root,thu.diagramSheet.replace('./',''))).length>0,'Original football sheet is deployed');

const stable = value => Array.isArray(value) ? '[' + value.map(stable).join(', ') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ': ' + stable(value[key])).join(', ') + '}' : JSON.stringify(value);
equal(createHash('sha256').update(stable(mon)).digest('hex'), 'ca3903386575776828717369261c0453161a9cedbc37238bce3af1f3c735c188', 'Monday archive unchanged');
equal(createHash('sha256').update(stable(tue)).digest('hex'), 'c6d977c75d4495f9a13d84644f5df07389ab7fdc7474546409b7772952ce0ee6', 'Tuesday archive unchanged');
const pure = read('app.js').split('// BROWSER_APP')[0];
const { TrainingClock, PrivateVault, TrainingArchive, TrainingSchedule, PersonalPlans } = runInNewContext(pure + '\n({TrainingClock, PrivateVault, TrainingArchive, TrainingSchedule, PersonalPlans})', { crypto: webcrypto, TextEncoder, TextDecoder, btoa, atob });
equal(JSON.stringify(PersonalPlans.map(p=>p.date)),JSON.stringify(['2026-10-27','2026-10-29']),'Personal plans are selected by training date');
equal(new Set(PersonalPlans.map(p=>'training-private-plan-'+p.id)).size,2,'Each day has a separate notes storage key');
for(const plan of PersonalPlans){
  const blob=JSON.parse(read(plan.file.replace('./','')));
  check(PrivateVault.valid(blob),'Dated personal file is encrypted');
  equal(blob.planId,plan.id,'Dated envelope matches its registry');
  equal(Object.keys(blob).sort(),['data','iterations','iv','planId','salt','vaultVersion'],'Dated artifact contains no plaintext sections');
  await assert.rejects(()=>PrivateVault.decrypt(blob,'qa-wrong-dated-password'));assertions++;
}
equal(TrainingSchedule.clock(thu.startTime,75),'19:15','Thursday ends at 19:15');
equal(TrainingSchedule.clock('23:50',15),'00:05','Clock labels cross midnight correctly');
equal(JSON.stringify(TrainingArchive.list(data.trainings).map(t => t.date)), JSON.stringify(['2026-10-29','2026-10-27', '2026-10-26']), 'Archive preserves existing dates and adds Thursday');
equal(TrainingArchive.list(data.trainings, '2026-10-26')[0].title, mon.title, 'Archived Monday opens its original content');
equal(TrainingArchive.list(data.trainings, '2026-10-27')[0].duration, 75, 'Archived Tuesday keeps complete duration');
equal(TrainingArchive.list(data.trainings, '2026-10-30').length, 0, 'Missing day returns no unrelated training');
const archiveFixture = [{date:'2026-12-31'}, {date:'2027-01-02'}, {date:'2026-01-01'}];
const originalOrder = JSON.stringify(archiveFixture);
equal(JSON.stringify(TrainingArchive.list(archiveFixture).map(t => t.date)), JSON.stringify(['2027-01-02','2026-12-31','2026-01-01']), 'Archive orders dates across years');
equal(JSON.stringify(archiveFixture), originalOrder, 'Opening archive does not mutate saved data');
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
check(html.includes('id="private-plan-select"'),'Private dates can be selected without leaving Moje');
check(html.includes('<details id="backup-options"') && !html.includes('<details id="backup-options" open'), 'Restore remains optional and collapsed');
check(!readdirSync(root).some(name => /osobny|tahak|syna/i.test(name)), 'No personal file deployed');

const footballPure=read('football.js').split('// FOOTBALL_BROWSER')[0];
const {FootballTimeline,FootballScenes}=runInNewContext(footballPure+'\n({FootballTimeline,FootballScenes})',{performance:{now:()=>0}});
const motion=new FootballTimeline(8);
motion.play(1000);equal(motion.time(3500),2.5,'Animation follows elapsed time');
motion.pause(4000);equal(motion.time(9000),3,'Paused animation stays still');
motion.play(10000);equal(motion.time(12000),5,'Animation resumes without jumping');
motion.pause(12000);motion.seek(2);equal(motion.time(50000),2,'Seeking pauses at exact step');
motion.play(0);equal(motion.time(50000),8,'Animation clamps to its end');
motion.pause(50000);motion.play(60000);equal(motion.time(60000),0,'Completed animation restarts');
for(const rate of [.25,.5,1,1.5]){
  const paced=new FootballTimeline(8);paced.setRate(rate,0);paced.play(1000);
  equal(paced.time(3000),2*rate,'Selected playback rate scales elapsed time');
  paced.pause(3000);equal(paced.time(9000),2*rate,'Pause freezes every playback rate');
  paced.play(10000);equal(paced.time(11000),3*rate,'Resume keeps selected playback rate');
}
const paced=new FootballTimeline(8);paced.play(0);paced.setRate(.5,2000);
equal(paced.time(2000),2,'Changing running speed preserves position');
equal(paced.time(6000),4,'New speed applies from change onward');
paced.pause(6000);paced.setRate(.25,10000);equal(paced.time(20000),4,'Changing paused speed preserves position');
paced.setLoop(true,20000);paced.play(20000);
equal(paced.time(40000),1,'Loop wraps with selected slow speed');
equal(paced.time(104000),1,'Loop spans multiple complete cycles');
paced.setRate(1.5,104000);equal(paced.time(104000),1,'Speed change in loop preserves cycle position');
paced.pause(106000);equal(paced.time(200000),4,'Loop pauses without restarting');
paced.play(200000);paced.setLoop(false,202000);
equal(paced.time(202000),7,'Disabling loop keeps current cycle position');
equal(paced.time(204000),8,'Disabled loop finishes normally');
paced.pause(204000);paced.setLoop(true,204000);paced.seek(8);
equal(paced.time(205000),8,'Seeking to end while paused holds final frame with loop selected');
paced.play(206000);equal(paced.time(206000),0,'Playing completed loop restarts');
paced.pause(207000);paced.seek(0);
equal(paced.rate,1.5,'Reset preserves selected speed');equal(paced.loop,true,'Reset preserves selected repeat setting');
const still=new FootballTimeline(0);still.setLoop(true,0);still.play(0);equal(still.time(2000),0,'Static scene never divides by zero in loop');
let invalidRateRejected=false;try{paced.setRate(0);}catch{invalidRateRejected=true;}check(invalidRateRejected,'Zero playback speed is rejected');
for(const total of thu.attendanceCases.map(c=>c.total)){
  let players=0,balls=0,matchPlayers=0;
  for(const pitchIndex of [0,1]){
    const warm=FootballScenes.build('football-warmup',{total,pitchIndex});
    players+=warm.nodes.filter(n=>n.kind==='player').length;balls+=warm.nodes.filter(n=>n.kind==='ball').length;
    const game=FootballScenes.build('football-matches',{total,pitchIndex});
    matchPlayers+=game.nodes.filter(n=>n.kind==='player').length;
    equal(game.nodes.filter(n=>n.team==='N').length,game.localCount%2,'Odd game has one neutral');
    const shot=FootballScenes.sample(game.tracks.ball,game.duration);
    check(shot.x>=game.pitch.x+game.pitch.w&&shot.x<=game.pitch.x+game.pitch.w+6,'Shot finishes inside actual miniature goal');
  }
  equal(players,total,'Warmup diagram accounts for all selected players');equal(balls,total,'Each warmup player has a ball');equal(matchPlayers,total,'Final diagrams account for all selected players');
}
for(const size of [4,5,6])for(const key of ['football-pass','football-rondo','football-zones']){
  const scene=FootballScenes.build(key,{size});
  equal(scene.nodes.filter(n=>n.kind==='player').length,size,'Local scene has exact selected group size');
  if(key==='football-rondo')equal(scene.nodes.filter(n=>n.team==='B').length,1,'Rondo has one defender');
  if(['football-pass','football-rondo'].includes(key)){
    const count=key==='football-pass'?size:size-1;
    equal(scene.transfers.length,count,'Full animation visits every passing player');
    equal(scene.transfers[0].from,'p0','Passing cycle starts with first player');
    equal(scene.transfers.at(-1).to,'p0','Passing cycle returns to its first player');
    equal(new Set(scene.transfers.map(t=>t.from)).size,count,'Every player passes once in the completed cycle');
    for(const transfer of scene.transfers){
      const ball=FootballScenes.sample(scene.tracks.ball,transfer.settled),receiver=FootballScenes.sample(scene.tracks[transfer.to],transfer.settled);
      check(Math.hypot(ball.x-receiver.x,ball.y-receiver.y)<12,'Each complete-cycle pass finishes at the receiver');
    }
    const ball=FootballScenes.sample(scene.tracks.ball,scene.duration),first=FootballScenes.sample(scene.tracks.p0,scene.duration);
    check(Math.hypot(ball.x-first.x,ball.y-first.y)<12,'Completed cycle holds the ball at its returning receiver');
    check(scene.duration>=count*4,'Complete playback includes all actions before finishing');
  }
  if(key==='football-zones'){
    equal(scene.nodes.filter(n=>n.team==='N').length,size-4,'Zone game has correct neutrals');
    const ball=FootballScenes.sample(scene.tracks.ball,6),receiver=FootballScenes.sample(scene.tracks.a2,6);
    check(ball.x>=scene.pitch.x+.9*scene.pitch.w,'Ball finishes in scoring zone');
    check(Math.hypot(ball.x-receiver.x,ball.y-receiver.y)<12,'Receiving player reaches the ball');
  }
  for(const frames of Object.values(scene.tracks)){
    check(frames.every(f=>f.every(Number.isFinite)),'All animation keyframes are finite');
    check(frames.every((f,i)=>i===0||f[0]>frames[i-1][0]),'Animation keyframes progress in time');
  }
}

console.log(`PASS: ${assertions} checks; ${data.trainings.length} trainings; timing, rotations, counts, public content and local assets.`);
