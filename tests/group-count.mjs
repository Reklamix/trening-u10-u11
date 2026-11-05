import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','interval-timer.js','training-programs.js','training-load.js'];
const api=vm.runInNewContext(files.map(name=>read(name).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0].split('// TIMER_AUDIO_BROWSER')[0]).join('\n')+';({C:TrainingCalendar,P:TrainingPlanner,F:FootballScenes,S:FootballSequences,B:ExerciseBrief,U:PitchSetupPlan,I:TrainingIntervals,G:SessionPrograms})',{performance:{now:()=>0}});
const {C,P,F,S,B,U,I,G}=api,raw=JSON.parse(read('trainings.json')),before=JSON.stringify(raw),all=C.expand(raw,JSON.parse(read('upcoming.json'))).trainings;
let cases=0;
for(const players of Array.from({length:21},(_,i)=>i+10))for(const pitch of ['quarter','half','full']){
 const expected=players<=12?2:players<=18?3:4;
 for(const source of all.filter(t=>G.supports(t))){
  const t=P.adapt(source,{players,pitch,levels:['base','standard','challenge','standard'],groupMode:'auto'}),prep=U.forExercises(t);
  assert.equal(t.planConfig.groupSizes.length,expected);assert.equal(t.planConfig.groupSizes.reduce((a,b)=>a+b,0),players);
  for(const [i,b] of t.blocks.entries()){
   const areas=F.groups(b.diagram,players,t.quarterPitch),step=prep.steps[i];
   if(!['finish','large-game','warm'].includes(b.programKind))assert.equal(areas.length,expected,'No phantom fourth station');
   if(b.programKind==='warm')assert.equal(areas.length,expected===4?2:expected);
   if(areas.length)assert.equal(areas.reduce((sum,a)=>sum+a.count,0),players);
   for(const [j,a] of areas.entries()){
    assert.ok(a.x>=2-1e-8&&a.y>=2-1e-8&&a.x+a.w<=t.planConfig.width-2+1e-8&&a.y+a.h<=t.planConfig.height-2+1e-8,'2 m perimeter');
    for(const other of areas.slice(j+1)){const dx=Math.max(a.x-other.x-other.w,other.x-a.x-a.w),dy=Math.max(a.y-other.y-other.h,other.y-a.y-a.h);assert.ok(dx>=3-1e-8||dy>=3-1e-8,'3 m clear separation');}
    const scene=F.build(b.diagram,{area:a,total:players,size:a.count,pitchIndex:j}),sequence=S.build(t,b,j,scene),brief=B.build(t,b,j),timer=I.build(t,b,j);
    assert.equal(scene.nodes.filter(n=>n.kind==='player').length,a.count);assert.equal(sequence.nodes.filter(n=>n.kind==='player').length,a.count);
    assert.equal(timer.parts.reduce((sum,p)=>sum+p.milliseconds,0),(b.end-b.start)*60000,'Group changes cannot change the approved block duration');
    assert.ok(!JSON.stringify(brief).includes('undefined'),'No stale fourth group in instructions');
   }
   if(b.programKind!=='finish'){
    assert.equal(step.map.areas.length,areas.length,'Preparation and exercise share the same number of areas');
    assert.equal(step.map.cones.length,G.cones(t,b).length,'Preparation and exercise share the same cones');
    for(const point of step.map.cones)assert.ok(point.x>=2-1e-8&&point.y>=2-1e-8&&point.x<=t.planConfig.width-2+1e-8&&point.y<=t.planConfig.height-2+1e-8);
   }
  }
  cases++;
 }
}
const thu=all.find(t=>t.id==='2026-11-05');
assert.equal(P.normalize({players:16,groupSizes:[4,4,4,4]}).groupSizes.join(','),'6,5,5','Migrate the old automatic four-group default');
for(const count of [2,3,4]){
 const c=P.regroup(thu.planConfig,P.groups(16,count));assert.equal(c.groupMode,'manual');assert.equal(P.normalize(JSON.parse(JSON.stringify(c))).groupSizes.length,count,'Manual count survives storage and shared links');
 const t=P.adapt(thu,c);assert.equal(U.forExercises(t).steps[1].map.areas.length,count);
}
assert.equal(P.regroup(thu.planConfig,[9,7]),null,'Unsupported local group sizes cannot be applied');
assert.equal(P.normalize({players:12,levels:['base','base','standard','standard']}).levels.join(','),'base,standard','Reducing four groups to two retains both skill streams');
assert.equal(JSON.stringify(raw),before,'Archived source data stays unchanged');
console.log(`PASS: ${cases} automatic count/pitch/program layouts; geometry, all children, animation, preparation/kit/timer consistency, migration and manual 2/3/4 group persistence.`);
