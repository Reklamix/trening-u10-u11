import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','interval-timer.js','training-programs.js'];
const code=files.map(f=>read(f).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0].split('// TIMER_AUDIO_BROWSER')[0]).join('\n');
const api=runInNewContext(code+';({TrainingCalendar,TrainingPlanner,FootballScenes,FootballSequences,ExerciseBrief,PitchSetupPlan,TrainingIntervals,IntervalClock,SessionPrograms,TrainingLibrary})',{performance:{now:()=>0}});
const {TrainingCalendar:C,TrainingPlanner:P,FootballScenes:F,FootballSequences:S,ExerciseBrief:B,PitchSetupPlan:U,TrainingIntervals:I,IntervalClock,SessionPrograms:G,TrainingLibrary:L}=api;
const original=JSON.parse(read('trainings.json')),agenda=JSON.parse(read('upcoming.json')),saved=JSON.stringify(original),expanded=C.expand(original,agenda),programs=expanded.trainings.filter(G.supports.bind(G));
assert.equal(JSON.stringify(original),saved);assert.equal(programs.length,2);
assert.equal(expanded.trainings.filter(t=>t.planning?.status==='draft').length,4);
let scenes=0;
for(const source of programs){
 assert.equal(source.planning.status,'ready');
 const expected=source.date==='2026-11-02'?[10,22,36,52,72,75]:[10,22,38,54,72,75];
 assert.deepEqual(Array.from(source.blocks,b=>b.end),expected);
 for(const players of [10,14,19,20,22,24,26,30])for(const pitch of ['quarter','half','full'])for(const level of ['base','standard','challenge']){
  const t=P.adapt(source,{...source.defaultConfig,players,pitch,width:P.pitches[pitch].width,height:P.pitches[pitch].height,groupSizes:P.groups(players),levels:[level,level,level,level]});
  assert.equal(t.blocks.at(-1).end,75);assert.equal(t.duration,75);
  assert.equal(t.planConfig.groupSizes.reduce((a,b)=>a+b,0),players);
  const prep=U.forExercises(t);assert.equal(prep.steps.length,6);
  for(const [i,b]of t.blocks.entries()){
   const areas=F.groups(b.diagram,players,t.quarterPitch);
   for(let j=0;j<Math.max(1,areas.length);j++){
    const area=areas[j],base=F.build(b.diagram,{total:players,size:area?.count,pitchIndex:j,area});
    const scene=S.build(t,b,j,base),brief=B.build(t,b,j),timer=I.build(t,b,j);
    assert.equal(scene.phases.reduce((a,p)=>a+p.actualSeconds,0),(b.end-b.start)*60,`${t.date}/${players}/${level}/${b.programKind}/${j}: all phases match block`);
    assert.equal(timer.parts.reduce((a,p)=>a+p.milliseconds,0),(b.end-b.start)*60000);
    assert.ok(scene.phases.every(p=>Number.isFinite(p.actualSeconds)&&p.actualSeconds>=0));
    const nodes=scene.nodes.filter(n=>n.kind==='player');assert.equal(nodes.length,area?.count||players,'Every child present exactly once');
    assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);
    assert.ok(brief.description&&brief.steps.every(s=>typeof s==='string'&&s.length));
    assert.equal(brief.timing.totalMinutes,b.end-b.start);
    if(area){
     assert.equal(brief.conesLocal,base.cones.length);assert.equal(brief.conesTotal,G.cones(t,b).length);
     for(const cone of base.cones){assert.ok(cone.x>=base.pitch.x-.01&&cone.x<=base.pitch.x+base.pitch.w+.01);assert.ok(cone.y>=base.pitch.y-.01&&cone.y<=base.pitch.y+base.pitch.h+.01);}
     for(const track of Object.values(scene.tracks))for(const f of track)assert.ok(f.slice(0,3).every(Number.isFinite),'Finite animation frames');
     for(const table of b.tables||[])for(const row of table.rows)assert.equal(row.length,table.headers.length,'Complete rotation tables');
    }
    if(['duel','two-one'].includes(b.programKind)){
     const n=area.count,work=scene.phases.filter(p=>p.kind==='work'),roles=nodes.map(node=>{const r={A:0,B:0,N:0};work.forEach(p=>r[p.roles[node.id].team]++);return r;});
     assert.ok(roles.every(r=>JSON.stringify(r)===JSON.stringify(roles[0])),'Balanced attack/defence/rest for every child');
     const d=G.duelDose(n);assert.equal(work.length,d.cycles*n);assert.equal(timer.parts.filter(p=>p.requiresStart).length,d.cycles-1,'Only next series requires manual start');
     if(n===5){assert.equal(roles[0].A,8);assert.equal(roles[0].B,b.programKind==='duel'?8:4);assert.equal(roles[0].N,b.programKind==='duel'?4:8);}
     const table=b.tables.find(v=>v.groupSize===n);
     for(const [k,row]of table.rows.entries())for(const [column,team]of [[1,'A'],[2,'B'],[3,'N']]){
      const shown=row[column]==='—'?[]:row[column].split(', ').map(Number);
      const animated=nodes.filter(node=>work[k].roles[node.id].team===team).map(node=>Number(work[k].roles[node.id].label.replace(/\D/g,'')));
      assert.deepEqual(Array.from(animated).sort((a,b)=>a-b),Array.from(shown).sort((a,b)=>a-b),'Table and animated roles agree');
     }
    }
    if(['zones','game'].includes(b.programKind)){
     const work=scene.phases.filter(p=>p.kind==='work'),n=area.count,neutralTimes=nodes.map(node=>work.reduce((sum,p)=>sum+(p.roles[node.id].team==='N'?p.actualSeconds:0),0));
     assert.ok(neutralTimes.every(v=>Math.abs(v-neutralTimes[0])<1e-6),'Equal neutral minutes');
     assert.equal(timer.parts.filter(p=>p.requiresStart).length,b.programKind==='zones'?1:2);
     if(n<=3)assert.equal(work.reduce((sum,p)=>sum+p.actualSeconds,0),(b.programKind==='zones'?2:3)*180,'Small groups have additional rest');
    }
    scenes++;
   }
   if(i<5)assert.equal(prep.steps[i].map.cones.length,G.cones(t,b).length);
  }
  const max=Math.max(...t.blocks.map(b=>G.cones(t,b).length));assert.ok(t.equipment[1].quantity.includes(String(max+8)));
  for(const step of prep.steps){assert.equal(step.total,step.kept.length+step.moves.length+step.added.length);for(const p of step.map.cones)assert.ok(p.x>=0&&p.x<=t.planConfig.width&&p.y>=0&&p.y<=t.planConfig.height);}
 }
}
// Date library uses the actual new content rather than the inherited diagram slot.
assert.ok(L.filter(expanded.trainings,{topic:'duels',mode:'drills'}).some(i=>i.training.date==='2026-11-03'&&i.block.programKind==='duel'));
assert.throws(()=>C.expand(original,{...agenda,sessions:[{...agenda.sessions[0],programId:'unknown'}]}));
// Representative interval crosses work → recovery automatically, stops before next series.
const tue=programs[1],b=tue.blocks[1],spec=I.build(tue,b,0),clock=new IntervalClock(spec);clock.start(1000);
let boundary=5000+60000;assert.equal(clock.snapshot(1000+boundary+10000).part.kind,'rest');
clock.remaining(1000+5000+60000+150000);assert.equal(clock.waiting,true);assert.equal(clock.snapshot(1000+5000+60000+150000).part.kind,'work');
console.log(`PASS: ${scenes} program scenes/briefs/timers; all doses, 10–30 counts, 3 pitches/levels, fair roles, kit, prep and manual series boundaries.`);
