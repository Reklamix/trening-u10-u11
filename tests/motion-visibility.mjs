import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const {N,F}=vm.runInNewContext(read('football.js').split('// FOOTBALL_BROWSER')[0]+';({N:FootballNotation,F:FootballScenes})');
const fixture={duration:5,nodes:[{id:'p0',kind:'player',x:0,y:0},{id:'p1',kind:'player',x:100,y:0},{id:'ball',kind:'ball',x:5,y:5}],tracks:{p0:[[0,0,0],[5,0,0]],p1:[[0,100,0],[5,100,0]],ball:[[0,5,5],[1,100,5],[2,100,5],[3,5,5],[5,5,5]]},arrows:[{kind:'pass',points:[{x:0,y:0},{x:100,y:0}]},{kind:'pass',points:[{x:100,y:0},{x:0,y:0}]}]};
const m=N.prepare(fixture);
assert.equal(N.motion(fixture,m[0],.5).active,true);
assert.equal(N.motion(fixture,m[1],.5).active,false,'Do not highlight the reverse pass');
assert.equal(N.motion(fixture,m[0],1.5).active,false,'Stationary ball is not a pass');
assert.equal(N.motion(fixture,m[1],2.5).active,true);
assert.equal(N.motion(fixture,m[1],2.5).actor,'p1');
const cut=structuredClone(fixture);cut.tracks.ball[1][3]='cut';assert.equal(N.motion(cut,N.prepare(cut)[0],.5).active,false,'Regrouping is not a kicked ball');
const run={duration:4,nodes:[{id:'p',kind:'player',x:0,y:0}],tracks:{p:[[0,0,0],[1,25,0],[2,50,0],[2.01,200,0,'cut'],[4,250,0]]},arrows:[{kind:'run',start:0,end:4,points:[{x:0,y:0},{x:50,y:0}]}]};
const route=N.motion(run,N.prepare(run)[0],.6);
assert.ok(route.points.at(-1).x<=50,'Preview never crosses a positional cut');
assert.ok(route.points.at(-1).x>route.points[0].x+20,'Visible route ahead of the player');
let cases=0;
for(const key of F.keys)for(const size of [4,5,6,10]){
 const scene=F.build(key,{total:20,size,pitchIndex:0}),before=JSON.stringify(scene),motions=N.prepare(scene);
 for(const item of motions)for(const t of [item.start,(item.start+item.end)/2,item.end]){
   const display=N.motion(scene,item,t),shape=N.arrow(display.points,item.arrow.kind,1.35);
   assert.ok(!/NaN|Infinity/.test(shape.path+shape.head));
   if(t===item.end)assert.equal(display.visible,false);
   if(display.active)assert.ok(display.visible);
   cases++;
 }
 assert.equal(JSON.stringify(scene),before,'Mobile emphasis never changes scene/timing/positions');
}
console.log(`PASS motion visibility: ${cases} states, pass direction/hold/cuts, real lookahead and immutable scenes`);
