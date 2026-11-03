import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','interval-timer.js','training-programs.js','training-load.js'];
let now=0;
const api=vm.runInNewContext(files.map(n=>read(n).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0].split('// TIMER_AUDIO_BROWSER')[0]).join('\n')+';({TrainingCalendar,TrainingPlanner,FootballScenes,FootballSequences,ExerciseBrief,TrainingIntervals,IntervalClock,SessionPrograms})',{Date:class extends Date{static now(){return now;}}});
const {TrainingCalendar:C,TrainingPlanner:P,FootballScenes:F,FootballSequences:S,ExerciseBrief:B,TrainingIntervals:I,IntervalClock:Clock,SessionPrograms:G}=api;
const all=C.expand(JSON.parse(read('trainings.json')),JSON.parse(read('upcoming.json'))).trainings;let cases=0;
assert.equal(S.representative({nodes:[],tracks:{},arrows:[],phases:[{kind:'work',name:'Vedenie 5 m',start:0,end:1,actualSeconds:30,roles:{}},{kind:'work',name:'Vedenie 10 m',start:1,end:2,actualSeconds:30,roles:{}}]}).phases.length,2,'Different meaningful distances are not mistaken for child/repetition numbers');
for(const source of all.filter(t=>G.supports(t)||t.id==='2026-10-29'))for(const players of[10,19,20,24,30])for(const level of['base','standard','challenge']){
 const t=P.adapt(source,{players,levels:[level,level,level,level]});
 for(const b of t.blocks){const areas=F.groups(b.diagram,players,t.quarterPitch);for(const[index,area]of(areas.length?areas:[null]).entries()){
  const base=F.build(b.diagram,{total:players,size:area?.count,area,pitchIndex:index}),full=S.build(t,b,index,base),before=JSON.stringify(full),task=['duel','two-one'].includes(b.programKind),preview=S.representative(full,{taskDuration:task?(b.end-b.start)*60:0});
  assert.equal(JSON.stringify(full),before,'Compact preview cannot alter approved full-session model');
  assert.equal(preview.nodes.length,full.nodes.length,'Every child and the full layout remain available');
  assert.ok(preview.duration<=full.duration+.001);
  for(const frames of Object.values(preview.tracks))for(const f of frames)assert.ok(f.slice(0,3).every(Number.isFinite)&&f[0]>=0&&f[0]<=preview.duration+.001,'Bounded finite remapped tracks');
  for(const sourcePhase of full.phases.filter(p=>p.kind==='work'))assert.ok(preview.phases.some(p=>p.sourceNames.includes(sourcePhase.name)),'Every actual work interval has a representative action');
  if(task){
   assert.equal(preview.phases.filter(p=>p.kind==='work').length,1,'One complete example, not one animation per child');
   const done=preview.phases.at(-1);for(const frames of Object.values(preview.tracks)){const atActionEnd=F.sample(frames,done.start),atPreviewEnd=F.sample(frames,done.end);assert.deepEqual(atPreviewEnd,atActionEnd,'Finished example holds its final pose instead of jumping to the last child in the old full sequence');}
   const spec=I.build(t,b,index),brief=B.build(t,b,index);assert.equal(spec.parts.length,1);assert.equal(spec.parts[0].kind,'task');assert.equal(spec.parts[0].milliseconds,(b.end-b.start)*60000);
   assert.equal(I.signals(spec.parts).length,6,'Whole-task mode has only five final warnings and completion, never per-attack whistles');
   assert.ok(!/10 s/.test(brief.work+brief.rotation+brief.timing.schedule),'Coach sees no fixed attack countdown');
   const counts=Array.from({length:area.count},()=>({A:0,D:0,R:0}));
   for(let round=0;round<area.count;round++)spec.rotation.roles.forEach((role,i)=>counts[(i+round)%area.count][role]++);
   assert.ok(counts.every(c=>JSON.stringify(c)===JSON.stringify(counts[0])),'A complete circle gives every child the same attack/defence/recovery turns');
   assert.ok(B.phasePlan(preview).every(g=>B.phaseDoses(g).some(d=>d.kind==='task')),'Preview never presents a per-attack seconds dose');
  }else assert.equal(B.phasePlan(preview).flatMap(g=>g.parts).reduce((n,p)=>n+p.actualSeconds,0),full.phases.reduce((n,p)=>n+p.actualSeconds,0),'Full work/rest dose remains visible despite representative playback');
  const coach=B.build(t,b,index);
  assert.ok(coach.steps[0].startsWith('Čo robiť:'));
  assert.ok(coach.steps[1].startsWith('Kedy skončiť:'));
  assert.ok(coach.steps[2].startsWith('Striedanie:'));
  assert.ok(coach.steps[3].startsWith('Oddych:'));
  const schedule=I.build(t,b,index);
  assert.equal(schedule.parts.reduce((sum,p)=>sum+p.milliseconds,0),(b.end-b.start)*60000,'Timer preserves complete approved dose');
  if(b.programKind==='speed'){
    const runs=schedule.parts.filter(p=>p.kind==='work');assert.equal(runs.length,4);
    assert.ok(runs.every(p=>p.milliseconds===60000),'One minute per series includes recovery, no individual sprint countdown');
    assert.equal(runs.filter(p=>p.requiresStart).length,3);
  }
  const peopleClock=new Clock(schedule),initial=I.participantsText(peopleClock,peopleClock.snapshot());
  for(const label of ['Cvičia:','Oddychujú:','Ďalší:'])assert.ok(initial.includes(label),'All three participation rows visible for every drill');
  assert.ok(!/undefined|NaN/.test(initial));
  if(b.programKind==='speed'){
    peopleClock.start(0);const first=schedule.parts[0].milliseconds;const snap=peopleClock.snapshot(first+1);
    const before=I.participantsText(peopleClock,snap);peopleClock.waves[snap.index]=1;
    assert.notEqual(I.participantsText(peopleClock,snap),before,'Manual wave confirmation changes current and next children');
    peopleClock.reset();assert.equal(Object.keys(peopleClock.waves).length,0);
  }
  cases++;
 }}
}
// Exercise the actual UI rotation handler; the whole-task budget includes return and rest.
const t=P.adapt(all.find(t=>t.date==='2026-11-03'),{players:20}),block=t.blocks.find(b=>b.programKind==='two-one'),clock=new Clock(I.build(t,block,0)),nodes=new Map(),handlers={};
const $=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',dataset:{},setAttribute(){},addEventListener:(event,fn)=>handlers[id]=fn});return nodes.get(id);};
const app=read('app.js'),start=app.indexOf('  function updateTimer() {'),end=app.indexOf('  function attendanceCase()',start);
const context={$ ,TrainingIntervals:I,Date:{now:()=>now},state:{selected:t,view:'field'},document:{hidden:false},currentClock:()=>clock,clockKey:()=>t.id+'/'+block.id,clockSignature:()=> 'task',clockText:ms=>{const s=Math.ceil(ms/1000);return`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;},lastTimerState:'',timerVisualKey:'',finishAdvance:null,finishedClockRuns:new WeakSet(),setTimeout(){},clearTimeout(){},window:{FootballBoard:{followInterval(){}},TimerAudio:{cancel(){},update(){},keepAwake(){},status:()=> 'off'}}};clock.signature='task';
const update=vm.runInNewContext(app.slice(start,end)+'\nupdateTimer',context);context.updateTimer=update;
for(const id of ['exercise-rotate','exercise-clock-toggle']){const line=app.split('\n').find(l=>l.includes(`$('${id}').addEventListener`));vm.runInNewContext(line,context);}
update();assert.equal($('exercise-clock-phase').textContent,'Celá úloha · '+block.title);assert.equal($('exercise-rotate').disabled,true);
clock.start(now);now=3700;update();const oldRoles=$('exercise-rotation').textContent;handlers['exercise-rotate']();const remaining=clock.remaining(now);
assert.equal(clock.taskRegroup,true);assert.notEqual(clock.deadline,null);assert.notEqual($('exercise-rotation').textContent,oldRoles);assert.equal($('exercise-clock-toggle').textContent,'Pripravení — pokračovať');
now+=25000;update();assert.equal(clock.remaining(now),remaining-25000,'Return/recovery consumes the whole-task budget, not extra active minutes');handlers['exercise-rotate']();assert.equal(clock.rotationRound,1,'Double tap during regrouping cannot skip children');
const deadline=clock.deadline;handlers['exercise-clock-toggle']();assert.equal(clock.taskRegroup,false);assert.equal(clock.snapshot(now).part.kind,'task');assert.equal(clock.deadline,deadline,'Ready releases roles without restarting or extending the whole task');
clock.pause(now);const paused=clock.remaining(now);now+=600000;assert.equal(clock.remaining(now),paused,'An explicit pause of the whole task still works');
clock.reset();assert.equal(clock.rotationRound,0);assert.equal(clock.taskRegroup,false);
console.log(`PASS: ${cases} representative previews, complete doses/layouts, whole-task duels, fair role circles, manual regrouping and double-tap protection.`);
