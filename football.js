'use strict';

class FootballTimeline {
  constructor(duration) { this.duration=duration; this.value=0; this.origin=null; }
  time(now=performance.now()) { return Math.min(this.duration, this.value+(this.origin===null?0:(now-this.origin)/1000)); }
  play(now=performance.now()) { if(this.time(now)>=this.duration)this.value=0; if(this.origin===null)this.origin=now; }
  pause(now=performance.now()) { this.value=this.time(now); this.origin=null; }
  seek(value) { this.value=Math.max(0,Math.min(this.duration,Number(value)||0)); this.origin=null; }
}

const FootballScenes = {
  keys:['football-warmup','football-pass','football-rondo','football-zones','football-matches','football-finish'],
  sample(frames,time) {
    if(time<=frames[0][0])return {x:frames[0][1],y:frames[0][2]};
    for(let i=1;i<frames.length;i++)if(time<=frames[i][0]){
      const a=frames[i-1],b=frames[i],u=(time-a[0])/(b[0]-a[0]);
      return {x:a[1]+(b[1]-a[1])*u,y:a[2]+(b[2]-a[2])*u};
    }
    return {x:frames.at(-1)[1],y:frames.at(-1)[2]};
  },
  build(key,{total=19,size=5,pitchIndex=0}={}) {
    if(!this.keys.includes(key))throw Error('Unknown football scene');
    const scene={key,nodes:[],tracks:{},arrows:[],steps:[],duration:6,pitch:{x:72,y:40,w:216,h:216,length:12,width:12},caption:'Jedna ukážková akcia; hráči si v hre vyberajú riešenie.',total,size,pitchIndex};
    const point=(u,v)=>({x:scene.pitch.x+u*scene.pitch.w,y:scene.pitch.y+v*scene.pitch.h});
    const add=(id,label,u,v,team='A',kind='player')=>{const p=point(u,v);scene.nodes.push({id,label,...p,team,kind});return [u,v];};
    const track=(id,frames)=>{scene.tracks[id]=frames.map(([t,u,v])=>{const p=point(u,v);return[t,p.x,p.y];});};
    const line=(kind,number,points)=>scene.arrows.push({kind,number,points:points.map(([u,v])=>point(u,v))});
    const step=(time,text)=>scene.steps.push({time,text});
    if(key==='football-warmup') {
      scene.pitch={x:45,y:40,w:270,h:216,length:25,width:20};
      const n=pitchIndex?Math.ceil(total/2):Math.floor(total/2); scene.localCount=n;scene.duration=4;
      for(let i=0;i<n;i++){const u=.16+(i%3)*.34,v=.14+Math.floor(i/3)*.24;add('p'+i,String(i+1),u,v);add(i===0?'ball':'b'+i,'',u+.035,v+.025,'A','ball');}
      track('p0',[[0,.16,.14],[2,.28,.23],[4,.24,.29]]);track('ball',[[0,.195,.165],[2,.315,.255],[4,.275,.315]]);
      line('dribble',1,[[.16,.14],[.28,.23]]);line('dribble',2,[[.28,.23],[.24,.29]]);
      step(0,'Vedenie lopty pod kontrolou.');step(2,'Zmeň smer a pozri sa do priestoru.');step(4,'Znovu pokojne kontroluj loptu.');
      scene.caption=`Zóna ${pitchIndex?'B':'A'}: ${n} detí. Obe zóny spolu ${total}. Ukážka úvodného vedenia, potom sa pracuje vo dvojiciach/trojici.`;
    } else if(key==='football-pass') {
      const positions=[[.15,.6],[.65,.2],[.9,.65],[.45,.9],[.2,.15],[.8,.9]];
      positions.slice(0,size).forEach(([u,v],i)=>add('p'+i,String(i+1),u,v)); add('ball','',.185,.62,'A','ball');
      track('ball',[[0,.185,.62],[2,.68,.22],[4,.68,.22],[6,.78,.37]]);
      track('p0',[[0,.15,.6],[2,.15,.6],[4,.28,.8],[6,.28,.8]]);track('p1',[[0,.65,.2],[4,.65,.2],[6,.75,.35]]);
      line('pass',1,[[.185,.62],[.65,.2]]);line('run',2,[[.15,.6],[.28,.8]]);line('dribble',3,[[.65,.2],[.75,.35]]);
      step(0,'1. Prihrávka hráča 1 na hráča 2.');step(2,'2. Hráč 1 mení miesto a vytvára nový uhol.');step(4,'3. Hráč 2 si prvým dotykom pripraví ďalšie riešenie.');step(6,'Potom pokračuje prihrávka na ďalšie číslo.');
      scene.localCount=size;scene.caption=`Počet v skupine: ${size}. Poradie 1 → 2 → … → ${size} → 1; po prihrávke nový uhol.`;
    } else if(key==='football-rondo') {
      const pos=[];
      for(let i=0;i<size-1;i++){const a=Math.PI+i*2*Math.PI/(size-1);pos.push([.5+.39*Math.cos(a),.5+.39*Math.sin(a)]);add('p'+i,String(i+2),...pos[i]);}
      add('def','D1',.5,.5,'B');add('ball','',pos[0][0]+.03,pos[0][1]+.02,'A','ball');
      track('ball',[[0,pos[0][0]+.03,pos[0][1]+.02],[2,pos[1][0]+.03,pos[1][1]+.02],[4,pos[1][0]+.03,pos[1][1]+.02],[6,pos[2][0]+.03,pos[2][1]+.02]]);
      const free=[.5+.39*Math.cos(Math.PI+.3),.5+.39*Math.sin(Math.PI+.3)];
      track('p0',[[0,...pos[0]],[2,...pos[0]],[4,...free],[6,...free]]);track('def',[[0,.5,.5],[2,.5,.5],[4,.5,.37],[6,.53,.45]]);
      line('pass',1,[pos[0],pos[1]]);line('run',2,[pos[0],free]);line('pass',3,[pos[1],pos[2]]);
      step(0,'1. Prihraj dostupnému hráčovi vedľa obrancu.');step(2,'2. Po prihrávke vytvor nový uhol.');step(4,'3. Lopta pokračuje na ďalšiu voľnú možnosť.');step(6,'Obranca sa mení až na signál podľa rotácie.');
      scene.localCount=size;scene.caption=`${size-1} na 1: obranca D1 a hráči 2–${size}. Jedna ukážka; ďalšieho obrancu určuje tabuľka rotácií.`;
    } else if(key==='football-zones') {
      scene.pitch={x:40,y:46,w:280,h:196,length:20,width:14,zones:true};
      add('a1','A1',.2,.28);add('a2','A2',.22,.72);add('b1','B1',.6,.25,'B');add('b2','B2',.62,.65,'B');
      if(size>=5)add('n1','N1',.45,.5,'N');if(size===6)add('n2','N2',.4,.89,'N');add('ball','',.23,.3,'A','ball');
      const route=[[.22,.72],[.48,.92],[.76,.92],[.94,.72]];
      track('a2',[[0,...route[0]],[2,...route[0]],[2.65,...route[1]],[3.35,...route[2]],[4,...route[3]],[6,...route[3]]]);
      if(size>=5){track('ball',[[0,.23,.3],[2,.48,.52],[4,.48,.52],[6,.96,.74]]);line('pass',1,[[.2,.28],[.45,.5]]);line('pass',3,[[.45,.5],[.94,.72]]);}
      else {track('ball',[[0,.23,.3],[4,.23,.3],[6,.96,.74]]);line('pass',3,[[.2,.28],[.94,.72]]);}
      line('run',2,route);step(0,size>=5?'1. Prihrávka neutrálnemu hráčovi.':'1. Hráč s loptou si pripraví prihrávku.');step(2,'2. A2 nabieha okolo obrancu do voľnej zóny.');step(4,'3. Prihrávka do nábehu, príjem v koncovej zóne.');step(6,'Bod získava A2. Neutrálny sám neboduje.');
      scene.localCount=size;scene.caption=`2 na 2${size>4?' + '+(size-4)+' N':''}. Zóny hlboké 2 m. Ukážka prihrávky; platí aj kontrolované vedenie do zóny.`;
    } else if(key==='football-matches') {
      const n=pitchIndex?Math.floor(total/2):Math.ceil(total/2),side=Math.floor(n/2),large=total>=23;
      scene.pitch={x:40,y:40,w:280,h:large?280*26/36:210,length:large?36:32,width:large?26:24,goals:true};
      const positions=[[.15,.28],[.15,.72],[.32,.5],[.36,.22],[.36,.88],[.46,.28]];
      for(let i=0;i<side;i++){add('a'+i,'A'+(i+1),...positions[i]);add('b'+i,'B'+(i+1),1-positions[i][0],positions[i][1],'B');}
      if(n%2)add('neutral','N',.5,.58,'N');add('ball','',.18,.3,'A','ball');scene.duration=8;
      track('a0',[[0,.15,.28],[2,.15,.28],[3,.22,.05],[4,.5,.05],[6,.5,.05],[7,.78,.12],[8,.78,.12]]);
      track('b3',[[0,.64,.22],[2,.64,.22],[4,.66,.4],[8,.66,.4]]);
      track('ball',[[0,.18,.3],[2,.35,.52],[4,.35,.52],[6,.53,.07],[7,.81,.14],[8,1.015,.25]]);
      line('pass',1,[[.15,.28],[.32,.5]]);line('run',2,[[.15,.28],[.22,.05],[.5,.05]]);line('pass',3,[[.32,.5],[.5,.05]]);line('dribble',4,[[.5,.05],[.78,.12]]);line('shot',5,[[.78,.12],[1.015,.25]]);
      step(0,'1. Prihraj spoluhráčovi.');step(2,'2. Znovu sa ponúkni do voľného priestoru.');step(4,'3. Spoluhráč vráti loptu do nábehu.');step(6,'4. Priprav si zakončenie vedením lopty.');step(7,'5. Zakonči na voľnú malú bránku.');step(8,'Príklad jednej akcie; v zápase hráči rozhodujú sami.');
      scene.localCount=n;scene.caption=`Ihrisko ${pitchIndex?'B':'A'}: ${side} na ${side}${n%2?' + N':''} = ${n} detí. Obe ihriská spolu ${total}. Čísla A/B označujú roly tímov.`;
    } else {
      scene.pitch=null;scene.duration=0;scene.localCount=total;
      for(let i=0;i<total;i++){const a=.1*Math.PI+i*1.8*Math.PI/(total-1);scene.nodes.push({id:'p'+i,label:String(i+1),x:180+125*Math.cos(a),y:145+72*Math.sin(a),team:'A',kind:'player'});}
      scene.nodes.push({id:'coach',label:'T',x:180,y:145,team:'T',kind:'coach'});step(0,'Kam si sa pohol po prihrávke?');scene.caption='Pokojná chôdza, voda a jeden konkrétny vydarený príklad.';
    }
    return scene;
  }
};

// FOOTBALL_BROWSER
(() => {
  let active=null;
  const NS='http://www.w3.org/2000/svg';
  const colors={A:'#176ca2',B:'#c14e33',N:'#eed06b',T:'#d6dfd0'};
  const svgNode=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
  const html=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
  function routePath(points,wavy=false) {
    const result=[];
    for(let j=1;j<points.length;j++){
      const a=points[j-1],b=points[j],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
      for(let i=0;i<=30;i++){const u=i/30,off=wavy?2*Math.sin(u*8*Math.PI):0;result.push([a.x+dx*u-dy/len*off,a.y+dy*u+dx/len*off]);}
    }
    return result.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join(' ');
  }
  function mount(parent,block,options) {
    clear();
    let pitchIndex=0,scene,clock,frame=null,lastStep=-1,focusDialog=null;
    const root=html('div','football-board');
    const selectors=html('div','football-selectors');
    const choose=(label,values,selected,callback)=>{const wrap=html('label','football-select-label',label),select=html('select');select.setAttribute('aria-label',label);values.forEach(([value,text])=>{const option=html('option','',text);option.value=value;select.append(option);});select.value=selected;select.addEventListener('change',()=>callback(Number(select.value)));wrap.append(select);selectors.append(wrap);};
    if(['football-warmup','football-matches'].includes(block.diagram))choose(block.diagram==='football-warmup'?'Zobrazená zóna':'Zobrazené ihrisko',[[0,'A'],[1,'B']],0,value=>{pitchIndex=value;build();});
    if(['football-pass','football-rondo','football-zones'].includes(block.diagram))choose('Hráčov v tejto skupine',options.groups.map(n=>[n,'Skupina '+n]),options.size,value=>{options.size=value;build();options.onGroupChange(value);});
    const expand=html('button','secondary-button football-expand','Zväčšiť');expand.type='button';expand.setAttribute('aria-label','Zväčšiť schému a animáciu');selectors.append(expand);
    const figure=html('figure','diagram football-figure'),svg=svgNode('svg',{viewBox:'0 0 360 310',role:'img','aria-label':block.title});figure.append(svg);
    const caption=html('p','football-caption');
    const status=html('p','football-status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
    const controls=html('div','football-controls'),play=html('button','button','Prehrať'),next=html('button','secondary-button','Ďalší krok'),reset=html('button','secondary-button','Od začiatku');
    for(const b of[play,next,reset])b.type='button';controls.append(play,next,reset);
    const scrub=html('input','football-scrub');scrub.type='range';scrub.min='0';scrub.step='.01';scrub.setAttribute('aria-label','Priebeh animovanej ukážky');
    const note=html('p','small-note','Spomalená ukážka jednej akcie. Prehrávanie nemení časovač tréningu.');
    const legend=html('details','diagram-help');legend.append(html('summary','','Futbalové značky a celý plán'));
    const list=html('div','football-legend');
    for(const[k,label]of[['player','Hráč A/B'],['neutral','Neutrálny N'],['ball','Lopta'],['run','Beh bez lopty'],['pass','Prihrávka'],['dribble','Vedenie lopty'],['shot','Strela'],['cone','Méta']]){
      const item=html('span','football-legend-item'),icon=svgNode('svg',{viewBox:'0 0 36 22','aria-hidden':'true'});
      if(k==='player'||k==='neutral')icon.append(svgNode('circle',{cx:17,cy:11,r:8,fill:k==='neutral'?colors.N:colors.A}));
      else if(k==='ball')icon.append(svgNode('circle',{cx:17,cy:11,r:5,fill:'white',stroke:'#173b31'}),svgNode('circle',{cx:17,cy:11,r:2,fill:'#173b31'}));
      else if(k==='cone')icon.append(svgNode('path',{d:'M17 3L9 18H25Z',fill:'#dc8d26'}));
      else {icon.append(svgNode('path',{d:k==='dribble'?'M2 11L6 6L10 16L14 6L18 16L22 6L26 11L33 11':k==='shot'?'M2 8H30M2 14H30':'M2 11H32',fill:'none',stroke:'#173b31','stroke-width':2,...(k==='pass'?{'stroke-dasharray':'4 3'}:{})}),svgNode('path',{d:'M33 11L27 7V15Z',fill:'#173b31'}));}
      item.append(icon,document.createTextNode(label));list.append(item);
    }
    legend.append(caption,list);
    if(/^\.\/assets\/[a-z0-9._-]+\.png$/i.test(options.sheet||'')){const a=html('a','guide-link','Otvoriť všetkých šesť schém ↗');a.href=options.sheet;a.target='_blank';a.rel='noopener noreferrer';legend.append(a);}
    root.append(selectors,controls,figure,status,scrub,note,legend);parent.append(root);
    let actors=new Map();
    function build() {
      pause();scene=FootballScenes.build(block.diagram,{total:options.total,size:options.size,pitchIndex});clock=new FootballTimeline(scene.duration);svg.replaceChildren();actors=new Map();lastStep=-1;
      const p=scene.pitch;
      if(p){
        svg.append(svgNode('rect',{x:p.x,y:p.y,width:p.w,height:p.h,fill:'#e5eddd',stroke:'#638268','stroke-width':1.2}));
        if(p.zones)for(const x of[p.x,p.x+p.w*.9])svg.append(svgNode('rect',{x,y:p.y,width:p.w*.1,height:p.h,fill:'#cfdcbd',stroke:'#638268'}));
        for(const[x,y]of[[p.x,p.y],[p.x+p.w,p.y],[p.x,p.y+p.h],[p.x+p.w,p.y+p.h]])svg.append(svgNode('path',{d:`M${x} ${y-4}l-4 7h8z`,fill:'#dc8d26'}));
        if(p.goals)for(const x of[p.x-6,p.x+p.w])for(const u of[.25,.7]){const y=p.y+p.h*u;svg.append(svgNode('rect',{x,y:y-8,width:6,height:16,fill:'white',stroke:'#173b31'}),svgNode('path',{d:`M${x} ${y-3}h6M${x} ${y+3}h6`,stroke:'#638268'}));}
        svg.append(svgNode('text',{x:180,y:p.y+p.h+22,'text-anchor':'middle',fill:'#596c63','font-size':11},`${p.length} × ${p.width} m${p.zones?' · zóny 2 m':''}`));
      }
      for(const a of scene.arrows){
        const points=a.points,b=points.at(-1),v=points.at(-2),angle=Math.atan2(b.y-v.y,b.x-v.x);
        const path=routePath(points,a.kind==='dribble');
        if(a.kind==='shot')for(const dy of[-1.5,1.5])svg.append(svgNode('path',{d:path,transform:`translate(0 ${dy})`,fill:'none',stroke:'#173b31','stroke-width':1}));
        else svg.append(svgNode('path',{d:path,fill:'none',stroke:'#173b31','stroke-width':1.4,...(a.kind==='pass'?{'stroke-dasharray':'4 3'}:{})}));
        svg.append(svgNode('path',{d:`M${b.x} ${b.y}L${b.x-7*Math.cos(angle-.4)} ${b.y-7*Math.sin(angle-.4)}L${b.x-7*Math.cos(angle+.4)} ${b.y-7*Math.sin(angle+.4)}Z`,fill:'#173b31'}));
        const mid=points[Math.floor((points.length-1)/2)],end=points[Math.ceil((points.length-1)/2)]||mid;
        svg.append(svgNode('text',{x:(mid.x+end.x)/2+5,y:(mid.y+end.y)/2-5,fill:'#173b31','font-size':9,'font-weight':700,'paint-order':'stroke',stroke:'white','stroke-width':3},String(a.number)));
      }
      for(const node of scene.nodes){
        const g=svgNode('g',{'data-actor':node.id,transform:`translate(${node.x} ${node.y})`});
        const r=node.kind==='ball'?4:scene.localCount>12?7:10;
        if(node.kind==='coach')g.append(svgNode('rect',{x:-11,y:-11,width:22,height:22,rx:2,fill:colors.T,stroke:'#173b31'}));
        else g.append(svgNode('circle',{cx:0,cy:0,r,fill:node.kind==='ball'?'white':colors[node.team],stroke:node.kind==='ball'?'#173b31':'white','stroke-width':1}));
        if(node.kind==='ball')g.append(svgNode('circle',{cx:0,cy:0,r:1.5,fill:'#173b31'}));
        else g.append(svgNode('text',{x:0,y:.5,'text-anchor':'middle','dominant-baseline':'middle',fill:['N','T'].includes(node.team)?'#173b31':'white','font-size':r===7?7:9,'font-weight':650},node.label));
        svg.append(g);actors.set(node.id,g);
      }
      caption.textContent=scene.caption;scrub.max=String(scene.duration);controls.hidden=scene.duration===0;scrub.hidden=scene.duration===0;note.hidden=scene.duration===0;
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){play.hidden=true;note.textContent='Obmedzený pohyb: použi Ďalší krok alebo posuvník. Časovač tréningu sa nemení.';}
      render();
    }
    function render() {
      if(!clock)return;
      const time=clock.time();
      for(const[id,frames]of Object.entries(scene.tracks)){const p=FootballScenes.sample(frames,time);actors.get(id)?.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);}
      let index=0;scene.steps.forEach((s,i)=>{if(time>=s.time-.001)index=i;});
      if(index!==lastStep){status.textContent=scene.steps[index].text;lastStep=index;}
      scrub.value=String(time);next.disabled=time>=scene.duration;play.textContent=clock.origin===null?'Prehrať':'Pauza';
      if(time>=scene.duration&&clock.origin!==null){clock.pause();play.textContent='Prehrať';}
    }
    function tick(){render();if(clock.origin!==null)frame=requestAnimationFrame(tick);else frame=null;}
    function pause(){if(frame!==null)cancelAnimationFrame(frame);frame=null;if(clock){clock.pause();render();}}
    expand.addEventListener('click',()=>{
      pause();
      expand.hidden=true;
      const dialog=html('dialog','football-focus'),close=html('button','secondary-button football-close','Späť k tréningu');close.type='button';
      dialog.setAttribute('aria-label','Zväčšená futbalová schéma');close.addEventListener('click',()=>dialog.close());dialog.append(close,root);document.body.append(dialog);focusDialog=dialog;
      dialog.addEventListener('close',()=>{pause();if(root.isConnected&&parent.isConnected)parent.append(root);dialog.remove();if(focusDialog===dialog)focusDialog=null;expand.hidden=false;expand.focus();});
      dialog.showModal();
    });
    play.addEventListener('click',()=>{if(clock.origin!==null)pause();else{clock.play();render();frame=requestAnimationFrame(tick);}});
    next.addEventListener('click',()=>{pause();const nextStep=scene.steps.find(s=>s.time>clock.time()+.02);clock.seek(nextStep?nextStep.time:scene.duration);render();});
    reset.addEventListener('click',()=>{pause();clock.seek(0);render();});
    scrub.addEventListener('input',()=>{const value=scrub.value;pause();clock.seek(value);render();});
    active={pause,destroy:()=>{pause();root.remove();if(focusDialog){const dialog=focusDialog;focusDialog=null;dialog.close();dialog.remove();}}};build();
  }
  function clear(){active?.destroy();active=null;}
  window.FootballBoard={supports:key=>FootballScenes.keys.includes(key),mount,pause:()=>active?.pause(),clear};
})();
