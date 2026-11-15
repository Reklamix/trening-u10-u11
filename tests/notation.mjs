import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const {N,F}=vm.runInNewContext(read('football.js').split('// FOOTBALL_BROWSER')[0]+';({N:FootballNotation,F:FootballScenes})');
let cases=0;
for(const kind of ['run','pass','shot','dribble'])for(const end of [{x:90,y:0},{x:0,y:90},{x:-90,y:-90},{x:.1,y:.1},{x:0,y:0}])for(const inset of [0,13]){
 const points=[{x:0,y:0},{x:0,y:0},end],before=JSON.stringify(points),shape=N.arrow(points,kind,1,inset);
 assert.equal(JSON.stringify(points),before,'Drawing must never change animation coordinates');
 assert.ok(!/NaN|Infinity/.test(shape.path+shape.head));
 assert.equal(Boolean(shape.dash),kind==='run','FIFA example: only off-ball runs are dashed');
 if(end.x||end.y){
   const tail=shape.path.match(/L([^L]+)$/)[1].trim().split(' ').map(Number),tip=shape.head.match(/^M([^L]+)/)[1].split(' ').map(Number);
   assert.ok(Math.hypot(tail[0]-tip[0],tail[1]-tip[1])<.002,'Arrowhead and line end together in every direction');
 }else assert.equal(shape.path,'');
 cases++;
}
const route=[{x:0,y:0},{x:100,y:0}];
assert.notEqual(N.arrow(route,'dribble').path,N.arrow(route,'pass').path);
assert.equal(N.arrow(route,'shot').path,N.arrow(route,'pass').path,'Shot is kicked-ball direction, not a translated double line');
for(const key of F.keys)for(const size of [4,5,6,10]){
 const scene=F.build(key,{total:20,size,pitchIndex:0});
 for(const a of scene.arrows){assert.ok(['run','pass','shot','dribble'].includes(a.kind),a.kind);const s=N.arrow(a.points,a.kind);assert.ok(!/NaN|Infinity/.test(s.path+s.head));cases++;}
}
assert.ok(read('football.js').includes('FootballNotation.arrow(points,a.kind'),'Live render shares the legend notation');
assert.ok(read('app.js').includes('FootballNotation.arrow('),'Archived diagrams share the notation');
console.log(`PASS notation: ${cases} geometry cases; source convention, immutable coordinates and shared rendering`);
