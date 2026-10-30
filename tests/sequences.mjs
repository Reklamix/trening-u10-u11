import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const source=JSON.parse(read('trainings.json')).trainings.find(t=>t.id==='2026-10-29');
const {planner,scenes,sequences,brief,setup}=runInNewContext(read('football.js').split('// FOOTBALL_BROWSER')[0]+'\n'+read('training-planner.js')+'\n'+read('football-sequence.js')+'\n'+read('exercise-brief.js')+'\n'+read('pitch-setup.js').split('// PITCH_SETUP_BROWSER')[0]+'\n({planner:TrainingPlanner,scenes:FootballScenes,sequences:FootballSequences,brief:ExerciseBrief,setup:PitchSetupPlan})');
let checks=0;
for(const total of Array.from({length:21},(_,i)=>i+10))for(const pitch of ['quarter','half','full'])for(const level of ['base','standard','challenge']){
  const training=planner.adapt(source,{players:total,pitch,levels:[level,level,level,level]});
  const preparation=setup.forExercises(training);
  assert.equal(preparation.steps.length,training.blocks.length,'Each exercise has one directly selectable preparation diagram');
  for(const step of preparation.steps){
    const points=items=>items.map(p=>`${p.area}:${p.x},${p.y}`).sort().join('|');
    assert.equal(points([...step.kept,...step.added,...step.moves.map(move=>move.to)]),points(step.map.cones),'Combining zone preparation keeps every real target cone exactly once');
    assert.ok(training.blocks.some(block=>block.id===step.blockId),'Preparation links to the real exercise');
  }
  assert.equal(preparation.steps[2].moves.length+preparation.steps[2].added.length,0,'Rondo reuses passing setup without invented work');
  for(const block of training.blocks){
    const areas=scenes.groups(block.diagram,total,training.quarterPitch);
    for(const [index,area]of (areas.length?areas:[null]).entries()){
      const base=scenes.build(block.diagram,{total,size:area?.count,pitchIndex:index,area}),snapshot=JSON.stringify(base),scene=sequences.build(training,block,index,base),people=scene.nodes.filter(n=>n.kind==='player');
      assert.equal(JSON.stringify(base),snapshot,'Approved action is never mutated');
      assert.equal(people.length,area?.count??total,'All actual children are present');
      assert.equal(scene.phases.reduce((sum,p)=>sum+p.actualSeconds,0),(block.end-block.start)*60,'All work, rest and setup doses sum to the original block');
      assert.equal(scene.phases.at(-1).kind,'end');
      const phasePlan=brief.phasePlan(scene),parts=phasePlan.flatMap(group=>group.parts);
      assert.equal(parts.reduce((sum,part)=>sum+part.actualSeconds,0),(block.end-block.start)*60,'Visible grouped phases retain all work, breaks, water and setup');
      assert.equal(new Set(parts.map(part=>part.index)).size,scene.phases.length-1,'Every animation phase maps to exactly one visible group');
      for(let phaseIndex=0;phaseIndex<scene.phases.length-1;phaseIndex++)assert.equal(phasePlan.filter(group=>phaseIndex>=group.first&&phaseIndex<=group.last).length,1,'Highlight identifies exactly one phase card, including recovery');
      for(const group of phasePlan){assert.ok(brief.phaseDoses(group).every(dose=>dose.label&&dose.value));assert.equal(scene.phases[group.first].start,group.start,'Selecting a grouped phase shows its real initial diagram');}
      if(block.diagram==='football-mini-games')for(const group of phasePlan.slice(1))assert.equal(brief.phaseDoses(group).find(dose=>dose.kind==='work').value,area.count<=3?'2 min':'4 min','Two continuous tactical halves are one uninterrupted playing period');
      if(block.diagram==='football-warmup'){assert.equal(phasePlan.length,3,'Warm-up remains three understandable main phases');assert.equal(phasePlan[2].parts.filter(part=>part.kind==='rest').length,2,'Passing includes both thirty-second breaks');assert.equal(phasePlan[2].parts.filter(part=>part.kind==='water')[0].actualSeconds,60,'Warm-up retains the final water minute');}
      for(const phase of scene.phases){
        assert.ok(phase.end>phase.start);
        for(const person of people){assert.equal(phase.roles[person.id].visible,true,'No child disappears during rotation');}
        const roleCount=team=>people.filter(person=>phase.roles[person.id].team===team).length;
        if(phase.kind==='work'&&block.diagram==='football-rondo')assert.equal(roleCount('B'),area.count===2?0:area.count>=7?2:1,'Correct actual defender count');
        if(phase.kind==='work'&&['football-zones','football-mini-games'].includes(block.diagram))assert.equal(roleCount('N'),planner.form(area.count).neutral,'Correct neutral count through every rotation');
        for(const node of scene.nodes){const frames=scene.tracks[node.id];assert.ok(frames?.length);for(const time of [phase.start,phase.start+(phase.end-phase.start)/2,phase.end]){const p=scenes.sample(frames,time);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y),'Finite motion for every child and ball');}}
        checks++;
      }
      for(const node of scene.nodes){const frames=scene.tracks[node.id];for(let i=1;i<frames.length;i++)assert.ok(frames[i][0]>frames[i-1][0],'Timeline has no duplicate or backward keyframes');const end=scenes.sample(frames,scene.duration),finished=scenes.sample(frames,scene.phases.at(-1).start);assert.ok(Math.hypot(end.x-finished.x,end.y-finished.y)<1e-8,'Completion holds the final pose without an artificial return');}
      assert.equal(scene.loopMode,'cut','Repetition restarts the diagram without pretending the actors run back');
      for(const phase of scene.phases.filter(p=>p.kind==='work'))assert.equal(phase.ready,phase.start,'Action starts immediately without a preparation glide');
      // Every complete passing circuit still reaches the real receiver after role mapping.
      for(const pass of scene.transfers){const ball=scenes.sample(scene.tracks[pass.ballId],pass.arrive),receiver=scenes.sample(scene.tracks[pass.to],pass.arrive);assert.ok(Math.hypot(ball.x-receiver.x,ball.y-receiver.y)<scene.pitch.w*.08,'Ball reaches the mapped receiver');}
      if(block.diagram==='football-warmup'){
        const passPhases=scene.phases.filter(p=>p.name.startsWith('Prihrávky'));
        assert.equal(passPhases.length,3);
        const groupCounts=training.planConfig.groupSizes.slice(index*2,index*2+2),expectedBalls=groupCounts.reduce((sum,count)=>sum+Math.floor(count/2),0);
        for(const phase of passPhases)assert.equal(scene.nodes.filter(node=>node.kind==='ball'&&phase.roles[node.id].visible).length,expectedBalls,'Pairs and trios stay inside their own skill group');
      }
      if(block.diagram==='football-rondo'&&area.count>2){
        const counts=people.map(person=>scene.phases.filter(p=>p.kind==='work'&&p.roles[person.id].team==='B').length);
        assert.ok(counts.every(count=>count===(area.count>=7?4:2)),'Every child completes both series of defensive rotations');
      }
    }
  }
}
assert.equal(JSON.stringify(source),JSON.stringify(JSON.parse(read('trainings.json')).trainings.find(t=>t.id==='2026-10-29')),'Training archive remains unchanged');
const cut=[[0,0,0],[1,10,0],[2,100,0,'cut'],[3,110,0]];
assert.equal(scenes.sample(cut,1.5).x,10,'A formation change does not drag players across the pitch');
assert.equal(scenes.sample(cut,2).x,100,'The new formation appears exactly at its phase boundary');
assert.equal(scenes.sample(cut,2.5).x,105,'Normal action moves immediately after the cut');
console.log(`PASS: ${checks} sequence phases; 10–30 players, all pitch presets and skill levels; original doses, roles, receivers, direct starts and logical cuts; grouped phase coverage, work/rest/water totals and six static preparation maps.`);
