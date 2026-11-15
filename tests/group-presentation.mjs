import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','training-programs.js','training-load.js'];
const {C,P,F,S,U}=vm.runInNewContext(files.map(n=>read(n).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0]).join('\n')+';({C:TrainingCalendar,P:TrainingPlanner,F:FootballScenes,S:FootballSequences,U:PitchSetupPlan})');
const all=C.expand(JSON.parse(read('trainings.json')),JSON.parse(read('upcoming.json'))).trainings.filter(t=>P.supports(t));
let cases=0,rotated=0;
for(const source of all)for(const input of [{players:10},{players:16},{players:30},{players:16,groupSizes:[6,5,5],groupMode:'manual'},{players:16,groupSizes:[4,4,4,4],groupMode:'manual'}]){
 const t=P.adapt(source,{pitch:'quarter',levels:['base','standard','challenge','standard'],...input});
 if(input.groupMode==='manual')assert.equal(t.planConfig.groupSizes.join(','),input.groupSizes.join(','),'Keep the coach-selected group sizes');
 const prep=U.forExercises(t);
 for(const block of t.blocks){
  const areas=F.groups(block.diagram,input.players,t.quarterPitch);
  if(!areas.length)continue;
  assert.equal(areas.reduce((sum,a)=>sum+a.count,0),input.players,'Every child has one working area');
  const step=prep.steps.find(s=>s.blockId===block.id);
  if(!['finish','football-finish'].includes(block.programKind||block.diagram))assert.equal(step.map.areas.length,areas.length,'Preparation cannot retain phantom stations');
  for(const [index,area] of areas.entries()){
   const raw=F.build(block.diagram,{total:input.players,size:area.count,pitchIndex:index,area});
   const original=JSON.stringify(raw),display=F.presentation(raw);
   assert.equal(JSON.stringify(raw),original,'Presentation never changes the actual field layout');
   assert.equal(display.nodes.filter(n=>n.kind==='player').length,area.count,'Every assigned child remains visible');
   assert.equal(display.cones.length,raw.cones.length);
   assert.equal(display.pitch.length*display.pitch.width,area.length*area.width,'Displayed metres preserve actual area');
   const p=raw.pitch,turn=q=>({x:p.x+q.y-p.y,y:p.y+p.w-(q.x-p.x)});
   const close=(a,b)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-7,'A rigid rotation preserves real placement');
   for(const node of raw.nodes){const other=display.nodes.find(n=>n.id===node.id);close(other,display.displayRotated?turn(node):node);}
   for(const [id,frames]of Object.entries(raw.tracks))for(const time of [0,raw.duration/2,raw.duration]){const q=F.sample(frames,time);close(F.sample(display.tracks[id],time),display.displayRotated?turn(q):q);}
   raw.cones.forEach((cone,i)=>close(display.cones[i],display.displayRotated?turn(cone):cone));
   if(display.displayRotated){rotated++;assert.equal(display.pitch.length,area.width);assert.equal(display.pitch.width,area.length);assert.ok(display.pitch.w>=display.pitch.h);}
   cases++;
  }
 }
}
// The exact former failure: auto 10 → 5+5, auto 16 → 6+5+5, 24 → two warm zones (6+6 each).
const legacy=all.find(t=>t.id==='2026-10-29');
for(const [players,expected]of [[10,[2,2]],[16,[3,2,2]],[24,[6,6]]]){
 const t=P.adapt(legacy,{players}),block=t.blocks.find(b=>b.diagram==='football-warmup'),areas=F.groups(block.diagram,players,t.quarterPitch);
 assert.equal(areas.length,expected.length);
 for(const[index,area]of areas.entries()){
  const sequence=S.build(t,block,index,F.build(block.diagram,{total:players,size:area.count,pitchIndex:index,area}));
  for(const phase of sequence.phases.filter(p=>p.name.startsWith('Prihrávky'))){
   assert.equal(sequence.nodes.filter(n=>n.kind==='ball'&&phase.roles[n.id].visible).length,expected[index]);
   assert.equal(sequence.nodes.filter(n=>n.kind==='player'&&phase.roles[n.id].visible).length,area.count);
  }
 }
}
console.log(`PASS: ${cases} actual group/display/preparation cases, ${rotated} rigid landscape diagrams; explicit 10/16/24 passing groups and manual 6+5+5 / 4+4+4+4.`);
