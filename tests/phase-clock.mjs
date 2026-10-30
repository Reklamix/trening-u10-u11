import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const source=JSON.parse(read('trainings.json')).trainings.find(t=>t.id==='2026-10-29');
let now=0;
const code=read('football.js').split('// FOOTBALL_BROWSER')[0]+'\n'+read('training-planner.js')+'\n'+read('football-sequence.js')+'\n'+read('interval-timer.js').split('// TIMER_AUDIO_BROWSER')[0];
const {training,Clock,intervals,scenes,sequences}=runInNewContext(code+'\n({training:TrainingPlanner.adapt(input,{players:24}),Clock:IntervalClock,intervals:TrainingIntervals,scenes:FootballScenes,sequences:FootballSequences})',{input:source,Date:{now:()=>now}});
const block=training.blocks[0],clock=new Clock(intervals.build(training,block,0));clock.signature='current';
const nodes=new Map(),followed=[],scheduled=[];let advances=0;
const $=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',dataset:{},setAttribute(name,value){this[name]=value;}});return nodes.get(id);};
const app=read('app.js'),start=app.indexOf('  function updateTimer() {'),end=app.indexOf('  function attendanceCase()',start);
const scope={$,Date:{now:()=>now},state:{selected:training,view:"field"},document:{hidden:false},finishAdvance:null,finishedClockRuns:new WeakSet(),setTimeout:callback=>{scheduled.push(callback);return scheduled.length;},clearTimeout(){},completeCurrentExercise:()=>advances++,currentClock:()=>clock,clockKey:()=>training.id+'/'+block.id,clockSignature:()=> 'current',clockText:ms=>{const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');},lastTimerState:'',timerVisualKey:'',window:{FootballBoard:{followInterval:part=>followed.push(part)},TimerAudio:{status:()=> 'running',update(){},keepAwake(){}}}};
const update=runInNewContext(app.slice(start,end)+'\nupdateTimer',scope);
update();assert.equal($('exercise-clock-value').textContent,'00:05');assert.equal(followed.length,0);
clock.start(now);now=5000;update();assert.equal($('exercise-clock-value').textContent,'02:00');assert.match($('exercise-clock-phase').textContent,/Práca.*Rozhýbanie/);assert.equal(followed.at(-1).name,'Rozhýbanie');
update();assert.equal(followed.length,1,'Only the real work boundary synchronizes, never every tick');
now=125000;update();assert.equal(clock.waiting,true);assert.equal($('exercise-clock-toggle').textContent,'Ďalšia séria');assert.equal($('exercise-clock-value').textContent,'03:00');
now=999000;update();assert.equal($('exercise-clock-value').textContent,'03:00','Waiting does not consume the next series');
clock.start(now);update();assert.equal($('exercise-clock-value').textContent,'00:05');now+=5000;update();assert.equal($('exercise-clock-value').textContent,'03:00');
now+=180000;update();assert.equal(clock.waiting,true);clock.start(now);now+=5000;update();assert.equal($('exercise-clock-value').textContent,'01:00');
now+=60000;update();assert.match($('exercise-clock-phase').textContent,/Oddych/);assert.equal($('exercise-clock-value').textContent,'00:30');assert.equal(followed.at(-1).kind,'rest');
assert.equal($('exercise-clock-value').textContent,$('timer-value').textContent);
const area=scenes.groups(block.diagram,24,training.quarterPitch)[0],base=scenes.build(block.diagram,{total:24,size:area.count,pitchIndex:0,area}),scene=sequences.build(training,block,0,base);
for(const part of followed.filter(part=>part.kind!=='ready'))assert.ok(scene.phases.some(phase=>phase.name===part.name&&phase.kind===part.kind),'Actual interval has an exact visual phase');
assert.equal(scheduled.length,0,'No advance during work, rest or a manual gate');
while(!clock.snapshot().finished){if(clock.waiting)clock.start(now);now+=clock.remaining();clock.snapshot();}
update();assert.equal(scheduled.length,1,'Only the full exercise completion schedules navigation');assert.equal(advances,0,'Final sound can finish before navigation');scheduled[0]();assert.equal(advances,1);update();assert.equal(scheduled.length,1,'Completion is handled once');
clock.reset();update();assert.equal($('exercise-clock-value').textContent,'00:05');assert.equal(clock.deadline,null,'Next/reset clock is not auto-started');
for(const item of training.blocks){
 const areas=scenes.groups(item.diagram,24,training.quarterPitch);
 for(const [index,group]of (areas.length?areas:[null]).entries()){
  const base=scenes.build(item.diagram,{total:24,size:group?.count,pitchIndex:index,area:group}),scene=sequences.build(training,item,index,base);
  for(const part of intervals.build(training,item,index).parts)assert.ok(scene.phases.some(phase=>phase.name===part.name&&phase.kind===part.kind),'Each real interval maps to the same scene phase');
 }
}
const completed=app.slice(app.indexOf('  function completeCurrentExercise(){'),app.indexOf("  $('complete-block').addEventListener",app.indexOf('  function completeCurrentExercise(){')));
const completionState={selected:training,blockIndex:0,done:{}};let navigated=null,rendered=0;
const complete=runInNewContext(completed+'\ncompleteCurrentExercise',{state:completionState,currentClock:()=>clock,completed:()=>completionState.done[training.id]||[],activeBlock:()=>training.blocks[completionState.blockIndex],writeLocal(){},storageKeys:{done:'done'},navigate:(view,index)=>navigated={view,index},renderActive:()=>rendered++});
complete();assert.equal(navigated.index,1);assert.equal(navigated.view,'field');assert.ok(completionState.done[training.id].includes(block.id));assert.equal(clock.deadline,null);
completionState.blockIndex=training.blocks.length-1;navigated=null;complete();assert.equal(navigated,null);assert.equal(rendered,1,'Final exercise completes the training without a nonexistent next route');
console.log('PASS: inline work/rest, manual series, exact visual mapping, single completion navigation, manual next start and final training completion.');
