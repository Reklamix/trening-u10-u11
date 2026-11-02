import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','pitch-setup.js','training-programs.js','training-load.js'];
const code=files.map(name=>read(name).split('// FOOTBALL_BROWSER')[0].split('// PITCH_SETUP_BROWSER')[0]).join('\n');
const {calendar,planner,setup,scenes}=vm.runInNewContext(code+';({calendar:TrainingCalendar,planner:TrainingPlanner,setup:PitchSetupPlan,scenes:FootballScenes})');
const source=JSON.parse(read('trainings.json')),agenda=JSON.parse(read('upcoming.json')),beforeSource=JSON.stringify(source),expanded=calendar.expand(source,agenda);let checked=0;
for(const date of ['2026-10-29','2026-11-02','2026-11-03'])for(const players of [10,19,20,24,30])for(const pitch of ['quarter','half','full']){
 const original=expanded.trainings.find(t=>t.id===date),training=planner.adapt(original,{...original.defaultConfig,players,pitch,width:planner.pitches[pitch].width,height:planner.pitches[pitch].height,groupSizes:planner.groups(players)}),before=JSON.stringify(training);
 for(const [index,current]of training.blocks.entries()){
  const next=setup.upcoming(training,current.id),expected=training.blocks[index+1];
  if(!expected){assert.equal(next,null,'Final drill has no upcoming preview');continue;}
  assert.equal(next.block,expected,'Follow array order even when block IDs are not consecutive');assert.equal(next.currentTitle,current.title);assert.equal(next.steps[next.index].blockId,expected.id);assert.equal(next.block.start,current.end);assert.ok(next.brief?.steps.length);
  const step=next.steps[next.index];assert.equal(step.map.cones.length,step.total);
  if(expected.programKind!=='finish'&&expected.diagram!=='football-finish'){
   const areas=scenes.groups(expected.diagram,players,training.quarterPitch),cones=areas.reduce((sum,area,i)=>sum+scenes.build(expected.diagram,{total:players,size:area.count,pitchIndex:i,area}).cones.length,0);
   assert.equal(step.total,cones,'Preparation must match the actual upcoming drill and attendance');assert.equal(areas.reduce((sum,area)=>sum+area.count,0),players);
  }
  checked++;
 }
 assert.equal(setup.upcoming(training,-999),null);assert.equal(JSON.stringify(training),before,'Opening preview must not change the selected session or any training data');
}
assert.equal(setup.upcoming({blocks:[]},1),null);assert.equal(JSON.stringify(source),beforeSource);
console.log(`PASS: ${checked} upcoming drill/count/pitch previews; actual next IDs, cone maps, final/unknown drills and training immutability.`);
