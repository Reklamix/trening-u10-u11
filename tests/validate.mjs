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
for(const key of ['warmup','pass','rondo','zones','matches','mini-games','finish'])diagrams.add('football-'+key);
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

const publicFiles = ['index.html', 'styles.css', 'app.js', 'football.js', 'training-planner.js', 'coaching-guide.js', 'pitch-setup.js', 'trainings.json', 'personal-plan.enc.json', 'personal-plan-2026-10-29.enc.json', '.nojekyll', 'README.md'];
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
const quarter=thu.quarterPitch;
for(const attendance of thu.attendanceCases)for(const block of thu.blocks.filter(b=>b.diagram!=='football-finish')){
  const groups=FootballScenes.groups(block.diagram,attendance.total,quarter);
  equal(groups.reduce((sum,area)=>sum+area.count,0),attendance.total,'Map assigns every child to exactly one real area');
  if(block.diagram!=='football-warmup')equal(JSON.stringify(groups.map(area=>area.count)),JSON.stringify(attendance.groups),'Named areas use saved attendance distribution');
  for(const area of groups){
    const scene=FootballScenes.build(block.diagram,{total:attendance.total,size:area.count,pitchIndex:area.index,area});
    equal(scene.nodes.filter(n=>n.kind==='player').length,area.count,'Selected area count matches all animated players including defenders and neutrals');
    for(const actor of [...scene.cones,...scene.nodes.filter(n=>n.kind==='player')]){
      const point=FootballScenes.mapPoint(area,scene.pitch,actor);
      check(point.x>=area.x-1e-8&&point.x<=area.x+area.w+1e-8&&point.y>=area.y-1e-8&&point.y<=area.y+area.h+1e-8,'Map places every cone and child within its actual area, including rotated warmup');
    }
    const start=FootballScenes.mapPoint(area,scene.pitch,{x:scene.pitch.x,y:scene.pitch.y});
    const end=FootballScenes.mapPoint(area,scene.pitch,{x:scene.pitch.x+scene.pitch.w,y:scene.pitch.y+scene.pitch.h});
    equal(start.x,area.x,'Map starts at actual area x');equal(start.y,area.y,'Map starts at actual area y');
    equal(end.x,area.x+area.w,'Map ends at actual area x boundary');equal(end.y,area.y+area.h,'Map ends at actual area y boundary');
  }
}
equal(FootballScenes.groups('football-pass',19,quarter)[0].count,5,'Fresh 19-child example opens A1 with five players');
equal(FootballScenes.groups('football-pass',19,quarter)[3].count,4,'Only B2 has four players at 19 children');
equal([quarter.width,quarter.height],[35,25],'Quarter-pitch footprint matches the user-provided dimensions');
equal(quarter.assumed,false,'User-provided footprint replaces the earlier assumption');equal(quarter.approximate,true,'Approximate measurement is not presented as an exact survey');
for(const block of thu.blocks.filter(b=>b.diagram!=='football-finish')){
  const stage=quarter.stages[block.diagram];check(stage&&stage.areas.length===block.coneSetup.areas,'Full layout includes every simultaneous area');
  check(stage.areas.every(a=>a.x>=2&&a.y>=2&&a.x+a.w<=quarter.width-2&&a.y+a.h<=quarter.height-2),'Playing areas retain at least two metres of outside space');
  check(stage.areas.every(a=>a.x+a.w<=quarter.corridor.x||a.x>=quarter.corridor.x+quarter.corridor.width),'Central corridor stays clear');
  for(let i=0;i<stage.areas.length;i++)for(const b of stage.areas.slice(i+1)){
    const a=stage.areas[i],gapX=Math.max(a.x-b.x-b.w,b.x-a.x-a.w),gapY=Math.max(a.y-b.y-b.h,b.y-a.y-a.h);
    check(gapX>=3||gapY>=3,'Simultaneous activities have at least three metres between their boundaries');
  }
  for(const area of stage.areas){
    equal([area.w,area.h].sort((a,b)=>a-b),[area.length,area.width].sort((a,b)=>a-b),'Physical layout dimensions allow only rotation, not stretching');
    for(const total of thu.attendanceCases.map(c=>c.total)){
      const scene=FootballScenes.build(block.diagram,{total,area});
      equal([scene.pitch.length,scene.pitch.width],[area.length,area.width],'Animated diagram uses dimensions from the quarter-pitch layout for every attendance');
      check(Math.abs(scene.pitch.w/scene.pitch.h-area.length/area.width)<1e-9,'Animated pitch retains the new physical aspect ratio');
      if(scene.pitch.goals){const shot=FootballScenes.sample(scene.tracks.ball,scene.duration),p=scene.pitch,centre=p.goalGates?.5:.25,half=p.goalGates?p.h/p.width:8;check(shot.x>=p.x+p.w&&shot.x<=p.x+p.w+6&&Math.abs(shot.y-(p.y+p.h*centre))<=half,'Ball still finishes inside the actual goal opening on the reduced pitch');}
      if(block.diagram==='football-warmup')check(scene.nodes.every(n=>scene.tracks[n.id].every(([,x,y])=>x>=scene.pitch.x+(n.kind==='ball'?4:10)&&x<=scene.pitch.x+scene.pitch.w-(n.kind==='ball'?4:10)&&y>=scene.pitch.y+(n.kind==='ball'?4:10)&&y<=scene.pitch.y+scene.pitch.h-(n.kind==='ball'?4:10))),'Every warmup actor stays fully within the smaller footprint');
      if(scene.pitch.zones)for(const cone of scene.cones.filter(c=>c.kind==='zone'))check(Math.abs(Math.min(cone.x-scene.pitch.x,scene.pitch.x+scene.pitch.w-cone.x)/scene.pitch.w*scene.pitch.length-2)<1e-9,'Reduced zone diagram still marks exactly two metres');
    }
  }
}
for(const[blockIndex,expectedTotal]of[8,16,16,32,32,0].entries()){
  const block=thu.blocks[blockIndex],setup=block.coneSetup;
  check(setup&&Number.isInteger(setup.areas)&&setup.areas>0&&Number.isInteger(setup.perArea)&&setup.perArea>=0,'Every Thursday activity has valid cone quantities');
  equal(setup.areas*setup.perArea,expectedTotal,'Cone total covers every simultaneous area');
  check(typeof setup.placement==='string'&&setup.placement.trim().length>0,'Every activity explains cone placement');
  for(const total of thu.attendanceCases.map(c=>c.total)){
    const scene=FootballScenes.build(block.diagram,{total});
    equal(scene.cones.length,setup.perArea,'Diagram shows exactly the per-area cone count for every attendance');
    equal(new Set(scene.cones.map(c=>`${c.x},${c.y}`)).size,scene.cones.length,'Cone positions are distinct');
    if(scene.pitch){
      const p=scene.pitch;
      equal(scene.cones.filter(c=>c.kind==='corner').length,4,'Every marked area has four corner cones');
      check(scene.cones.every(c=>((c.y===p.y||c.y===p.y+p.h)&&c.x>=p.x&&c.x<=p.x+p.w)||((c.x===p.x||c.x===p.x+p.w)&&c.y>=p.y&&c.y<=p.y+p.h)),'All cones, including goal gates, stay on a field boundary');
      for(const cone of scene.cones.filter(c=>c.kind==='zone'))check(Math.abs(Math.min(cone.x-p.x,p.x+p.w-cone.x)/p.w*p.length-2)<1e-9,'Zone cone is exactly two metres from its end line');
    }
  }
}
equal(thu.blocks[4].diagram,'football-mini-games','Final block uses four compact games rather than two full matches');
for(const entry of thu.attendanceCases){
  let count=0;
  for(let index=0;index<4;index++){
    const scene=FootballScenes.build('football-mini-games',{total:entry.total,pitchIndex:index,area:quarter.stages['football-mini-games'].areas[index]});
    count+=scene.localCount;equal(scene.localCount,entry.groups[index],'Each mini-game has the actual size of its selected group');
    equal(scene.nodes.filter(n=>n.team==='A'&&n.kind==='player').length,2,'Each mini-game has two attackers');
    equal(scene.nodes.filter(n=>n.team==='B'&&n.kind==='player').length,2,'Each mini-game has two opponents');
    equal(scene.nodes.filter(n=>n.team==='N').length,entry.groups[index]-4,'Every extra child remains active as a neutral');
    equal(scene.cones.filter(c=>c.kind==='gate').length,4,'Two cone gates use four cones per game');
    for(const side of[scene.pitch.x,scene.pitch.x+scene.pitch.w]){
      const gate=scene.cones.filter(c=>c.kind==='gate'&&c.x===side);
      check(Math.abs(Math.abs(gate[0].y-gate[1].y)/scene.pitch.h*scene.pitch.width-2)<1e-9,'Every cone goal is physically two metres wide');
    }
    const receiver=FootballScenes.sample(scene.tracks.ball,2),a2=scene.nodes.find(n=>n.id==='a1');check(Math.hypot(receiver.x-a2.x,receiver.y-a2.y)<12,'Opening pass reaches a real teammate in the compact game');
  }
  equal(count,entry.total,'All selected children participate across the four games');
}
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
    const dribblers=warm.nodes.filter(n=>n.kind==='player'),p=warm.pitch;
    check(warm.nodes.every(n=>warm.tracks[n.id]?.length>1),'Every warmup player and their ball has a motion track');
    check(dribblers.every(n=>{
      const frames=warm.tracks[n.id];
      return frames.slice(1).every((f,i)=>Math.hypot(f[1]-frames[i][1],f[2]-frames[i][2])>1);
    }),'All children move during every leg rather than waiting');
    check(warm.nodes.every(n=>warm.tracks[n.id].every(([,x,y])=>x>=p.x+(n.kind==='ball'?4:10)&&x<=p.x+p.w-(n.kind==='ball'?4:10)&&y>=p.y+(n.kind==='ball'?4:10)&&y<=p.y+p.h-(n.kind==='ball'?4:10))),'Players and balls stay fully inside the marked area');
    check(dribblers.every(n=>{
      const index=Number(n.id.slice(1)),ballTrack=warm.tracks[index===0?'ball':'b'+index];
      return Array.from({length:9},(_,i)=>i*.5).every(t=>{const player=FootballScenes.sample(warm.tracks[n.id],t),ball=FootballScenes.sample(ballTrack,t);return Math.hypot(player.x-ball.x,player.y-ball.y)<12;});
    }),'Every ball stays at its own moving player through direction changes');
    check(warm.nodes.every(n=>{const frames=warm.tracks[n.id];return Math.hypot(frames[0][1]-frames.at(-1)[1],frames[0][2]-frames.at(-1)[2])<1e-9;}),'Repeating warmup joins without a position jump');
    let separation=Infinity;
    for(let a=0;a<dribblers.length;a++)for(let b=a+1;b<dribblers.length;b++)for(let leg=0;leg<4;leg++){
      const first=warm.tracks[dribblers[a].id],second=warm.tracks[dribblers[b].id];
      const rx=first[leg][1]-second[leg][1],ry=first[leg][2]-second[leg][2],vx=first[leg+1][1]-second[leg+1][1]-rx,vy=first[leg+1][2]-second[leg+1][2]-ry;
      const u=Math.max(0,Math.min(1,-(rx*vx+ry*vy)/(vx*vx+vy*vy||1)));
      separation=Math.min(separation,Math.hypot(rx+u*vx,ry+u*vy));
    }
    check(separation>24,'Concurrent player paths avoid overlapping icons throughout every segment');
    check([.5,1.5,2.5,3.5].every(t=>warm.arrows.filter(a=>a.kind==='dribble'&&a.start<=t&&a.end>t).length===dribblers.length),'Each simultaneous dribbler has one visible direction arrow per phase');
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

const guidePure = read('coaching-guide.js').split('// COACHING_BROWSER')[0];
const guide = runInNewContext(guidePure + '\nCoachingGuideModel');
const guideTraining = data.trainings.find(training => training.id === '2026-10-29');
for (const block of guideTraining.blocks) {
  check(guide.supports(block), 'Each current exercise has a heading for every original instruction');
  const unchanged = JSON.stringify(block);
  for (const attendance of guideTraining.attendanceCases) for (const size of new Set(attendance.groups)) {
    const tables = guide.tables(block, attendance.total, size);
    check(tables.every(table => !table.groupSize || table.groupSize === size), 'Guide excludes rotations for other group sizes');
    for (const table of tables) {
      check(table.rows.length > 0, 'Selected attendance has actionable rotations');
      if (table.headers[0] === 'Detí spolu') {
        equal(table.rows.length, 1, 'Mini-games guide shows only selected attendance');
        equal(Number(table.rows[0][0]), attendance.total, 'Mini-games guide matches selected attendance');
      } else {
        const source = block.tables.find(item => item.groupSize === table.groupSize);
        equal(JSON.stringify(table.rows), JSON.stringify(source.rows), 'Group rotations preserve every original row');
      }
    }
  }
  equal(JSON.stringify(block), unchanged, 'Guide filtering cannot mutate saved training instructions');
}
check(!guide.supports({diagram:'duel-no-keeper',steps:[]}), 'Archived activities retain their existing instruction controls');

const setupPure = read('pitch-setup.js').split('// PITCH_SETUP_BROWSER')[0];
const {setup,setupMotion} = runInNewContext(footballPure + '\n' + setupPure + '\n({setup:PitchSetupPlan,setupMotion:PitchSetupMotion})');
const originalTraining = JSON.stringify(thu);
const setupPlan = setup.build(thu);
equal(JSON.stringify(thu), originalTraining, 'Setup plan never mutates saved training or activity geometry');
equal(JSON.stringify(setupPlan.steps.map(step=>step.total)), JSON.stringify([8,16,16,32,32]), 'Five setup steps use the agreed quantities');
equal(JSON.stringify(setupPlan.steps.map(step=>step.added.length)), JSON.stringify([8,8,0,16,0]), 'Only 32 distinct cones are introduced across the full preparation');
equal(JSON.stringify(setupPlan.steps.map(step=>step.moves.length)), JSON.stringify([0,8,16,0,16]), 'Setup separates moved cones from newly added cones');
const pointKey = point => `${point.x.toFixed(6)},${point.y.toFixed(6)}`;
let previousSetup = [];
for (const [index,step] of setupPlan.steps.entries()) {
  equal(step.total+step.stored,32,'Every setup step conserves the full 32-cone inventory');
  equal(step.kept.length+step.moves.length,previousSetup.length,'Every previously laid cone is kept or moved exactly once');
  const destinations=[...step.kept,...step.added,...step.moves.map(move=>move.to)];
  equal(new Set(destinations.map(pointKey)).size,step.total,'No two setup cones overlap');
  equal(JSON.stringify(destinations.map(pointKey).sort()),JSON.stringify(step.map.cones.map(pointKey).sort()),'Movement destinations reproduce the complete next layout');
  for (const move of step.moves) {
    check(previousSetup.some(point=>pointKey(point)===pointKey(move.from)),'Every arrow starts at a cone that was actually laid');
    if(index===1||index===2) check(Math.abs(Math.hypot(move.to.x-move.from.x,move.to.y-move.from.y)-1)<1e-8,'Narrowing/widening moves each corner by exactly one metre');
  }
  for(const point of step.map.cones) check(step.map.areas.some(area=>point.area===area.label&&point.x>=area.x-1e-8&&point.x<=area.x+area.w+1e-8&&point.y>=area.y-1e-8&&point.y<=area.y+area.h+1e-8),'Setup cones stay within their assigned approved area');
  previousSetup=step.map.cones;
}
equal(setupPlan.steps.at(-1).kept.length,16,'Converting zones to goals retains all sixteen corner cones');
equal(setupPlan.steps.at(-1).added.length,0,'Eight final goals reuse existing cones');
check(data.trainings.filter(training=>training.id!=='2026-10-29').every(training=>!setup.supports(training)),'Existing archive does not show an unrelated setup plan');

for(const step of setupPlan.steps){
  const unchanged=JSON.stringify(step),motion=setupMotion.create(step);
  equal(motion.moves.length,step.moves.length,'Every moved cone has exactly one animated path');
  equal(motion.added.length,step.added.length,'Every newly added cone has exactly one placement reveal');
  equal(motion.groups.length,new Set([...step.moves.map(move=>move.to.area),...step.added.map(point=>point.area)]).size,'Animation visits each affected area once');
  const start=setupMotion.sample(motion,0),end=setupMotion.sample(motion,motion.duration);
  check(start.added.every(opacity=>opacity===0),'New cones are absent before their placement');
  check(end.added.every(opacity=>opacity===1),'All added cones are visible at the completed layout');
  check(end.complete&&!start.complete,'Playback has a definite completion point');
  motion.moves.forEach((move,i)=>{
    check(Math.hypot(start.moves[i].x-move.from.x,start.moves[i].y-move.from.y)<1e-9,'Animated cone starts exactly at its actual previous position');
    check(Math.hypot(end.moves[i].x-move.to.x,end.moves[i].y-move.to.y)<1e-9,'Animated cone finishes exactly at its assigned new position');
    const halfway=setupMotion.sample(motion,(move.start+move.end)/2).moves[i];
    check(Math.hypot(halfway.x-(move.from.x+move.to.x)/2,halfway.y-(move.from.y+move.to.y)/2)<1e-9,'Midpoint follows the actual straight move without overshoot');
  });
  for(const time of[0,motion.duration/4,motion.duration/2,motion.duration,motion.duration+1]){
    const frame=setupMotion.sample(motion,time);
    check(frame.moves.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)),'Animated coordinates are always finite');
    check(frame.added.every(opacity=>opacity>=0&&opacity<=1),'Placement reveals stay within visible opacity bounds');
  }
  equal(JSON.stringify(step),unchanged,'Animation leaves cone geometry and preparation instructions untouched');
}

const plannerPure=read('training-planner.js');
const {planner,library}=runInNewContext(footballPure+'\n'+plannerPure+'\n({planner:TrainingPlanner,library:TrainingLibrary})');
const plannerSource=JSON.stringify(thu);
for(let players=14;players<=30;players++)for(const pitch of ['quarter','half','full']){
  const training=planner.adapt(thu,{players,pitch,coaches:2}),groups=planner.groups(players),config=training.planConfig;
  equal(groups.reduce((sum,n)=>sum+n,0),players,'Adaptive plan assigns every attendee once');
  check(groups.every(n=>n>=3&&n<=8),'Every supported group has an implemented drill form');
  equal(training.duration,75,'Adaptive training retains the full 75 minutes');
  equal(JSON.stringify(training.blocks.map(b=>[b.start,b.end])),JSON.stringify(thu.blocks.map(b=>[b.start,b.end])),'Adaptive variants preserve the training timeline');
  for(const block of training.blocks.filter(b=>b.diagram!=='football-finish')){
    const areas=FootballScenes.groups(block.diagram,players,training.quarterPitch);
    equal(areas.reduce((sum,area)=>sum+area.count,0),players,'Every activity map shows the entire selected attendance');
    for(const area of areas){
      check(area.x>=2&&area.y>=2&&area.x+area.w<=config.width-2&&area.y+area.h<=config.height-2,'Configured activities stay inside actual available dimensions');
      const scene=FootballScenes.build(block.diagram,{total:players,size:area.count,pitchIndex:area.index,area});
      equal(scene.nodes.filter(n=>n.kind==='player').length,area.count,'Animation shows exactly the configured local group, including 3/7/8');
      check(scene.pitch.y+scene.pitch.h+22<=310,'Adaptive football diagrams fit their SVG viewport');
      if(block.diagram==='football-rondo')equal(scene.nodes.filter(n=>n.team==='B').length,area.count>=7?2:1,'Larger rondos have two actual defenders');
      if(['football-zones','football-mini-games'].includes(block.diagram)){
        const form=planner.form(area.count);
        equal(scene.nodes.filter(n=>n.kind==='player'&&n.team==='A').length,form.team,'Adaptive attacking team matches the drill instructions');
        equal(scene.nodes.filter(n=>n.kind==='player'&&n.team==='B').length,form.team,'Adaptive defending team matches the drill instructions');
        equal(scene.nodes.filter(n=>n.kind==='player'&&n.team==='N').length,form.neutral,'Neutral count agrees with the selected game form');
      }
      for(const node of scene.nodes.filter(n=>n.kind==='player'))for(const time of[0,scene.duration/2,scene.duration]){
        const position=scene.tracks[node.id]?FootballScenes.sample(scene.tracks[node.id],time):node;
        check(Number.isFinite(position.x)&&Number.isFinite(position.y)&&position.x>=scene.pitch.x&&position.x<=scene.pitch.x+scene.pitch.w&&position.y>=scene.pitch.y&&position.y<=scene.pitch.y+scene.pitch.h,'Every animated child remains on the configured activity pitch');
      }
    }
    for(let i=0;i<areas.length;i++)for(const other of areas.slice(i+1)){
      const area=areas[i],gapX=Math.max(area.x-other.x-other.w,other.x-area.x-area.w),gapY=Math.max(area.y-other.y-other.h,other.y-area.y-area.h);
      check(gapX>=3-1e-8||gapY>=3-1e-8,'Adaptive areas retain a clear separation of at least three metres');
    }
  }
  const prepared=setup.build(training);
  equal(JSON.stringify(prepared.steps.map(step=>step.total)),JSON.stringify([8,16,16,32,32]),'Every configured footprint has a complete 32-cone setup sequence');
  for(const rotation of training.blocks[2].rotation){
    equal(rotation.rounds*(rotation.playSeconds+rotation.restSeconds)+rotation.bufferSeconds,270,'All rondo variants fit their 4:30 series');
    const table=training.blocks[2].tables.find(item=>item.groupSize===rotation.size);
    const turns=Array.from({length:rotation.size},(_,i)=>table.rows.filter(row=>row[1].split(', ').map(Number).includes(i+1)).length);
    check(turns.every(turns=>turns===rotation.defenders),'Rondo defender workload is equal within every group');
  }
}
for(const coaches of[1,2,3,4]){
  const training=planner.adapt(thu,{players:30,coaches,pitch:'quarter'});
  equal(training.planConfig.coaches,coaches,'Selected coach count is retained');
  check(training.organizationNotes.length>0&&training.organizationNotes[0].includes('Tréner 1'),'Every coach configuration offers an explicit organization proposal');
}
for(const dimensions of[[35,90],[120,25],[105,68]]){
  const training=planner.adapt(thu,{players:30,width:dimensions[0],height:dimensions[1],pitch:'full'});
  const areas=training.quarterPitch.stages['football-warmup'].areas;
  check(areas.every(area=>area.x>=2&&area.y>=2&&area.x+area.w<=dimensions[0]-2&&area.y+area.h<=dimensions[1]-2),'Edited dimensions retain the selected physical boundaries');
}
equal(JSON.stringify(thu),plannerSource,'Planner cannot alter the archived canonical training');
check(planner.adapt(mon,{players:30})===mon&&planner.adapt(tue,{players:14})===tue,'Earlier approved sessions remain their original archived versions');
equal(library.items(data.trainings).length,18,'Library indexes all eighteen saved exercises without duplication');
equal(library.filter(data.trainings).length,3,'Library preserves all three training dates');
check(library.items(data.trainings).every(item=>item.topics.length&&item.topics.every(topic=>library.topics[topic])),'Every archived activity has valid persistent topic metadata');
check(library.filter(data.trainings,{topic:'duels',mode:'drills'}).every(item=>item.topics.includes('duels')),'Topic filter returns only the requested skill');
equal(library.filter(data.trainings,{topic:'duels',mode:'drills'}).length,1,'Library finds the actual saved 1v1 exercise');
check(library.filter(data.trainings,{query:'klucka',mode:'drills'}).length>0,'Library search works without Slovak diacritics');
check(library.filter(data.trainings,{query:'29.10.2026',mode:'drills'}).every(item=>item.training.date==='2026-10-29'),'Library date search opens the expected training day');
equal(library.filter(data.trainings,{query:'29.10.2026',mode:'drills'}).length,6,'Date search includes all six activities of the saved day');
for(const size of[3,7,8])for(const key of['football-pass','football-rondo']){
  const scene=FootballScenes.build(key,{size});
  for(const transfer of scene.transfers){const ball=FootballScenes.sample(scene.tracks.ball,transfer.settled),receiver=FootballScenes.sample(scene.tracks[transfer.to],transfer.settled);check(Math.hypot(ball.x-receiver.x,ball.y-receiver.y)<12,'New group sizes complete each pass at the actual receiving player');}
}
equal(Object.keys(planner.normalize({players:20,privateNotes:'not-used'})).sort().join(','),'coaches,height,pitch,players,width','Public configuration retains only its five public planning fields');

console.log(`PASS: ${assertions} checks; ${data.trainings.length} trainings; timing, rotations, counts, public content and local assets.`);
