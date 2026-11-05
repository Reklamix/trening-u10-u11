import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const files=['training-calendar.js','football.js','training-planner.js','football-sequence.js','exercise-brief.js','interval-timer.js','training-programs.js','training-load.js'];
const {C,P,F,S,B,I}=vm.runInNewContext(files.map(f=>read(f).split('// FOOTBALL_BROWSER')[0].split('// TIMER_AUDIO_BROWSER')[0]).join('\n')+';({C:TrainingCalendar,P:TrainingPlanner,F:FootballScenes,S:FootballSequences,B:ExerciseBrief,I:TrainingIntervals})',{performance:{now:()=>0}});
const source=C.expand(JSON.parse(read('trainings.json')),JSON.parse(read('upcoming.json'))).trainings.find(t=>t.id==='2026-11-05');
assert.equal(source.defaultConfig.players,16);assert.equal(source.defaultConfig.pitch,'quarter');assert.equal(source.defaultConfig.width,35);assert.equal(source.defaultConfig.height,25);assert.equal(source.defaultConfig.groupSizes.join(','),'4,4,4,4');
let cases=0;
for(const players of [10,16,17,20,22,30]){
 const t=P.adapt(source,{...source.defaultConfig,players,groupSizes:P.groups(players)});assert.equal(t.planConfig.groupSizes.reduce((a,b)=>a+b,0),players);assert.ok(t.equipment[0].quantity.includes(String(players+4)));
 for(const block of t.blocks){for(const [index,area] of F.groups(block.diagram,players,t.quarterPitch).entries()){
  const scene=F.build(block.diagram,{total:players,size:area.count,pitchIndex:index,area}),preview=S.build(t,block,index,scene),brief=B.build(t,block,index),clock=I.build(t,block,index);
  assert.equal(scene.nodes.filter(n=>n.kind==='player').length,area.count);assert.equal(preview.nodes.filter(n=>n.kind==='player').length,area.count);assert.ok(brief.grouping.includes(String(area.count)));assert.equal(clock.parts.reduce((n,p)=>n+p.milliseconds,0),(block.end-block.start)*60000);cases++;
 }}
}
const app=read('app.js'),start=app.indexOf('  function resetClocksForConfiguration('),end=app.indexOf('  function render(training)',start);
let canceled=0,paused=0;const clock=()=>({pause(){paused++;}}),state={selected:{id:'2026-11-05',planConfig:{players:20}},clocks:new Map([['2026-11-05/1',clock()],['2026-11-05/2',clock()],['2026-11-03/1',clock()]])};
const ctx={state,window:{TimerAudio:{cancel(){canceled++;}}},timerVisualKey:'old',lastTimerState:'old'};
const reset=vm.runInNewContext(app.slice(start,end)+';resetClocksForConfiguration',ctx);
assert.equal(reset({id:'2026-11-05',planConfig:{players:20}}),false);assert.equal(paused,0,'Same config cannot reset an active clock');
assert.equal(reset({id:'2026-11-05',planConfig:{players:16}}),true);assert.equal(paused,2);assert.equal(canceled,1);assert.equal(state.clocks.size,1);assert.ok(state.clocks.has('2026-11-03/1'),'Other dates remain intact');assert.equal(ctx.timerVisualKey,'');
console.log(`PASS: ${cases} changing-count scene/animation/kit/rotation/timer cases; changed config pauses and invalidates only its own clocks.`);
