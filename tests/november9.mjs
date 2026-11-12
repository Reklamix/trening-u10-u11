import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','interval-timer.js','training-programs.js','training-load.js'];
const code=files.map(f=>read(f).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0].split('// TIMER_AUDIO_BROWSER')[0]).join('\n');
const api=runInNewContext(code+';({C:TrainingCalendar,P:TrainingPlanner,F:FootballScenes,S:FootballSequences,B:ExerciseBrief,I:TrainingIntervals,Clock:IntervalClock,G:SessionPrograms,N:November9Program,U:PitchSetupPlan})',{performance:{now:()=>0}});
const {C,P,F,S,B,I,Clock,G,N,U}=api;
const all=C.expand(JSON.parse(read('trainings.json')),JSON.parse(read('upcoming.json'))).trainings;
const source=all.find(t=>t.date==='2026-11-09');
assert.equal(source.planning.status,'ready');assert.equal(source.defaultConfig.coaches,3);
assert.equal(source.planConfig.players,20);assert.equal(source.duration,80);
assert.deepEqual(Array.from(source.blocks,b=>b.end),[10,18,30,41,54,77,80]);
assert.equal(JSON.stringify(all.find(t=>t.date==='2026-11-12').planning.status),'"ready"');
assert.equal(source.equipment[1].quantity,'40 pracovných + 8 rezervných = 48 mét');
const defaultGroups=b=>N.areas(source,b).map(a=>a.count);
assert.deepEqual(Array.from(defaultGroups(source.blocks[2])),[6,6,5,3]);
assert.deepEqual(Array.from(defaultGroups(source.blocks[5])),[10,10]);
assert.match(N.rotation(source,source.blocks[0],0),/3 min/);
assert.ok(!/5 min/.test(N.rotation(source,source.blocks[0],0)),'Warm-up rotation describes its own three-minute game');
let checked=0;
for(const players of[10,16,20,24,30])for(const pitch of['quarter','half','full']){
 const t=P.adapt(source,{...source.defaultConfig,players,pitch,width:P.pitches[pitch].width,height:P.pitches[pitch].height,groupSizes:P.groups(players)});
 assert.equal(t.duration,80);assert.equal(t.planConfig.players,players);
 const prep=U.forExercises(t);assert.equal(prep.steps.length,7);
 for(const b of t.blocks){
  const areas=N.areas(t,b);assert.equal(areas.reduce((s,a)=>s+a.count,0),players,'Every child assigned once per block');
  const labels=areas.flatMap(a=>a.playerLabels);assert.equal(new Set(labels).size,players);for(const g of['G1','G2','G3'])assert.equal(labels.filter(x=>x===g).length,1);
  for(const [index,area]of areas.entries()){
   assert.ok(area.x>=0&&area.y>=0&&area.x+area.w<=t.planConfig.width+.001&&area.y+area.h<=t.planConfig.height+.001);
   const base=F.build(b.diagram,{area,size:area.count,total:players,pitchIndex:index});
   const scene=S.build(t,b,index,base),brief=B.build(t,b,index),spec=I.build(t,b,index);
   assert.equal(scene.phases.reduce((s,p)=>s+p.actualSeconds,0),(b.end-b.start)*60);
   assert.equal(spec.parts.reduce((s,p)=>s+p.milliseconds,0),(b.end-b.start)*60000);
   assert.equal(scene.nodes.filter(n=>n.kind==='player').length,area.count);
   for(const frames of Object.values(scene.tracks)){let previous=-1;for(const f of frames){assert.ok(f.slice(0,3).every(Number.isFinite));assert.ok(f[0]>=previous&&f[0]<=scene.duration+.001,'Monotonic finite animation');previous=f[0];}}
   const preview=S.representative(scene,{taskDuration:b.programKind==='duel'?(b.end-b.start)*60:0});
   assert.equal(preview.nodes.length,scene.nodes.length);for(const frames of Object.values(preview.tracks))for(const f of frames)assert.ok(f[0]>=0&&f[0]<=preview.duration+.001);
   assert.ok(brief.description&&brief.rotation&&brief.kit.length&&brief.visualKit.length);
   assert.ok(Array.isArray(brief.coaches)&&brief.coaches.length,'Coach instructions satisfy the exercise card contract');
   assert.ok(brief.timing.total&&brief.timing.repetitions.value&&brief.timing.repetitions.hint,'The card can render the complete dose');
   assert.equal(brief.timing.totalMinutes,b.end-b.start);assert.equal(brief.conesLocal,base.cones.length);
   for(const c of base.cones)assert.ok(c.x>=base.pitch.x-.001&&c.x<=base.pitch.x+base.pitch.w+.001&&c.y>=base.pitch.y-.001&&c.y<=base.pitch.y+base.pitch.h+.001);
   const variant=P.forGroup(t,b,index);assert.ok(variant.tables.length);for(const table of variant.tables)for(const row of table.rows)assert.equal(row.length,table.headers.length);
   if(b.programKind==='duel'){
    assert.equal(spec.parts.length,1);assert.equal(spec.parts[0].kind,'task');assert.equal(spec.parts[0].milliseconds,660000);assert.equal(spec.rotation.lanes,1);
    const pairs=spec.rotation.pairs;for(let child=0;child<area.count;child++){assert.equal(pairs.filter(p=>p[0]===child).length,pairs.length/area.count);assert.equal(pairs.filter(p=>p[1]===child).length,pairs.length/area.count);}
    assert.ok(!/10 s/.test(brief.work+brief.rotation+brief.timing.schedule),'No fixed individual attack countdown');
    const clock=new Clock(spec);clock.start(0);assert.match(I.participantsText(clock,clock.snapshot(0)),/útok/);clock.rotationRound=clock.rotation.maxRounds;assert.match(I.participantsText(clock,clock.snapshot(0)),/okruhy dokončené/);
   }
   if(b.programKind==='speed'){
    assert.equal(spec.speedLanes,1);const work=spec.parts.filter(p=>p.kind==='work');assert.equal(work.length,4);assert.ok(work.every(p=>p.milliseconds===100000));
    const clock=new Clock(spec);clock.start(0);const snap=clock.snapshot(60000);assert.match(I.participantsText(clock,snap),/Cvičia: 1\n/,'One runner, not a pair');
   }
   if(b.programKind==='zones'&&area.count===5){const work=scene.phases.filter(p=>p.kind==='work');for(let i=0;i<5;i++)assert.equal(work.filter(p=>p.roles['child'+i].team==='N').length,2);}
   checked++;
  }
 }
}
const game=source.blocks.find(b=>b.programKind==='large-game'),left=N.areas(source,game)[0],right=N.areas(source,game)[1];
const minutes={G1:0,G2:0,G3:0};
for(let r=0;r<5;r++){
 const a=N.roster(left,r),b=N.roster(right,r);assert.equal(new Set([...a,...b]).size,20);assert.equal(a.length+b.length,20);
 for(const g of a.filter(x=>x.startsWith('G')))minutes[g]+=3;
 const scene=N.scene(game.diagram,{area:right,round:r});assert.ok(scene.nodes.find(x=>x.label===b[4]).team==='A','Third keeper is fifth player of first field quartet');
}
assert.deepEqual(minutes,{G1:12,G2:9,G3:9});
const gkArea=N.areas(source,source.blocks[2]).find(a=>a.keeperPractice),gk=S.build(source,source.blocks[2],gkArea.index,F.build('football-pass',{area:gkArea}));
for(const area of N.areas(source,source.blocks[2]).filter(a=>!a.keeperPractice))for(let round=0;round<3;round++){
 const scene=N.scene('football-pass',{area,round});
 for(const members of N.pairPods(area.count,round))for(let i=0;i<members.length;i++){
  const from=scene.nodes.find(n=>n.id==='child'+members[i]),to=scene.nodes.find(n=>n.id==='child'+members[(i+1)%members.length]);
  assert.ok(scene.arrows.some(a=>a.points[0].x===from.x&&a.points[0].y===from.y&&a.points[1].x===to.x&&a.points[1].y===to.y),'Animation passes between the partners assigned in this series');
 }
}
assert.equal(gk.phases.filter(p=>p.kind==='work').length,9);assert.equal(gk.phases.filter(p=>p.kind==='rest').reduce((s,p)=>s+p.actualSeconds,0),60);
const speedSpec=I.build(source,source.blocks[1],0),clock=new Clock(speedSpec);clock.start(0);clock.snapshot(160000);assert.equal(clock.waiting,true,'Coach starts next series');clock.start(160000);assert.equal(clock.snapshot(160000).part.kind,'ready');clock.reset();assert.equal(clock.trainingTotal,480000);
console.log(JSON.stringify({november9:'PASS',groupScenes:checked,minutes:80,children:20,keepers:3,keeperGoalMinutes:minutes,otherDates:'checked separately against pre-change snapshots'}));
