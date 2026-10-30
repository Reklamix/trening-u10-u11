import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const {scenes,planner,sequences}=runInNewContext(read('football.js').split('// FOOTBALL_BROWSER')[0]+'\n'+read('training-planner.js')+'\n'+read('football-sequence.js')+'\n({scenes:FootballScenes,planner:TrainingPlanner,sequences:FootballSequences})');
const source=JSON.parse(read('trainings.json')).trainings.find(t=>t.id==='2026-10-29');
let cases=0;
for(let total=10;total<=30;total++)for(const pitch of ['quarter','half','full']){
  const training=planner.adapt(source,{players:total,pitch}),block=training.blocks[0];
  for(const area of scenes.groups(block.diagram,total,training.quarterPitch)){
    const scene=scenes.build(block.diagram,{total,area,pitchIndex:area.index}),people=scene.nodes.filter(p=>p.kind==='player');
    for(const person of people){
      const path=scene.tracks[person.id],ball=scene.tracks[person.id==='p0'?'ball':'b'+person.id.slice(1)];
      const xs=path.map(p=>p[1]),ys=path.map(p=>p[2]);
      assert.ok(Math.max(...xs)-Math.min(...xs)>scene.pitch.w*.3,'Every child traverses a substantial part of the shared area');
      assert.ok(Math.max(...ys)-Math.min(...ys)>scene.pitch.h*.15,'Children also change lanes instead of moving in fixed rows');
      assert.ok(people.some(other=>other!==person&&scene.tracks[other.id].filter((_,i)=>i%10===0).some(otherPoint=>path.some(p=>Math.hypot(p[1]-otherPoint[1],p[2]-otherPoint[2])<24))),'Routes share space at different times instead of remaining in separate personal cells');
      for(let i=0;i<path.length;i++){
        assert.ok(Math.hypot(ball[i][1]-path[i][1],ball[i][2]-path[i][2])<12,'The own ball travels with the player');
        assert.ok(path[i][1]>=scene.pitch.x+10&&path[i][1]<=scene.pitch.x+scene.pitch.w-10&&path[i][2]>=scene.pitch.y+10&&path[i][2]<=scene.pitch.y+scene.pitch.h-10,'No child leaves the available area');
      }
    }
    for(let a=0;a<people.length;a++)for(let b=a+1;b<people.length;b++){
      const first=scene.tracks[people[a].id],second=scene.tracks[people[b].id];
      for(let i=1;i<first.length;i++){
        const rx=first[i-1][1]-second[i-1][1],ry=first[i-1][2]-second[i-1][2],vx=first[i][1]-second[i][1]-rx,vy=first[i][2]-second[i][2]-ry,u=Math.max(0,Math.min(1,-(rx*vx+ry*vy)/(vx*vx+vy*vy||1)));
        assert.ok(Math.hypot(rx+u*vx,ry+u*vy)>24,'Children avoid overlap even between motion keyframes');
      }
    }
    const sequence=sequences.build(training,block,area.index,scene),dribbling=sequence.phases.find(p=>p.name==='Vedenie lopty');
    assert.equal(dribbling.actualSeconds,180,'The approved training dose is unchanged');
    assert.ok(dribbling.end-dribbling.ready>=scene.duration,'Composing the exercise does not compress the large movement back into a tiny twitch');
    cases++;
  }
}
console.log(`PASS: ${cases} warmup areas; full-space movement, shared paths, ball coupling and continuous separation; 10–30 players.`);
