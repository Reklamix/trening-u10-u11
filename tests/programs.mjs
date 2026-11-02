import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','interval-timer.js','training-programs.js','training-load.js'];
const code=files.map(f=>read(f).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0].split('// TIMER_AUDIO_BROWSER')[0]).join('\n');
const api=runInNewContext(code+';({TrainingCalendar,TrainingPlanner,FootballScenes,FootballSequences,ExerciseBrief,PitchSetupPlan,TrainingIntervals,IntervalClock,SessionPrograms,TrainingLibrary,TrainingLoad})',{performance:{now:()=>0}});
const {TrainingCalendar:C,TrainingPlanner:P,FootballScenes:F,FootballSequences:S,ExerciseBrief:B,PitchSetupPlan:U,TrainingIntervals:I,IntervalClock,SessionPrograms:G,TrainingLibrary:L}=api;
const original=JSON.parse(read('trainings.json')),agenda=JSON.parse(read('upcoming.json')),saved=JSON.stringify(original),expanded=C.expand(original,agenda),programs=expanded.trainings.filter(G.supports.bind(G));
assert.equal(JSON.stringify(original),saved);assert.equal(programs.length,2);
assert.equal(expanded.trainings.filter(t=>t.planning?.status==='draft').length,4);
let scenes=0;
for(const source of programs){
 assert.equal(source.planning.status,'ready');
 const expected=source.date==='2026-11-02'?[10,14,20,30,40,54,72,75]:[10,16,28,42,54,72,75];
 assert.deepEqual(Array.from(source.blocks,b=>b.end),expected);
 for(const players of [10,14,19,20,22,24,26,30])for(const pitch of ['quarter','half','full'])for(const level of ['base','standard','challenge']){
  const t=P.adapt(source,{...source.defaultConfig,players,pitch,width:P.pitches[pitch].width,height:P.pitches[pitch].height,groupSizes:P.groups(players),levels:[level,level,level,level]});
  assert.equal(t.blocks.at(-1).end,75);assert.equal(t.duration,75);
  assert.equal(t.planConfig.groupSizes.reduce((a,b)=>a+b,0),players);
  const prep=U.forExercises(t);assert.equal(prep.steps.length,t.blocks.length);
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
     const d=G.duelDose(n,b.duelBudget);assert.equal(work.length,d.cycles*n);assert.equal(timer.parts.filter(p=>p.requiresStart).length,d.cycles-1,'Only next series requires manual start');
     if(n===5){assert.equal(roles[0].A,t.date==='2026-11-02'?6:8);assert.equal(roles[0].B,b.programKind==='duel'?(t.date==='2026-11-02'?6:8):4);assert.equal(roles[0].N,b.programKind==='duel'?(t.date==='2026-11-02'?3:4):8);}
     if(b.programKind==='duel'){
      const lanes=G.lanes('duel',n),gates=base.cones.filter(c=>c.kind==='gate'),shots=base.arrows.filter(a=>a.kind==='shot');
      assert.equal(shots.length,lanes,'Every duel lane ends with a shot');assert.equal(gates.length,2*lanes,'One real cone goal per duel lane');
      assert.ok(brief.description.includes('prízemnou strelou'));assert.equal(brief.visualKit.find(k=>k.kind==='gates').local,lanes);
      for(let lane=0;lane<lanes;lane++){
       const finish=F.sample(base.tracks['ball'+lane],8),attacker=F.sample(base.tracks['p'+(lane*2)],8),posts=gates.slice(lane*2,lane*2+2);
       assert.ok(Math.abs(finish.x-posts[0].x)<.001&&finish.y>Math.min(...posts.map(p=>p.y))&&finish.y<Math.max(...posts.map(p=>p.y)),'Ball really reaches the goal between both posts');
       assert.ok(finish.x-attacker.x>base.pitch.w*.1,'Shot ball separates from attacker; no dribbling through the goal');
       const before=F.sample(base.tracks['ball'+lane],6.4),kicker=F.sample(base.tracks['p'+(lane*2)],6.4);assert.ok(Math.hypot(before.x-kicker.x,before.y-kicker.y)<12,'Ball stays at the foot until the shot');
      }
      const children=base.nodes.filter(node=>node.kind==='player');
      for(let time=0;time<=base.duration;time+=.1)for(let a=0;a<children.length;a++)for(let z=a+1;z<children.length;z++){
       const x=F.sample(base.tracks[children[a].id],time),y=F.sample(base.tracks[children[z].id],time);assert.ok(Math.hypot(x.x-y.x,x.y-y.y)>14,`Duel actors and waiting children remain separate: n=${n},${level},${pitch},t=${time},${children[a].id}/${children[z].id}`);
      }
     }
     if(b.programKind==='two-one'&&n>=3){
      const children=base.nodes.filter(node=>node.kind==='player');
      for(let time=0;time<=base.duration;time+=.1)for(let a=0;a<children.length;a++)for(let z=a+1;z<children.length;z++){
       const x=F.sample(base.tracks[children[a].id],time),y=F.sample(base.tracks[children[z].id],time);
       assert.ok(Math.hypot(x.x-y.x,x.y-y.y)>14,`Two-on-one actors stay separate: n=${n}, ${level}, t=${time}, ${children[a].id}/${children[z].id}`);
      }
     }
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
     if(n<=3)assert.equal(work.reduce((sum,p)=>sum+p.actualSeconds,0),b.programKind==='zones'?(t.date==='2026-11-03'?288:360):540,'Small groups have additional rest');
    }
    if(b.programKind==='strength'){
     assert.equal(scene.phases.filter(p=>p.kind==='work').length,4);
     assert.equal(scene.phases.filter(p=>p.kind==='work').reduce((sum,p)=>sum+p.actualSeconds,0),80);
    }
    if(b.programKind==='speed'){
     const work=scene.phases.filter(p=>p.kind==='work');
     for(const node of nodes)assert.equal(work.filter(p=>p.roles[node.id].team==='A').length,4,'Each child has exactly four runs');
     assert.equal(timer.parts.filter(p=>p.requiresStart).length,3,'Only next running series needs manual start');
     const signals=I.signals(timer.parts);assert.ok(signals.every(e=>e.at>=0),'Short running phases never create negative five-second warnings');
     const firstRun=timer.parts.findIndex(p=>p.kind==='work');assert.equal(signals.filter(e=>e.index===firstRun&&e.type==='countdown').map(e=>e.seconds).join(','),'4,3,2,1','A four-second run warns only for its actual four seconds');
     assert.ok(scene.phases.some(p=>p.kind==='rest'&&p.name.startsWith('Návrat')),'Full walking return and recovery phase');
     assert.equal(area.runDistance,Math.min(t.date==='2026-11-03'?15:10,area.length-5));
     assert.ok(area.length-2-area.runDistance>=3,'Braking stays inside field with at least three metres');
     for(const example of [base,api.TrainingLoad.singleRunner(base),api.TrainingLoad.walkback(base),api.TrainingLoad.walkback(api.TrainingLoad.singleRunner(base))]){
      const children=example.nodes.filter(n=>n.kind==='player');
      for(let time=0;time<=example.duration;time+=.25)for(let a=0;a<children.length;a++)for(let z=a+1;z<children.length;z++){
       const x=F.sample(example.tracks[children[a].id],time),y=F.sample(example.tracks[children[z].id],time);
       assert.ok(Math.hypot(x.x-y.x,x.y-y.y)>14,`Speed queue/return separation: n=${area.count}, t=${time}, ${children[a].id}/${children[z].id}`);
      }
     }
    }
    if(b.programKind==='large-game'){
     const work=scene.phases.filter(p=>p.kind==='work'),neutral=nodes.map(node=>work.reduce((sum,p)=>sum+(p.roles[node.id].team==='N'?p.actualSeconds:0),0));
     assert.ok(neutral.every(v=>v===neutral[0]),'Equal neutral time in larger game');
     assert.equal(timer.parts.filter(p=>p.requiresStart).length,3);
     assert.equal(nodes.filter(node=>node.team==='A').length,Math.floor(area.count/2));
     assert.equal(areas.reduce((sum,a)=>sum+a.count,0),players,'Larger games include every child');
     if(pitch==='quarter'){assert.equal(areas.length,4);assert.equal(area.members.length,1);}else{assert.equal(areas.length,2);assert.equal(area.members.length,2);assert.ok(area.length>=30);}
     if(area.count<=6)assert.equal(work.reduce((sum,p)=>sum+p.actualSeconds,0),480,'Small teams have additional rest within four game periods');
     for(const node of base.nodes.filter(n=>n.team==='A'&&n.kind==='player'))assert.ok(F.sample(base.tracks[node.id],12).x<F.sample(base.tracks[node.id],6).x,'The large-game example really shows a defensive return after losing possession');
    }
    scenes++;
   }
   if(b.programKind!=='finish')assert.equal(prep.steps[i].map.cones.length,G.cones(t,b).length);
  }
  const max=Math.max(...t.blocks.map(b=>G.cones(t,b).length));assert.ok(t.equipment[1].quantity.includes(String(max+8)));
  for(const step of prep.steps){assert.equal(step.total,step.kept.length+step.moves.length+step.added.length);for(const p of step.map.cones)assert.ok(p.x>=0&&p.x<=t.planConfig.width&&p.y>=0&&p.y<=t.planConfig.height);}
 }
}
for(const levels of [['base','challenge','standard','standard'],['base','challenge','base','challenge']]){
 const t=P.adapt(programs[0],{...programs[0].defaultConfig,levels}),game=t.blocks.find(b=>b.programKind==='large-game'),areas=F.groups(game.diagram,20,t.quarterPitch);
 assert.equal(areas.length,levels[2]===levels[3]?3:4);
 assert.equal(areas.reduce((sum,a)=>sum+a.count,0),20);
 assert.ok(areas.every(a=>new Set(a.members.map(i=>levels[i])).size===1),'Different technical levels never get merged');
 const again=P.adapt(t,t.planConfig);assert.equal(again.blocks.length,t.blocks.length);assert.equal(again.blocks.map(b=>b.id).join(','),t.blocks.map(b=>b.id).join(','),'Repeated adaptation never duplicates physical blocks');
}
// Date library uses the actual new content rather than the inherited diagram slot.
assert.ok(L.filter(expanded.trainings,{topic:'duels',mode:'drills'}).some(i=>i.training.date==='2026-11-03'&&i.block.programKind==='duel'));
assert.throws(()=>C.expand(original,{...agenda,sessions:[{...agenda.sessions[0],programId:'unknown'}]}));
// Representative interval crosses work → recovery automatically, stops before next series.
const tue=programs[1],b=tue.blocks.find(b=>b.programKind==='duel'),spec=I.build(tue,b,0),clock=new IntervalClock(spec);clock.start(1000);
let boundary=60000;assert.equal(clock.snapshot(1000+boundary+10000).part.kind,'rest');
clock.remaining(1000+60000+150000);assert.equal(clock.waiting,true);assert.equal(clock.snapshot(1000+60000+150000).part.kind,'work');
console.log(`PASS: ${scenes} program scenes/briefs/timers; all doses, 10–30 counts, 3 pitches/levels, fair roles, kit, prep and manual series boundaries.`);
