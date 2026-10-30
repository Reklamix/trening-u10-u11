import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const source=JSON.parse(read('trainings.json')).trainings,thu=source.find(t=>t.id==='2026-10-29');
const code=read('football.js').split('// FOOTBALL_BROWSER')[0]+'\n'+read('training-planner.js')+'\n'+read('football-sequence.js')+'\n'+read('interval-timer.js').split('// TIMER_AUDIO_BROWSER')[0];
const {planner,scenes,intervals,Clock}=runInNewContext(code+'\n({planner:TrainingPlanner,scenes:FootballScenes,intervals:TrainingIntervals,Clock:IntervalClock})');
let count=0;
for(let players=10;players<=30;players++)for(const pitch of['quarter','half','full'])for(const level of['base','standard','challenge']){
  const training=planner.adapt(thu,{players,pitch,levels:[level,level,level,level]});
  for(const block of training.blocks){
    const areas=scenes.groups(block.diagram,players,training.quarterPitch);
    for(const [index]of(areas.length?areas:[null]).entries()){
      const spec=intervals.build(training,block,index),clock=new Clock({...spec,parts:spec.parts.map(part=>({...part,requiresStart:false}))});
      assert.equal(clock.trainingTotal,(block.end-block.start)*60000,'Actual work/rest/setup/water still fits the approved block');
      assert.equal(clock.total,clock.trainingTotal+5000,'Only a separate five-second ready countdown is added');
      assert.ok(spec.parts.every(part=>part.milliseconds>0));
      clock.start(0);let offset=0;
      for(const [partIndex,part]of clock.parts.entries()){
        assert.equal(clock.snapshot(offset).index,partIndex,'Exact boundary enters the next planned activity');
        assert.equal(clock.snapshot(offset).remaining,part.milliseconds);
        assert.equal(clock.snapshot(offset+part.milliseconds-1).index,partIndex,'No premature work/rest transition');
        const cues=clock.signals.filter(cue=>cue.index===partIndex&&cue.type==='countdown');
        assert.equal(cues.map(cue=>cue.seconds).join(','),'5,4,3,2,1','Warn every last second of work and recovery');
        assert.equal(cues.map(cue=>cue.at).join(','),[5,4,3,2,1].map(seconds=>offset+part.milliseconds-seconds*1000).join(','));
        offset+=part.milliseconds;
      }
      assert.equal(clock.snapshot(offset).finished,true);assert.equal(clock.signals.at(-1).type,'finish');
      assert.equal(clock.signals.at(-1).at,offset,'Final signal occurs at zero');count++;
    }
  }
}
const spec=intervals.build(planner.adapt(thu,{players:24}),thu.blocks[0]),clock=new Clock({...spec,parts:spec.parts.map(part=>({...part,requiresStart:false}))});
clock.start(1000);assert.equal(clock.snapshot(6000).part.name,'Rozhýbanie');assert.equal(clock.snapshot(6000).remaining,120000);
clock.pause(36000);assert.equal(clock.snapshot(999000).remaining,90000,'Pause freezes the exact interval');
clock.start(200000);assert.equal(clock.snapshot(210000).remaining,80000,'Resume retains interval position');
assert.equal(clock.remaining(9999999),0);clock.reset();assert.equal(clock.deadline,null);assert.equal(clock.snapshot().remaining,5000);
for(const training of source.filter(t=>t.id!==thu.id))for(const block of training.blocks)assert.equal(intervals.build(training,block).parts.length,1,'Archives use their approved whole-block timer, without invented intervals');
const passing=planner.adapt(thu,{players:24}),manual=new Clock(intervals.build(passing,passing.blocks[1]));
manual.start(0);
manual.snapshot(275000);assert.equal(manual.waiting,true,'5 s ready + 60 s demonstration + 180 s work + 30 s rest ends in a manual wait');
assert.equal(manual.snapshot(999999).part.name,'Prihrávky 2/3','Waiting time cannot consume the next work interval');
assert.equal(manual.snapshot(999999).remaining,180000);assert.equal(manual.deadline,null);
const actualLeft=manual.snapshot().overall;manual.start(1000000);
assert.equal(manual.snapshot(1000000).part.kind,'ready','Manual Start gives five seconds to get ready');
assert.equal(manual.snapshot(1000000).remaining,5000);assert.equal(manual.snapshot(1000000).overall,actualLeft,'Extra preparation is separate from the training dose');
assert.equal(manual.snapshot(1005000).part.name,'Prihrávky 2/3');assert.equal(manual.snapshot(1005000).remaining,180000);
manual.reset();assert.equal(manual.total,manual.trainingTotal+5000,'Reset removes extra manual-ready periods');
const rondo=intervals.build(passing,passing.blocks[2]);assert.equal(rondo.parts.filter(part=>part.requiresStart).length,1,'Rondo gates between its two series, without interrupting defensive rotations');
const zones=intervals.build(planner.adapt(thu,{players:28}),passing.blocks[3]);assert.equal(zones.parts.filter(part=>part.requiresStart).length,5,'Seven-player role halves stay continuous; only the next five rounds need Start');

// Exercise the real audio scheduler against a deterministic browser-audio adapter.
let now=0;const oscillators=[];
class FakeAudio {
  constructor(){this.state='suspended';this.destination={};}
  get currentTime(){return now/1000;}
  async resume(){this.state='running';}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
  createOscillator(){const node={frequency:{value:0},connect(){},disconnect(){},start(at){this.at=at;},stop(at){if(at===undefined)this.cancelled=true;else this.end=at;}};oscillators.push(node);return node;}
}
const browser=runInNewContext(read('interval-timer.js')+'\n({Clock:IntervalClock,audio:window.TimerAudio})',{window:{AudioContext:FakeAudio},Date:{now:()=>now},document:{hidden:false},navigator:{}});
const short=new browser.Clock({scope:'QA',parts:[{name:'Práca',kind:'work',milliseconds:10000},{name:'Oddych',kind:'rest',milliseconds:10000},{name:'Séria 2',kind:'work',milliseconds:10000}]});
assert.equal(await browser.audio.unlock(),true);short.start(0);browser.audio.bind(short,true);browser.audio.update(short);
assert.equal(oscillators[0].frequency.value,880);assert.equal(oscillators[0].at,0,'Initial ready tone responds to Start');
now=1250;browser.audio.update(short);assert.ok(oscillators.some(node=>node.at===2));
now=1500;short.pause(now);browser.audio.cancel();assert.ok(oscillators.find(node=>node.at===2).cancelled,'Pause cancels a future beep');
now=10000;short.start(now);browser.audio.bind(short);browser.audio.update(short);assert.ok(oscillators.some(node=>node.at===10.5&&!node.cancelled),'Resume schedules the remaining warning at the new wall-clock time');
const beforeMute=oscillators.length;browser.audio.setEnabled(false);now=11000;browser.audio.update(short);assert.equal(oscillators.length,beforeMute,'Mute suppresses future sound');
browser.audio.setEnabled(true);await browser.audio.unlock();browser.audio.bind(short);browser.audio.update(short);
now=short.deadline-500;browser.audio.update(short);const final=oscillators.filter(node=>!node.cancelled&&node.at>=now/1000);
assert.ok(final.some(node=>node.frequency.value===1100),'Final signal is scheduled before zero, without interval-tick latency');
now=short.deadline;browser.audio.update(short);assert.ok(final.every(node=>!node.cancelled),'Reaching zero lets the final tone finish');
const beforeLate=oscillators.length;now+=60000;browser.audio.update(short);assert.equal(oscillators.length,beforeLate,'Returning after a hidden page never bursts stale beeps');
browser.audio.cancel();now=0;
const gated=new browser.Clock({scope:'QA',parts:[{name:'Séria 1',kind:'work',milliseconds:10000},{name:'Oddych',kind:'rest',milliseconds:10000},{name:'Séria 2',kind:'work',milliseconds:10000,requiresStart:true}]});
gated.start(0);browser.audio.bind(gated,true);now=24500;browser.audio.update(gated);
const readyCue=oscillators.filter(node=>!node.cancelled&&node.at===25);assert.ok(readyCue.some(node=>node.frequency.value===740));assert.ok(readyCue.every(node=>node.frequency.value!==1200),'At rest end play ready, never an automatic next-series start');
now=25000;gated.snapshot(now);browser.audio.update(gated);assert.equal(gated.waiting,true);assert.ok(readyCue.every(node=>!node.cancelled),'The ready signal is allowed to finish while waiting');
now=60000;gated.start(now);browser.audio.bind(gated,true);now=64900;browser.audio.update(gated);assert.ok(oscillators.some(node=>!node.cancelled&&node.at===65&&node.frequency.value===1200),'Manual Start beeps the new work start after its five-second preparation');
console.log(`PASS: ${count} interval schedules; 10–30 children, all pitch presets/levels; exact phases, manual next series, five-second signals, pause/resume/mute/audio scheduling and archives.`);
