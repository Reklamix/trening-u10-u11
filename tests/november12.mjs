import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
let now=0;
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','interval-timer.js','training-programs.js','training-load.js'];
const code=files.map(f=>read(f).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0].split('// TIMER_AUDIO_BROWSER')[0]).join('\n');
const {C,P,F,S,B,I,N,U,Clock}=vm.runInNewContext(code+';({C:TrainingCalendar,P:TrainingPlanner,F:FootballScenes,S:FootballSequences,B:ExerciseBrief,I:TrainingIntervals,N:November12Program,U:PitchSetupPlan,Clock:IntervalClock})',{performance:{now:()=>0},Date:class extends Date{static now(){return now;}}});
const source=C.expand(JSON.parse(read('trainings.json')),JSON.parse(read('upcoming.json'))).trainings.find(t=>t.date==='2026-11-12');
assert.equal(source.planning.status,'ready');assert.equal(source.defaultConfig.pitch,'quarter');assert.equal(source.defaultConfig.coaches,2);
assert.deepEqual(Array.from(source.blocks,b=>b.end),[10,18,30,42,56,77,80]);
let scenes=0;
for(const players of[15,16,17,18])for(const pitch of['quarter','half','full']){
 const t=P.adapt(source,{...source.defaultConfig,players,pitch,...P.pitches[pitch],groupMode:'auto'});
 assert.equal(t.duration,80);assert.equal(t.planConfig.groupSizes.reduce((s,n)=>s+n,0),players);
 assert.deepEqual(Array.from(t.planConfig.groupSizes),({15:[5,5,5],16:[5,5,6],17:[5,6,6],18:[6,6,6]})[players]);
 assert.equal(JSON.stringify(P.adapt(t,t.planConfig)),JSON.stringify(t),'Date adaptation is idempotent');
 const prep=U.forExercises(t);assert.equal(prep.steps.length,7);
 for(const b of t.blocks){
  const areas=N.areas(t,b),people=areas.flatMap(a=>a.playerLabels);
  assert.equal(people.length,players);assert.equal(new Set(people).size,players);
  for(const [index,a]of areas.entries()){
   assert.ok(a.x>=2&&a.y>=2&&a.x+a.w<=t.planConfig.width-2+.001&&a.y+a.h<=t.planConfig.height-2+.001);
   const base=F.build(b.diagram,{area:a}),seq=S.build(t,b,index,base),brief=B.build(t,b,index),timer=I.build(t,b,index),work=seq.phases.filter(p=>p.kind==='work');
   assert.equal(base.nodes.filter(n=>n.kind==='player').length,a.count);
   assert.equal(seq.phases.reduce((s,p)=>s+(p.actualSeconds||0),0),(b.end-b.start)*60);
   assert.equal(timer.parts.reduce((s,p)=>s+p.milliseconds,0),(b.end-b.start)*60000);
   assert.ok(!/undefined|NaN|ukotvené brány|3 m priechod/.test(JSON.stringify(brief)));assert.equal(brief.coaches.length,2);
   const preview=S.representative(seq,{taskDuration:b.programKind==='duel'?720:0});
   for(const frames of Object.values(seq.tracks)){let prev=-1;for(const f of frames){assert.ok(f.slice(0,3).every(Number.isFinite));assert.ok(f[0]>=prev&&f[0]<=seq.duration+.001);prev=f[0];}}
   for(const c of base.cones)assert.ok(c.x>=base.pitch.x-.001&&c.x<=base.pitch.x+base.pitch.w+.001&&c.y>=base.pitch.y-.001&&c.y<=base.pitch.y+base.pitch.h+.001);
   for(const part of seq.phases.filter(p=>p.kind==='work'&&['rondo','zones','large-game'].includes(b.programKind))){const shown=preview.phases.find(p=>p.sourceNames.includes(part.name));assert.ok(shown);for(const[id,r]of Object.entries(part.roles))if(id.startsWith('child')){assert.equal(shown.roles[id].role,r.role);assert.equal(shown.roles[id].team,r.team);}}
   if(b.programKind==='warm'){
    const pairs=seq.phases.find(p=>p.name==='Prihrávka a nová ponuka');assert.equal(Object.entries(pairs.roles).filter(([id,r])=>id.startsWith('ball')&&r.visible).length,a.count===5?2:2);
   }
   if(b.programKind==='speed'){assert.equal(N.distance(a),8);assert.ok(N.distance(a)+5+.5<=a.width);assert.equal(timer.speedLanes,1);assert.equal(work.length,4);assert.ok(work.every(p=>p.actualSeconds===90));}
   if(b.programKind==='rondo'){
    assert.equal(work.length,a.count*2);assert.ok(work.every(p=>p.actualSeconds===(a.count===5?45:35)));
    for(let i=0;i<a.count;i++)assert.equal(work.filter(p=>p.roles['child'+i].role==='defender').length,2);
   }
   if(b.programKind==='duel'){
    assert.equal(timer.rotation.protocol,'november10');assert.equal(timer.rotation.maxRounds,a.count*2);
    for(let i=0;i<a.count;i++){assert.equal(timer.rotation.pairs.filter(p=>p[0]===i).length,2);assert.equal(timer.rotation.pairs.filter(p=>p[1]===i).length,2);}
   }
   if(b.programKind==='zones'){
    assert.ok(work.every(p=>Object.values(p.roles).filter(r=>r.role==='neutral').length===1));
    assert.ok(work.every(p=>Object.values(p.roles).filter(r=>r.role==='rest').length===(a.count===6?1:0)));
    for(let i=0;i<a.count;i++){
     assert.equal(work.filter(p=>p.roles['child'+i].role==='neutral').reduce((s,p)=>s+p.actualSeconds,0),a.count===5?120:100);
     assert.equal(work.filter(p=>p.roles['child'+i].role!=='rest').reduce((s,p)=>s+p.actualSeconds,0),a.count===5?600:500);
    }
   }
   if(b.programKind==='large-game'){
    assert.equal(base.nodes.filter(n=>n.goalkeeper).length,0);assert.equal(base.cones.filter(c=>c.kind==='gate').length,4);
    for(let i=0;i<a.count;i++)assert.equal(work.filter(p=>p.roles['child'+i].role!=='rest').reduce((s,p)=>s+p.actualSeconds,0),900);
    assert.ok(work.every(p=>Object.values(p.roles).filter(r=>r.role==='neutral').length===a.count%2));
    assert.equal(timer.parts.filter(p=>p.kind==='rest').length,4);
   }
   scenes++;
  }
 }
 assert.deepEqual(Array.from(N.areas(t,t.blocks[5]),a=>a.count),({15:[8,7],16:[8,8],17:[8,9],18:[9,9]})[players]);
 assert.equal(t.equipment[1].quantity,'30 pracovných + 6 rezervných = 36 mét');
}
for(const players of[15,18]){
 const t=P.adapt(source,{...source.defaultConfig,players}),b=t.blocks[3],index=players===15?0:2,clock=new Clock(I.build(t,b,index)),n=N.areas(t,b)[index].count;
 now=0;clock.start(now);now=60000;clock.snapshot(now);clock.start(now);now+=5000;
 for(let i=0;i<n*2;i++){now+=5000;assert.equal(N.advanceDuel(clock,now),true);if(i<n*2-1){const rest=(i+1)%n===0?60000:20000;assert.equal(N.canConfirmDuel(clock,now+rest-1),false);now+=rest;assert.equal(N.canConfirmDuel(clock,now),true);clock.taskRegroup=false;}}
 assert.equal(clock.rotationRound,n*2);assert.equal(N.advanceDuel(clock,now),false);clock.reset();assert.equal(clock.recoveryUntil,0);
}
console.log(JSON.stringify({november12:'PASS',scenes,counts:[15,16,17,18],minutes:80,rondoEqualDefenderTurns:true,oneNeutral:true,sixPlayersOneRotatingRest:true,finalActiveMinutes:15,duelRecoverySeconds:[20,60],otherDates:'separate complete-model preservation check'}));
