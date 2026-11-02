import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(name,'utf8');
const source=read('football.js').split('// FOOTBALL_BROWSER')[0]+read('training-planner.js')+read('training-programs.js')+read('training-load.js')+read('training-calendar.js')+read('exercise-views.js');
const {views,calendar,planner,scenes}=vm.runInNewContext(source+';({views:ExerciseVisualViews,calendar:TrainingCalendar,planner:TrainingPlanner,scenes:FootballScenes})',{performance:{now:()=>0}});
const sample={dx:-80,dy:5,startX:120,width:390,duration:200};
assert.equal(views.swipeTarget(0,sample),1);assert.equal(views.swipeTarget(1,sample),2);assert.equal(views.swipeTarget(2,sample),2);
assert.equal(views.swipeTarget(1,{...sample,dx:80}),0);
for(const change of [{dx:10},{dy:120},{startX:10},{startX:385},{duration:1200}])assert.equal(views.swipeTarget(1,{...sample,...change}),1,'Vertical scrolling, OS edge gestures, short or held touches must not switch views');
const data=JSON.parse(read('trainings.json')),agenda=JSON.parse(read('upcoming.json')),expanded=calendar.expand(data,agenda);let checked=0;
for(const date of ['2026-10-29','2026-11-02','2026-11-03'])for(const players of [10,14,19,20,24,26,30])for(const pitch of ['quarter','half','full']){
 const source=expanded.trainings.find(t=>t.id===date),t=planner.adapt(source,{...source.defaultConfig,players,pitch,width:planner.pitches[pitch].width,height:planner.pitches[pitch].height,groupSizes:planner.groups(players)});
 for(const block of t.blocks){
  const areas=scenes.groups(block.diagram,players,t.quarterPitch);if(!areas.length)continue;
  assert.equal(areas.reduce((sum,a)=>sum+a.count,0),players);
  for(const [index,area]of areas.entries()){
   const scene=scenes.build(block.diagram,{total:players,size:area.count,pitchIndex:index,area}),before=JSON.stringify(scene);
   assert.equal(scene.nodes.filter(node=>node.kind==='player').length,area.count,'Whole-pitch snapshot must include every actual child, including waiting roles');
   const info=views.describe({scene,layout:t.quarterPitch,areas,index,total:players});
   assert.equal(info.totalPlayers,players);assert.equal(info.selectedPlayers,area.count);assert.equal(info.cones,scene.cones.length);assert.equal(info.pitchWidth,t.quarterPitch.width);assert.equal(info.pitchHeight,t.quarterPitch.height);assert.equal(JSON.stringify(scene),before);checked++;
  }
 }
}
const html=read('index.html');assert.ok(html.includes('exercise-views.js'));assert.ok(html.indexOf('exercise-views.js')<html.indexOf('app.js?v='));assert.ok(html.includes('<span>Úvod</span>'));
const css=read('exercise-views.css');assert.ok(css.includes('body:has(.exercise-focus)>#bottom-nav:not([hidden]){display:flex'));assert.ok(css.includes('touch-action:pan-y pinch-zoom'));assert.ok(css.includes('76px + env(safe-area-inset-bottom)'));
console.log(`PASS: ${checked} real exercise/group/count/pitch view snapshots, swipe thresholds/edge gestures, canonical scene immutability and navigation wiring.`);
