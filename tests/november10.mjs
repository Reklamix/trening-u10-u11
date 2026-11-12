import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
let now=0;
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','interval-timer.js','training-programs.js','training-load.js'];
const code=files.map(f=>read(f).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0].split('// TIMER_AUDIO_BROWSER')[0]).join('\n');
const {C,P,F,S,B,I,N,U,Clock}=vm.runInNewContext(code+';({C:TrainingCalendar,P:TrainingPlanner,F:FootballScenes,S:FootballSequences,B:ExerciseBrief,I:TrainingIntervals,N:November10Program,U:PitchSetupPlan,Clock:IntervalClock})',{performance:{now:()=>0},Date:class extends Date{static now(){return now;}}});
const all=C.expand(JSON.parse(read('trainings.json')),JSON.parse(read('upcoming.json'))).trainings,source=all.find(t=>t.date==='2026-11-10');
assert.equal(source.planning.status,'ready');assert.equal(source.defaultConfig.keepers,0);assert.equal(source.defaultConfig.coaches,1);assert.equal(source.duration,75);
assert.deepEqual(Array.from(source.blocks,b=>b.end),[10,16,28,40,54,72,75]);assert.equal(all.find(t=>t.date==='2026-11-12').planning.status,'ready');
let scenes=0;
for(const keepers of[2,3])for(const players of[10,16,20,24,30])for(const pitch of['quarter','half','full']){
 const t=P.adapt(source,{...source.defaultConfig,coaches:2,keepers,players,pitch,...P.pitches[pitch],groupSizes:P.groups(players)});
 assert.equal(t.keepers,keepers);assert.equal(t.planConfig.keepers,keepers);assert.equal(t.players.includes(`${players-keepers} do poľa`),true);
 assert.equal(P.normalize(t.planConfig).keepers,keepers);assert.equal(P.resize(t.planConfig,{pitch,width:t.planConfig.width,height:t.planConfig.height}).keepers,keepers);assert.equal(P.regroup(t.planConfig,t.planConfig.groupSizes).keepers,keepers);
 const prep=U.forExercises(t);assert.equal(prep.steps.length,7);assert.ok(!t.organizationNotes.some(v=>v.startsWith('Tréner 3')));
 for(const b of t.blocks){const areas=N.areas(t,b);assert.equal(areas.reduce((s,a)=>s+a.count,0),players);assert.equal(new Set(areas.flatMap(a=>a.playerLabels)).size,players);
  for(const[index,area]of areas.entries()){
   const base=F.build(b.diagram,{area,total:players,size:area.count}),seq=S.build(t,b,index,base),brief=B.build(t,b,index),spec=I.build(t,b,index);
   assert.equal(base.nodes.filter(n=>n.kind==='player').length,area.count);assert.equal(seq.nodes.filter(n=>n.kind==='player').length,area.count);
   assert.equal(seq.phases.reduce((s,p)=>s+(p.actualSeconds||0),0),(b.end-b.start)*60);assert.equal(spec.parts.reduce((s,p)=>s+p.milliseconds,0),(b.end-b.start)*60000);
   assert.ok(Array.isArray(brief.coaches)&&brief.coaches.length===2);assert.ok(brief.timing.total&&brief.timing.repetitions.value);assert.ok(!/undefined|NaN/.test(JSON.stringify(brief)));
   for(const frames of Object.values(seq.tracks)){let prev=-1;for(const f of frames){assert.ok(f.slice(0,3).every(Number.isFinite));assert.ok(f[0]>=prev&&f[0]<=seq.duration+.001);prev=f[0];}}
   const preview=S.representative(seq,{taskDuration:b.programKind==='duel'?720:0});assert.equal(preview.nodes.length,seq.nodes.length);
   if(['large-game','rondo'].includes(b.programKind))for(const phase of seq.phases.filter(p=>p.kind!=='end')){const shown=preview.phases.find(p=>p.sourceNames.includes(phase.name));assert.ok(shown);for(const[id,role]of Object.entries(phase.roles))if(id.startsWith('child'))assert.equal(shown.roles[id].label,role.label,'Compact animation preserves roles during work and rest');}
   for(const c of base.cones)assert.ok(c.x>=base.pitch.x-.001&&c.x<=base.pitch.x+base.pitch.w+.001&&c.y>=base.pitch.y-.001&&c.y<=base.pitch.y+base.pitch.h+.001);
   if(b.programKind==='rondo'&&area.count===5){const work=seq.phases.filter(p=>p.kind==='work');assert.equal(work.length,10);for(let child=0;child<5;child++){assert.equal(work.filter(p=>p.roles['child'+child].role==='defender').reduce((s,p)=>s+p.actualSeconds,0),90);assert.ok(work.every(p=>Object.values(p.roles).filter(r=>r.role==='defender').length===1));}assert.equal(seq.phases.filter(p=>p.kind==='rest').reduce((s,p)=>s+p.actualSeconds,0),150);}
   if(b.programKind==='zones'&&area.count>=3){const work=seq.phases.filter(p=>p.kind==='work');assert.ok(work.every(p=>Object.values(p.roles).filter(r=>r.role==='neutral').length===1));if(area.count===5)for(let child=0;child<5;child++)assert.equal(work.filter(p=>p.roles['child'+child].role==='neutral').reduce((s,p)=>s+p.actualSeconds,0),120);}
   if(b.programKind==='speed'){const work=spec.parts.filter(p=>p.kind==='work');assert.equal(work.length,3);assert.ok(work.every(p=>p.milliseconds===90000));assert.equal(spec.speedLanes,1);assert.ok(N.distance(area)+6+1<=area.length);}
   if(b.programKind==='duel'){assert.deepEqual(Array.from(spec.parts,p=>[p.kind,p.milliseconds]),[['setup',60000],['task',540000],['water',120000]]);assert.equal(spec.rotation.maxRounds,area.count*2);for(let child=0;child<area.count;child++){assert.equal(spec.rotation.pairs.filter(p=>p[0]===child).length,2);assert.equal(spec.rotation.pairs.filter(p=>p[1]===child).length,2);}}
   scenes++;
  }
 }
 const game=t.blocks.find(b=>b.programKind==='large-game'),areas=N.areas(t,game),dose=Object.fromEntries(N.keeperLabels(keepers).map(k=>[k,{goal:0,feet:0}]));
 for(let r=0;r<6;r++){const rosters=areas.map(a=>N.roster(a,r)),people=rosters.flat();assert.equal(people.length,players);assert.equal(new Set(people).size,players);for(const[k]of Object.entries(dose)){assert.equal(people.filter(p=>p===k).length,1);dose[k][rosters[0].includes(k)?'goal':'feet']+=2.5;}if(players===20)assert.deepEqual(Array.from(rosters,r=>r.length),[10,10]);}
 for(const d of Object.values(dose))assert.deepEqual(d,keepers===2?{goal:15,feet:0}:{goal:10,feet:5});
 if(players===20&&pitch==='half')assert.equal(t.equipment[1].quantity,'40 pracovných + 8 rezervných = 48 mét');
}
for(const keepers of[0,1,2,3]){
 const t=P.adapt(source,{...source.defaultConfig,players:10,coaches:1,keepers});assert.equal(t.compact,true);assert.equal(t.duration,75);assert.equal(t.blocks.at(-1).end,75);assert.ok(!t.blocks.some(b=>b.programKind==='speed'));assert.equal(t.organizationNotes.filter(n=>n.startsWith('Tréner')).length,1);
 for(const b of t.blocks){const areas=N.areas(t,b);assert.equal(new Set(areas.flatMap(a=>a.playerLabels)).size,10);assert.equal(areas.reduce((s,a)=>s+a.count,0),10);for(const [index,area]of areas.entries()){const base=F.build(b.diagram,{area}),seq=S.build(t,b,index,base),brief=B.build(t,b,index),timer=I.build(t,b,index);assert.equal(base.nodes.filter(n=>n.kind==='player').length,area.count);assert.equal(seq.phases.reduce((s,p)=>s+(p.actualSeconds||0),0),(b.end-b.start)*60);assert.equal(timer.parts.reduce((s,p)=>s+p.milliseconds,0),(b.end-b.start)*60000);assert.equal(brief.coaches.length,1);assert.ok(!/undefined|NaN/.test(JSON.stringify(brief)));if(b.programKind==='ball-control'){assert.equal(base.nodes.filter(n=>n.kind==='ball').length,5);assert.equal(timer.parts.filter(p=>p.kind==='work').length,3);}if(b.programKind==='large-game'){assert.equal(areas.length,1);assert.equal(area.count,10);assert.equal(base.nodes.filter(n=>n.goalkeeper).length,0);assert.equal(timer.parts.filter(p=>p.kind==='work').reduce((s,p)=>s+p.milliseconds,0),720000);assert.ok(timer.parts.filter(p=>p.kind==='work').every(p=>p.milliseconds===120000));}}
 }
 assert.equal(t.equipment[0].quantity,'10 + 4 rezervné = 14 lôpt');assert.equal(t.equipment[1].quantity,'16 pracovných + 8 rezervných = 24 mét');
}
const duel=source.blocks.find(b=>b.programKind==='duel'),spec=I.build(source,duel,0),clock=new Clock(spec);now=0;clock.start(now);now=60000;clock.snapshot(now);assert.equal(clock.waiting,true);assert.equal(N.advanceDuel(clock,now),false);clock.start(now);now+=5000;assert.equal(clock.snapshot(now).part.kind,'task');
for(let i=0;i<10;i++){now+=8000;assert.equal(N.advanceDuel(clock,now),true);if(i<9){const rest=(i+1)%5===0?60000:20000;assert.equal(N.canConfirmDuel(clock,now+rest-1),false);assert.equal(N.advanceDuel(clock,now+rest),false,'Waiting for explicit coach confirmation');now+=rest;assert.equal(N.canConfirmDuel(clock,now),true);clock.taskRegroup=false;}}
assert.equal(clock.rotationRound,10);assert.equal(N.advanceDuel(clock,now),false);assert.match(N.rotationDescription(clock,clock.snapshot(now)),/okruhy dokončené/);clock.reset();assert.equal(clock.recoveryUntil,0);assert.equal(clock.duelStopped,false);
now=0;clock.start(now);now=60000;clock.snapshot(now);clock.start(now);now=65000+310000;clock.rotationRound=4;assert.equal(N.advanceDuel(clock,now),true);assert.equal(clock.duelStopped,true,'Do not begin another circle without its recovery and at least four minutes');
console.log(JSON.stringify({november10:'PASS',scenes,legacyMinutes:80,smallGroupMinutes:75,smallGroupKeeperVariants:[0,1,2,3],keeperVariants:[2,3],rondoFair:true,oneNeutral:true,duelRecovery20And60Seconds:true,earlyStop:true,otherDates:'verified separately'}));
