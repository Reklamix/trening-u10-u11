'use strict';

class FootballTimeline {
  constructor(duration) { this.duration=duration; this.value=0; this.origin=null; this.rate=1; this.loop=false; }
  time(now=performance.now()) {
    const value=this.value+(this.origin===null?0:(now-this.origin)/1000*this.rate);
    return this.loop&&this.origin!==null&&this.duration>0?value%this.duration:Math.min(this.duration,value);
  }
  setRate(rate,now=performance.now()) {
    if(![.25,.5,1,1.5].includes(rate))throw new RangeError('Unsupported animation rate');
    this.value=this.time(now);if(this.origin!==null)this.origin=now;this.rate=rate;
  }
  setLoop(loop,now=performance.now()) { this.value=this.time(now);if(this.origin!==null)this.origin=now;this.loop=Boolean(loop); }
  play(now=performance.now()) { if(this.time(now)>=this.duration)this.value=0; if(this.origin===null)this.origin=now; }
  pause(now=performance.now()) { this.value=this.time(now); this.origin=null; }
  seek(value) { this.value=Math.max(0,Math.min(this.duration,Number(value)||0)); this.origin=null; }
}

const FootballScenes = {
  keys:['football-warmup','football-pass','football-rondo','football-zones','football-matches','football-mini-games','football-finish'],
  sample(frames,time) {
    if(time<=frames[0][0])return {x:frames[0][1],y:frames[0][2]};
    for(let i=1;i<frames.length;i++)if(time<=frames[i][0]){
      const a=frames[i-1],b=frames[i],u=(time-a[0])/(b[0]-a[0]);
      return {x:a[1]+(b[1]-a[1])*u,y:a[2]+(b[2]-a[2])*u};
    }
    return {x:frames.at(-1)[1],y:frames.at(-1)[2]};
  },
  build(key,{total=19,size=5,pitchIndex=0,area}={}) {
    if(!this.keys.includes(key))throw Error('Unknown football scene');
    const pitch=(x,y,w,length,width,extra={})=>{length=area?.length??length;width=area?.width??width;return{x,y,w,h:w*width/length,length,width,...extra};};
    const scene={key,nodes:[],tracks:{},arrows:[],steps:[],duration:6,pitch:pitch(72,40,216,12,12),caption:'Jedna ukážková akcia; hráči si v hre vyberajú riešenie.',total,size,pitchIndex};
    const point=(u,v)=>({x:scene.pitch.x+u*scene.pitch.w,y:scene.pitch.y+v*scene.pitch.h});
    const add=(id,label,u,v,team='A',kind='player')=>{const p=point(u,v);scene.nodes.push({id,label,...p,team,kind});return [u,v];};
    const track=(id,frames)=>{scene.tracks[id]=frames.map(([t,u,v])=>{const p=point(u,v);return[t,p.x,p.y];});};
    const line=(kind,number,points)=>{const arrow={kind,number,points:points.map(([u,v])=>point(u,v))};scene.arrows.push(arrow);return arrow;};
    const step=(time,text)=>scene.steps.push({time,text});
    const cycle=(initial,labels,finalText,withDefender=false)=>{
      const current=initial.map(p=>[...p]),poses=initial.map(p=>[[0,...p]]),ballFrames=[],defender=[[0,.5,.5]];
      const push=(frames,t,p)=>{const f=[t,...p];if(frames.at(-1)?.[0]===t)frames[frames.length-1]=f;else frames.push(f);};
      const foot=p=>[p[0]+.03,p[1]+.02];
      scene.transfers=[];
      for(let i=0;i<initial.length;i++){
        const receiver=(i+1)%initial.length,t=i*4,source=current[i],target=current[receiver];
        const dx=source[0]-.5,dy=source[1]-.5,a=-.24;
        const free=[.5+dx*Math.cos(a)-dy*Math.sin(a),.5+dx*Math.sin(a)+dy*Math.cos(a)];
        const next=current[(receiver+1)%initial.length],vx=next[0]-target[0],vy=next[1]-target[1],length=Math.hypot(vx,vy)||1;
        const touch=[Math.max(.08,Math.min(.92,target[0]+.045*vx/length)),Math.max(.08,Math.min(.92,target[1]+.045*vy/length))];
        push(poses[i],t+1.6,source);push(poses[i],t+3.2,free);
        push(poses[receiver],t+3.2,target);push(poses[receiver],t+4,touch);
        push(ballFrames,t,foot(source));push(ballFrames,t+1.6,foot(target));push(ballFrames,t+3.2,foot(target));push(ballFrames,t+4,foot(touch));
        Object.assign(line('pass',i*3+1,[source,target]),{start:t,end:t+1.6});
        Object.assign(line('run',i*3+2,[source,free]),{start:t+1.6,end:t+3.2});
        Object.assign(line('dribble',i*3+3,[target,touch]),{start:t+3.2,end:t+4});
        step(t,`Prihrávka ${labels[i]} → ${labels[receiver]}.`);step(t+1.6,`Hráč ${labels[i]} vytvára nový uhol ponuky.`);step(t+3.2,`Hráč ${labels[receiver]} pripraví prvým dotykom ďalšiu prihrávku.`);
        scene.transfers.push({from:'p'+i,to:'p'+receiver,depart:t,arrive:t+1.6,settled:t+4});
        current[i]=free;current[receiver]=touch;
        if(withDefender){push(defender,t,[.5,.5]);push(defender,t+2,[.5+(target[0]-.5)*.3,.5+(target[1]-.5)*.3]);push(defender,t+4,[.5,.5]);}
      }
      poses.forEach((frames,i)=>track('p'+i,frames));track('ball',ballFrames);if(withDefender)track('def',defender);
      scene.duration=initial.length*4+1.2;step(initial.length*4,finalText);
    };
    if(key==='football-warmup') {
      scene.pitch=pitch(45,40,270,25,20);
      const n=pitchIndex?Math.ceil(total/2):Math.floor(total/2); scene.localCount=n;scene.duration=4;
      const directions=[[.11,.04],[-.1,.06],[-.08,-.05],[.09,-.06],[.06,.07],[-.07,-.07]];
      for(let i=0;i<n;i++){
        const u=.16+(i%3)*.34,v=.14+Math.floor(i/3)*.24,[dx,dy]=directions[i%directions.length],ballId=i===0?'ball':'b'+i;
        const route=[[0,u,v],[1,u+dx*.7,v+dy*.2],[2,u+dx,v+dy],[3,u+dx*.15,v+dy*.9],[4,u,v]];
        add('p'+i,String(i+1),u,v);add(ballId,'',u+.035,v+.025,'A','ball');
        track('p'+i,route);track(ballId,route.map(([t,x,y])=>[t,x+.035,y+.025]));
        for(let leg=0;leg<4;leg++)Object.assign(line('dribble',i+1,[route[leg].slice(1),route[leg+1].slice(1)]),{start:leg,end:leg+1,label:false});
      }
      step(0,'Všetci súčasne vedú vlastnú loptu a sledujú voľný priestor.');step(1,'Meň smer a vyhni sa spoluhráčom.');step(2,'Krátke dotyky, lopta blízko nohy.');step(3,'Rozhliadni sa a pokračuj do voľna.');step(4,'Vedenie pokračuje; dráhy sú len ukážka.');
      scene.caption=`Zóna ${pitchIndex?'B':'A'}: ${n} detí. Obe zóny spolu ${total}. Všetci vedú loptu súčasne, každý svoju. Ukážkové dráhy nie sú povinné trasy ani stanovištia. Potom sa pracuje vo dvojiciach/trojici.`;
    } else if(key==='football-pass') {
      const positions=[[.15,.6],[.65,.2],[.9,.65],[.45,.9],[.2,.15],[.8,.9]];
      positions.slice(0,size).forEach(([u,v],i)=>add('p'+i,String(i+1),u,v)); add('ball','',.185,.62,'A','ball');
      cycle(positions.slice(0,size),Array.from({length:size},(_,i)=>String(i+1)),'Lopta sa vrátila k hráčovi 1. Celý obeh je dokončený.');
      scene.localCount=size;scene.caption=`Počet v skupine: ${size}. Celý obeh 1 → 2 → … → ${size} → 1; po každej prihrávke nový uhol.`;
    } else if(key==='football-rondo') {
      const pos=[];
      for(let i=0;i<size-1;i++){const a=Math.PI+i*2*Math.PI/(size-1);pos.push([.5+.39*Math.cos(a),.5+.39*Math.sin(a)]);add('p'+i,String(i+2),...pos[i]);}
      add('def','D1',.5,.5,'B');add('ball','',pos[0][0]+.03,pos[0][1]+.02,'A','ball');
      cycle(pos,Array.from({length:size-1},(_,i)=>String(i+2)),'Lopta je znovu pri hráčovi 2. Obranca sa mení až na signál podľa rotácie.',true);
      scene.localCount=size;scene.caption=`${size-1} na 1: obranca D1 a hráči 2–${size}. Ukážka celého obehu lopty; v hre hráči vyberajú voľnú možnosť.`;
    } else if(key==='football-zones') {
      scene.pitch=pitch(40,46,280,20,14,{zones:true});
      add('a1','A1',.2,.28);add('a2','A2',.22,.72);add('b1','B1',.6,.25,'B');add('b2','B2',.62,.65,'B');
      if(size>=5)add('n1','N1',.45,.5,'N');if(size===6)add('n2','N2',.4,.89,'N');add('ball','',.23,.3,'A','ball');
      const route=[[.22,.72],[.48,.92],[.76,.92],[.94,.72]];
      track('a2',[[0,...route[0]],[2,...route[0]],[2.65,...route[1]],[3.35,...route[2]],[4,...route[3]],[6,...route[3]]]);
      if(size>=5){track('ball',[[0,.23,.3],[2,.48,.52],[4,.48,.52],[6,.96,.74]]);line('pass',1,[[.2,.28],[.45,.5]]);line('pass',3,[[.45,.5],[.94,.72]]);}
      else {track('ball',[[0,.23,.3],[4,.23,.3],[6,.96,.74]]);line('pass',3,[[.2,.28],[.94,.72]]);}
      line('run',2,route);step(0,size>=5?'1. Prihrávka neutrálnemu hráčovi.':'1. Hráč s loptou si pripraví prihrávku.');step(2,'2. A2 nabieha okolo obrancu do voľnej zóny.');step(4,'3. Prihrávka do nábehu, príjem v koncovej zóne.');step(6,'Bod získava A2. Neutrálny sám neboduje.');
      scene.localCount=size;scene.caption=`2 na 2${size>4?' + '+(size-4)+' N':''}. Zóny hlboké 2 m. Ukážka prihrávky; platí aj kontrolované vedenie do zóny.`;
    } else if(key==='football-mini-games') {
      const n=Math.floor(total/4)+(pitchIndex<total%4?1:0);
      scene.pitch=pitch(40,46,280,14,9,{goals:true,goalGates:true});scene.localCount=n;scene.duration=8;
      add('a0','A1',.18,.32);add('a1','A2',.33,.7);add('b0','B1',.7,.12,'B');add('b1','B2',.65,.7,'B');
      if(n>=5)add('n1','N1',.36,.38,'N');if(n===6)add('n2','N2',.45,.86,'N');add('ball','',.21,.34,'A','ball');
      track('a0',[[0,.18,.32],[2,.18,.32],[3,.28,.1],[4,.53,.12],[6,.53,.12],[7,.81,.48],[8,.81,.48]]);
      track('ball',[[0,.21,.34],[2,.36,.72],[4,.36,.72],[6,.56,.14],[7,.84,.5],[8,1.015,.5]]);
      line('pass',1,[[.18,.32],[.33,.7]]);line('run',2,[[.18,.32],[.28,.1],[.53,.12]]);line('pass',3,[[.33,.7],[.53,.12]]);line('dribble',4,[[.53,.12],[.81,.48]]);line('pass',5,[[.81,.48],[1.015,.5]]);
      step(0,n>4?'1. Prihraj spoluhráčovi; neutrálny pomáha tímu s loptou.':'1. Prihraj spoluhráčovi.');step(2,'2. Znovu sa ponúkni do voľného priestoru.');step(4,'3. Spoluhráč vráti loptu do nábehu.');step(6,'4. Priprav si presné zakončenie.');step(7,'5. Pošli loptu po zemi cez kužeľovú bránku.');step(8,n>4?'Príklad jednej akcie. Neutrálny sám neboduje; v hre hráči rozhodujú sami.':'Príklad jednej akcie; v hre hráči rozhodujú sami.');
      scene.caption=`Ihrisko ${['A1','A2','B1','B2'][pitchIndex]}: 2 na 2${n>4?' + '+(n-4)+' N':''} = ${n} detí. Všetky štyri ihriská spolu ${total}. Dve kužeľové bránky široké 2 m; zakončenie po zemi.`;
    } else if(key==='football-matches') {
      const n=pitchIndex?Math.floor(total/2):Math.ceil(total/2),side=Math.floor(n/2),large=total>=23;
      scene.pitch=pitch(40,40,280,large?36:32,large?26:24,{goals:true});
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
    scene.cones=[];
    if(scene.pitch){
      for(const[u,v]of[[0,0],[1,0],[0,1],[1,1]])scene.cones.push({...point(u,v),kind:'corner'});
      if(scene.pitch.zones){const depth=2/scene.pitch.length;for(const[u,v]of[[depth,0],[depth,1],[1-depth,0],[1-depth,1]])scene.cones.push({...point(u,v),kind:'zone'});}
      if(scene.pitch.goalGates){const half=1/scene.pitch.width;for(const[u,v]of[[0,.5-half],[0,.5+half],[1,.5-half],[1,.5+half]])scene.cones.push({...point(u,v),kind:'gate'});}
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
    let pitchIndex=0,scene,clock,frame=null,lastStep=-1,lastComplete=false,focusDialog=null;
    const root=html('div','football-board');
    const selectors=html('div','football-selectors');
    const choose=(label,values,selected,callback)=>{const wrap=html('label','football-select-label',label),select=html('select');select.setAttribute('aria-label',label);values.forEach(([value,text])=>{const option=html('option','',text);option.value=value;select.append(option);});select.value=selected;select.addEventListener('change',()=>callback(Number(select.value)));wrap.append(select);selectors.append(wrap);};
    if(['football-warmup','football-matches','football-mini-games'].includes(block.diagram))choose(block.diagram==='football-warmup'?'Zobrazená zóna':'Zobrazené ihrisko',block.diagram==='football-mini-games'?[[0,'A1'],[1,'A2'],[2,'B1'],[3,'B2']]:[[0,'A'],[1,'B']],0,value=>{pitchIndex=value;build();});
    if(['football-pass','football-rondo','football-zones'].includes(block.diagram))choose('Hráčov v tejto skupine',options.groups.map(n=>[n,'Skupina '+n]),options.size,value=>{options.size=value;build();options.onGroupChange(value);});
    const expand=html('button','secondary-button football-expand','Zväčšiť');expand.type='button';expand.setAttribute('aria-label','Zväčšiť schému a animáciu');selectors.append(expand);
    const figure=html('figure','diagram football-figure'),svg=svgNode('svg',{viewBox:'0 0 360 310',role:'img','aria-label':block.title});figure.append(svg);
    const coneGuide=html('details','football-cone-guide');coneGuide.hidden=!block.coneSetup;
    const layoutGuide=html('details','football-cone-guide'),layout=options.quarterPitch,stage=layout?.stages?.[block.diagram];layoutGuide.hidden=!stage;
    if(stage){
      layoutGuide.append(html('summary','',`Celá 1/4: ${layout.assumed?'pracovný rozmer':'približne'} ${layout.width} × ${layout.height} m`),html('p','',layout.assumption));
      const map=svgNode('svg',{viewBox:`-2 -2 ${layout.width+4} ${layout.height+4}`,role:'img','aria-label':`Rozloženie celej štvrtiny: ${block.title}`,class:'football-layout-map'});
      map.append(svgNode('rect',{x:0,y:0,width:layout.width,height:layout.height,fill:'#e5eddd',stroke:'#173b31','stroke-width':.3}),svgNode('rect',{x:layout.corridor.x,y:0,width:layout.corridor.width,height:layout.height,fill:'#e7d5b7'}),svgNode('text',{x:layout.corridor.x+layout.corridor.width/2,y:layout.height/2,'text-anchor':'middle','font-size':1.8,fill:'#173b31'},String(layout.corridor.width)+' m'));
      for(const a of stage.areas){map.append(svgNode('rect',{x:a.x,y:a.y,width:a.w,height:a.h,fill:'#f6f8f1',stroke:'#216a4b','stroke-width':.35}),svgNode('text',{x:a.x+a.w/2,y:a.y+a.h/2-1,'text-anchor':'middle','font-size':2.1,'font-weight':700,fill:'#173b31'},a.label),svgNode('text',{x:a.x+a.w/2,y:a.y+a.h/2+2,'text-anchor':'middle','font-size':1.8,fill:'#173b31'},`${a.length} × ${a.width} m`));}
      layoutGuide.append(map,html('p','',stage.instructions));
    }
    const caption=html('p','football-caption');
    const status=html('p','football-status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
    const progress=html('output','football-progress');progress.setAttribute('aria-live','off');progress.setAttribute('aria-label','Priebeh celej ukážky');
    const controls=html('div','football-controls'),play=html('button','button','Prehrať'),next=html('button','secondary-button','Ďalší krok'),reset=html('button','secondary-button','Od začiatku');
    for(const b of[play,next,reset])b.type='button';controls.append(play,next,reset);
    const settings=html('div','football-playback-settings'),speedLabel=html('label','football-select-label','Rýchlosť animácie'),speed=html('select');speed.setAttribute('aria-label','Rýchlosť animácie');
    for(const[value,label]of[[.25,'0,25×'],[.5,'0,5×'],[1,'1×'],[1.5,'1,5×']]){const option=html('option','',label);option.value=value;speed.append(option);}speed.value='0.5';speedLabel.append(speed);
    const repeatLabel=html('label','football-repeat'),repeat=html('input');repeat.type='checkbox';repeat.checked=true;repeatLabel.append(repeat,document.createTextNode('Opakovať dokola'));settings.append(speedLabel,repeatLabel);
    const scrub=html('input','football-scrub');scrub.type='range';scrub.min='0';scrub.step='.01';scrub.setAttribute('aria-label','Priebeh animovanej ukážky');
    const note=html('p','small-note','Animáciu spustíš tlačidlom Prehrať. Tréningový časovač sa nemení.');
    const legend=html('details','diagram-help');legend.append(html('summary','','Futbalové značky a celý plán'));
    const list=html('div','football-legend');
    for(const[k,label]of[['player','Hráč A/B'],['neutral','Neutrálny N'],['ball','Lopta'],['run','Beh bez lopty'],['pass','Prihrávka'],['dribble','Vedenie lopty'],['shot','Strela'],['cone','Méta']]){
      const item=html('span','football-legend-item'),icon=svgNode('svg',{viewBox:'0 0 36 22','aria-hidden':'true'});
      if(k==='player'||k==='neutral')icon.append(svgNode('circle',{cx:17,cy:11,r:8,fill:k==='neutral'?colors.N:colors.A}));
      else if(k==='ball')icon.append(svgNode('circle',{cx:17,cy:11,r:5,fill:'white',stroke:'#173b31'}),svgNode('circle',{cx:17,cy:11,r:2,fill:'#173b31'}));
      else if(k==='cone')icon.append(svgNode('path',{d:'M17 2L8 19H26Z',fill:'#f47700',stroke:'#713708','stroke-width':1.5}),svgNode('path',{d:'M13 11H21',stroke:'white','stroke-width':2}));
      else {icon.append(svgNode('path',{d:k==='dribble'?'M2 11L6 6L10 16L14 6L18 16L22 6L26 11L33 11':k==='shot'?'M2 8H30M2 14H30':'M2 11H32',fill:'none',stroke:'#173b31','stroke-width':2,...(k==='pass'?{'stroke-dasharray':'4 3'}:{})}),svgNode('path',{d:'M33 11L27 7V15Z',fill:'#173b31'}));}
      item.append(icon,document.createTextNode(label));list.append(item);
    }
    legend.append(caption,list);
    if(!layout&&/^\.\/assets\/[a-z0-9._-]+\.png$/i.test(options.sheet||'')){const a=html('a','guide-link','Otvoriť všetkých šesť schém ↗');a.href=options.sheet;a.target='_blank';a.rel='noopener noreferrer';legend.append(a);}
    root.append(figure,controls,coneGuide,layoutGuide,selectors,settings,status,progress,scrub,note,legend);parent.append(root);
    let actors=new Map(),arrowLayers=[];
    function build() {
      pause();scene=FootballScenes.build(block.diagram,{total:options.total,size:options.size,pitchIndex,area:stage?.areas[0]});clock=new FootballTimeline(scene.duration);svg.replaceChildren();actors=new Map();arrowLayers=[];lastStep=-1;lastComplete=false;
      clock.setRate(Number(speed.value));clock.setLoop(repeat.checked);
      if(block.coneSetup){
        const setup=block.coneSetup,total=setup.perArea*setup.areas;
        coneGuide.replaceChildren(html('summary','',total?`Kužele: ${setup.perArea} v nákrese · ${total} spolu`:'Kužele: 0 · bez rozkladania'),html('p','',setup.placement));
        if(setup.extra)coneGuide.append(html('p','small-note',setup.extra));
      }
      const p=scene.pitch;
      if(p){
        svg.append(svgNode('rect',{x:p.x,y:p.y,width:p.w,height:p.h,fill:'#e5eddd',stroke:'#638268','stroke-width':1.2}));
        if(p.zones){const depth=p.w*2/p.length;for(const x of[p.x,p.x+p.w-depth])svg.append(svgNode('rect',{x,y:p.y,width:depth,height:p.h,fill:'#cfdcbd',stroke:'#638268'}));}
        for(const cone of scene.cones){
          const g=svgNode('g',{'data-cone':cone.kind,transform:`translate(${cone.x} ${cone.y})`});
          const shape='M0 -11L-9 6H9Z';
          g.append(svgNode('title',{},cone.kind==='zone'?'Méta hranice koncovej zóny, 2 m od konca':cone.kind==='gate'?'Kužeľ dvojmetrovej bránky':'Kužeľ v rohu plochy'),svgNode('path',{d:shape,fill:'#f47700',stroke:'white','stroke-width':5,'stroke-linejoin':'round'}),svgNode('path',{d:shape,fill:'#f47700',stroke:'#713708','stroke-width':1.8,'stroke-linejoin':'round'}),svgNode('path',{d:'M-4 -2H4',stroke:'white','stroke-width':2.5}));svg.append(g);
        }
        if(p.goals&&!p.goalGates)for(const x of[p.x-6,p.x+p.w])for(const u of[.25,.7]){const y=p.y+p.h*u;svg.append(svgNode('rect',{x,y:y-8,width:6,height:16,fill:'white',stroke:'#173b31'}),svgNode('path',{d:`M${x} ${y-3}h6M${x} ${y+3}h6`,stroke:'#638268'}));}
        svg.append(svgNode('text',{x:180,y:p.y+p.h+22,'text-anchor':'middle',fill:'#596c63','font-size':11},`${p.length} × ${p.width} m${p.zones?' · zóny 2 m':''}`));
      }
      for(const a of scene.arrows){
        const layer=svgNode('g',{'data-motion-arrow':a.number});
        const points=a.points,b=points.at(-1),v=points.at(-2),angle=Math.atan2(b.y-v.y,b.x-v.x);
        const path=routePath(points,a.kind==='dribble');
        if(a.kind==='shot')for(const dy of[-1.5,1.5])layer.append(svgNode('path',{d:path,transform:`translate(0 ${dy})`,fill:'none',stroke:'#173b31','stroke-width':1}));
        else layer.append(svgNode('path',{d:path,fill:'none',stroke:'#173b31','stroke-width':1.4,...(a.kind==='pass'?{'stroke-dasharray':'4 3'}:{})}));
        layer.append(svgNode('path',{d:`M${b.x} ${b.y}L${b.x-7*Math.cos(angle-.4)} ${b.y-7*Math.sin(angle-.4)}L${b.x-7*Math.cos(angle+.4)} ${b.y-7*Math.sin(angle+.4)}Z`,fill:'#173b31'}));
        const mid=points[Math.floor((points.length-1)/2)],end=points[Math.ceil((points.length-1)/2)]||mid;
        if(a.label!==false)layer.append(svgNode('text',{x:(mid.x+end.x)/2+5,y:(mid.y+end.y)/2-5,fill:'#173b31','font-size':9,'font-weight':700,'paint-order':'stroke',stroke:'white','stroke-width':3},String(a.number)));
        svg.append(layer);arrowLayers.push({element:layer,start:a.start??0,end:a.end??Infinity});
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
      caption.textContent=scene.caption;scrub.max=String(scene.duration);controls.hidden=scene.duration===0;settings.hidden=scene.duration===0;scrub.hidden=scene.duration===0;note.hidden=scene.duration===0;progress.hidden=scene.duration===0;
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)note.textContent='Prehrávanie spustíš iba tlačidlom. Pri obmedzenom pohybe môžeš použiť Ďalší krok alebo posuvník.';
      render();
    }
    function render() {
      if(!clock)return;
      const time=clock.time();
      for(const[id,frames]of Object.entries(scene.tracks)){const p=FootballScenes.sample(frames,time);actors.get(id)?.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);}
      let index=0;scene.steps.forEach((s,i)=>{if(time>=s.time-.001)index=i;});
      const complete=scene.duration>0&&time>=scene.duration;
      if(index!==lastStep||complete!==lastComplete){status.textContent=(complete?'Ukážka dokončená. ':'')+scene.steps[index].text;lastStep=index;lastComplete=complete;}
      status.classList.toggle('football-complete',complete);
      progress.textContent=`Krok ${index+1}/${scene.steps.length} · ${time.toFixed(1)} / ${scene.duration.toFixed(1)} s`;
      for(const layer of arrowLayers)layer.element.setAttribute('visibility',time>=layer.start&&time<layer.end?'visible':'hidden');
      scrub.value=String(time);next.disabled=time>=scene.duration;play.textContent=clock.origin===null?(complete?'Prehrať znova':'Prehrať'):'Pauza';
      if(complete&&clock.origin!==null){clock.pause();play.textContent='Prehrať znova';}
    }
    function tick(){render();if(clock.origin!==null)frame=requestAnimationFrame(tick);else frame=null;}
    function pause(){if(frame!==null)cancelAnimationFrame(frame);frame=null;if(clock){clock.pause();render();}}
    expand.addEventListener('click',()=>{
      expand.hidden=true;
      const dialog=html('dialog','football-focus'),close=html('button','secondary-button football-close','Späť k tréningu');close.type='button';
      dialog.setAttribute('aria-label','Zväčšená futbalová schéma');close.addEventListener('click',()=>dialog.close());dialog.append(close,root);document.body.append(dialog);focusDialog=dialog;
      dialog.addEventListener('close',()=>{if(root.isConnected&&parent.isConnected)parent.append(root);dialog.remove();if(focusDialog===dialog)focusDialog=null;expand.hidden=false;expand.focus();});
      dialog.showModal();
    });
    play.addEventListener('click',()=>{if(clock.origin!==null)pause();else{clock.play();render();frame=requestAnimationFrame(tick);}});
    next.addEventListener('click',()=>{pause();const nextStep=scene.steps.find(s=>s.time>clock.time()+.02);clock.seek(nextStep?nextStep.time:scene.duration);render();});
    reset.addEventListener('click',()=>{pause();clock.seek(0);render();});
    scrub.addEventListener('input',()=>{const value=scrub.value;pause();clock.seek(value);render();});
    speed.addEventListener('change',()=>{clock.setRate(Number(speed.value));render();});
    repeat.addEventListener('change',()=>{clock.setLoop(repeat.checked);render();});
    active={pause,destroy:()=>{pause();root.remove();if(focusDialog){const dialog=focusDialog;focusDialog=null;dialog.close();dialog.remove();}}};build();
  }
  function clear(){active?.destroy();active=null;}
  window.FootballBoard={supports:key=>FootballScenes.keys.includes(key),mount,pause:()=>active?.pause(),clear};
})();
