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
  groups(key,total,layout) {
    const areas=layout?.stages?.[key]?.areas||[];
    return areas.map((area,index)=>({...area,index,count:area.count??(key==='football-warmup'?(layout.warmupCounts?.[index]??(index?Math.ceil(total/2):Math.floor(total/2))):Math.floor(total/areas.length)+(index<total%areas.length?1:0))}));
  },
  mapPoint(area,pitch,point) {
    const u=(point.x-pitch.x)/pitch.w,v=(point.y-pitch.y)/pitch.h;
    return area.w===area.length?{x:area.x+u*area.w,y:area.y+v*area.h}:{x:area.x+v*area.w,y:area.y+u*area.h};
  },
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
      const n=area?.count??(pitchIndex?Math.ceil(total/2):Math.floor(total/2)); scene.localCount=n;scene.duration=4;
      const directions=[[.11,.04],[-.1,.06],[-.08,-.05],[.09,-.06],[.06,.07],[-.07,-.07]];
      for(let i=0;i<n;i++){
        const u=n>12?.13+(i%4)*.22:.16+(i%3)*.34,v=n>12?.13+Math.floor(i/4)*.22:.14+Math.floor(i/3)*.24,[dx,dy]=directions[i%directions.length],ballId=i===0?'ball':'b'+i;
        const route=[[0,u,v],[1,u+dx*.7,v+dy*.2],[2,u+dx,v+dy],[3,u+dx*.15,v+dy*.9],[4,u,v]];
        add('p'+i,String(i+1),u,v);add(ballId,'',u+.035,v+.025,'A','ball');
        track('p'+i,route);track(ballId,route.map(([t,x,y])=>[t,x+.035,y+.025]));
        for(let leg=0;leg<4;leg++)Object.assign(line('dribble',i+1,[route[leg].slice(1),route[leg+1].slice(1)]),{start:leg,end:leg+1,label:false});
      }
      step(0,'Všetci súčasne vedú vlastnú loptu a sledujú voľný priestor.');step(1,'Meň smer a vyhni sa spoluhráčom.');step(2,'Krátke dotyky, lopta blízko nohy.');step(3,'Rozhliadni sa a pokračuj do voľna.');step(4,'Vedenie pokračuje; dráhy sú len ukážka.');
      scene.caption=`Zóna ${pitchIndex?'B':'A'}: ${n} detí. Obe zóny spolu ${total}. Všetci vedú loptu súčasne, každý svoju. Ukážkové dráhy nie sú povinné trasy ani stanovištia. Potom sa pracuje vo dvojiciach/trojici.`;
    } else if(key==='football-pass'&&area?.skill==='base') {
      const pods=Array.from({length:Math.floor(size/2)},()=>2);if(size%2)pods[pods.length-1]=3;
      let player=0;scene.duration=8;scene.localCount=size;
      pods.forEach((count,row)=>{
        const y=(row+1)/(pods.length+1),span=3.5/scene.pitch.length,dy=3.5*Math.sqrt(3)/4/scene.pitch.width,positions=count===3?[[.5-span/2,y-dy],[.5+span/2,y-dy],[.5,y+dy]]:[[.5-span/2,y],[.5+span/2,y]],ids=[];
        positions.forEach(([u,v])=>{const id='p'+player;ids.push(id);add(id,String(++player),u,v);});
        const ballId=row?'ball'+row:'ball';add(ballId,'',positions[0][0]+.03,positions[0][1]+.02,'A','ball');
        const route=count===2?[0,1,1,0,0]:[0,1,1,2,2,0,0],frames=route.map((target,i)=>[i*8/(route.length-1),positions[target][0]+.03,positions[target][1]+.02]);track(ballId,frames);
        for(let i=0;i<count;i++)line('pass',i+1,[positions[i],positions[(i+1)%count]]).label=false;
      });
      step(0,'Dvojice/trojica súčasne: krátka prihrávka po zemi.');step(2,'Prijmi a priprav si loptu, bez tlaku.');step(4,'Prihraj späť alebo ďalšiemu v trojici.');step(8,'Pokračujte; každý má veľa kontaktov.');
      scene.caption=`Základy: ${size} hráčov, ${pods.length} lôpt. Každá dvojica/trojica pracuje súčasne, vzdialenosť susedov 3,5 m. Bez povinného behu po prihrávke.`;
    } else if(key==='football-pass') {
      const positions=size>6?Array.from({length:size},(_,i)=>{const a=Math.PI+i*2*Math.PI/size;return[.5+.35*Math.cos(a),.5+.35*Math.sin(a)];}):[[.15,.6],[.65,.2],[.9,.65],[.45,.9],[.2,.15],[.8,.9]];
      positions.slice(0,size).forEach(([u,v],i)=>add('p'+i,String(i+1),u,v)); add('ball','',.185,.62,'A','ball');
      cycle(positions.slice(0,size),Array.from({length:size},(_,i)=>String(i+1)),'Lopta sa vrátila k hráčovi 1. Celý obeh je dokončený.');
      scene.localCount=size;scene.caption=`Počet v skupine: ${size}. Celý obeh 1 → 2 → … → ${size} → 1; po každej prihrávke nový uhol.`;
    } else if(key==='football-rondo'&&size===2) {
      const positions=[[.25,.5],[.75,.5]];
      positions.forEach(([u,v],i)=>add('p'+i,String(i+1),u,v));add('ball','',.28,.52,'A','ball');
      cycle(positions,['1','2'],'Dvojica pokračuje bez obrancu. Oddych na signál podľa dávky.');
      scene.localCount=2;scene.caption='Dvojica bez obrancu: prihrávka po zemi, prvý dotyk a nový uhol. Žiadny hráč navyše.';
    } else if(key==='football-rondo') {
      const defenders=size>=7?2:1,pos=[];
      for(let i=0;i<size-defenders;i++){const a=Math.PI+i*2*Math.PI/(size-defenders);pos.push([.5+.39*Math.cos(a),.5+.39*Math.sin(a)]);add('p'+i,String(i+defenders+1),...pos[i]);}
      add('def','D1',defenders===2?.44:.5,.5,'B');if(defenders===2)add('def2','D2',.56,.5,'B');add('ball','',pos[0][0]+.03,pos[0][1]+.02,'A','ball');
      cycle(pos,Array.from({length:size-defenders},(_,i)=>String(i+defenders+1)),'Celý obeh je dokončený. Obrancovia sa menia až na signál podľa rotácie.',true);
      if(defenders===2){const cx=scene.pitch.x+scene.pitch.w/2,cy=scene.pitch.y+scene.pitch.h/2;scene.tracks.def2=scene.tracks.def.map(([t,x,y])=>[t,2*cx-x+.06*scene.pitch.w,2*cy-y]);scene.tracks.def=scene.tracks.def.map(([t,x,y])=>[t,x-.06*scene.pitch.w,y]);}
      scene.localCount=size;scene.caption=`${size-defenders} na ${defenders}: ${size} hráčov spolu. Ukážka celého obehu lopty; obrancovia sa menia na signál.`;
    } else if(['football-zones','football-mini-games'].includes(key)&&size===2) {
      const zones=key==='football-zones';scene.pitch=pitch(40,46,280,20,14,zones?{zones:true}:{goals:true,goalGates:true});scene.localCount=2;scene.duration=8;
      add('a0','A1',.2,.5);add('b0','B1',.55,.45,'B');add('ball','',.23,.52,'A','ball');
      const route=[[0,.2,.5],[2,.38,.72],[4,.63,.72],[6,.82,.5],[8,zones?.94:1.015,.5]];
      track('a0',route.map(([t,x,y])=>[t,Math.min(x,.94),y]));track('ball',route.map(([t,x,y])=>[t,x+.02,y+.02]));track('b0',[[0,.55,.45],[2,.42,.52],[4,.57,.55],[6,.65,.5],[8,.7,.5]]);
      line('dribble',1,route.map(frame=>frame.slice(1)));step(0,'1 na 1: vedenie lopty a zmena smeru.');step(2,'Vyber voľnú cestu popri obrancovi.');step(6,'Zrýchli do voľna.');step(8,zones?'Bod za kontrolované vedenie do koncovej zóny.':'Bod za kontrolované prevedenie cez kužeľovú bránku.');
      scene.caption='Presne dvaja hráči: 1 na 1, bez neutrálneho. Po zisku sa mení smer útoku; oddychujú obaja podľa dávky.';
    } else if((key==='football-zones'&&size===3)||(key==='football-mini-games'&&(area?.count??Math.floor(total/4)+(pitchIndex<total%4?1:0))===3)) {
      const zones=key==='football-zones',attacker=zones?'a1':'a0';
      scene.pitch=pitch(40,46,280,zones?20:14,zones?14:9,zones?{zones:true}:{goals:true,goalGates:true});scene.localCount=3;scene.duration=zones?6:8;
      add(attacker,'A1',.2,.3);add('defender','B1',.6,.25,'B');add('n1','N1',.45,.55,'N');add('ball','',.23,.32,'A','ball');
      track(attacker,[[0,.2,.3],[2,.2,.3],[3,.5,.8],[4,zones?.94:.72,zones?.5:.52],[6,zones?.94:.82,.5],...(zones?[]:[[8,.82,.5]])]);
      track('ball',[[0,.23,.32],[2,.48,.57],[4,zones?.94:.75,zones?.52:.54],[6,zones?.96:.85,.52],...(zones?[]:[[8,1.015,.5]])]);
      line('pass',1,[[.2,.3],[.45,.55]]);line('run',2,[[.2,.3],[.5,.8],[zones?.94:.72,zones?.5:.52]]);line('pass',3,[[.45,.55],[zones?.94:.72,zones?.5:.52]]);
      if(!zones){line('dribble',4,[[.72,.52],[.82,.5]]);line('pass',5,[[.82,.5],[1.015,.5]]);}
      step(0,'1 na 1 + N: prihrávka neutrálnemu.');step(2,'Znovu sa ponúkni, N vráti loptu do nábehu.');step(4,zones?'Príjem v koncovej zóne.':'Príjem a príprava zakončenia.');step(scene.duration,zones?'Bod v koncovej zóne; N sám neboduje.':'Presná prihrávka cez kužeľovú bránku; N sám neboduje.');
      scene.caption='Skupina 3: 1 na 1 + N. Neutrálny pomáha útočiacemu hráčovi. Dávku hry a oddychu nájdeš v návode.';
    } else if(key==='football-zones') {
      scene.pitch=pitch(40,46,280,20,14,{zones:true});
      add('a1','A1',.2,.28);add('a2','A2',.22,.72);add('b1','B1',.6,.25,'B');add('b2','B2',.62,.65,'B');
      if(size>=7){add('a3','A3',.15,.5);add('b3','B3',.75,.45,'B');}
      if(size>=5)add('n1','N1',.45,.5,'N');if(size===6||size===8)add('n2','N2',.4,.89,'N');add('ball','',.23,.3,'A','ball');
      const route=[[.22,.72],[.48,.92],[.76,.92],[.94,.72]];
      track('a2',[[0,...route[0]],[2,...route[0]],[2.65,...route[1]],[3.35,...route[2]],[4,...route[3]],[6,...route[3]]]);
      if(size>=5){track('ball',[[0,.23,.3],[2,.48,.52],[4,.48,.52],[6,.96,.74]]);line('pass',1,[[.2,.28],[.45,.5]]);line('pass',3,[[.45,.5],[.94,.72]]);}
      else {track('ball',[[0,.23,.3],[4,.23,.3],[6,.96,.74]]);line('pass',3,[[.2,.28],[.94,.72]]);}
      line('run',2,route);step(0,size>=5?'1. Prihrávka neutrálnemu hráčovi.':'1. Hráč s loptou si pripraví prihrávku.');step(2,'2. A2 nabieha okolo obrancu do voľnej zóny.');step(4,'3. Prihrávka do nábehu, príjem v koncovej zóne.');step(6,'Bod získava A2. Neutrálny sám neboduje.');
      const team=size>=7?3:2,neutral=size-team*2;scene.localCount=size;scene.caption=`${team} na ${team}${neutral?' + '+neutral+' N':''}. Zóny hlboké 2 m. Ukážka prihrávky; platí aj kontrolované vedenie do zóny.`;
    } else if(key==='football-mini-games') {
      const n=area?.count??Math.floor(total/4)+(pitchIndex<total%4?1:0);
      scene.pitch=pitch(40,46,280,14,9,{goals:true,goalGates:true});scene.localCount=n;scene.duration=8;
      add('a0','A1',.18,.32);add('a1','A2',.33,.7);add('b0','B1',.7,.12,'B');add('b1','B2',.65,.7,'B');
      if(n>=7){add('a2','A3',.2,.85);add('b2','B3',.8,.45,'B');}
      if(n>=5)add('n1','N1',.36,.38,'N');if(n===6||n===8)add('n2','N2',.45,.86,'N');add('ball','',.21,.34,'A','ball');
      track('a0',[[0,.18,.32],[2,.18,.32],[3,.28,.1],[4,.53,.12],[6,.53,.12],[7,.81,.48],[8,.81,.48]]);
      track('ball',[[0,.21,.34],[2,.36,.72],[4,.36,.72],[6,.56,.14],[7,.84,.5],[8,1.015,.5]]);
      line('pass',1,[[.18,.32],[.33,.7]]);line('run',2,[[.18,.32],[.28,.1],[.53,.12]]);line('pass',3,[[.33,.7],[.53,.12]]);line('dribble',4,[[.53,.12],[.81,.48]]);line('pass',5,[[.81,.48],[1.015,.5]]);
      step(0,n>4?'1. Prihraj spoluhráčovi; neutrálny pomáha tímu s loptou.':'1. Prihraj spoluhráčovi.');step(2,'2. Znovu sa ponúkni do voľného priestoru.');step(4,'3. Spoluhráč vráti loptu do nábehu.');step(6,'4. Priprav si presné zakončenie.');step(7,'5. Pošli loptu po zemi cez kužeľovú bránku.');step(8,n>4?'Príklad jednej akcie. Neutrálny sám neboduje; v hre hráči rozhodujú sami.':'Príklad jednej akcie; v hre hráči rozhodujú sami.');
      const team=n>=7?3:2,neutral=n-2*team;scene.caption=`Ihrisko ${['A1','A2','B1','B2'][pitchIndex]}: ${team} na ${team}${neutral?' + '+neutral+' N':''} = ${n} detí. Všetky štyri ihriská spolu ${total}. Dve kužeľové bránky široké 2 m; zakončenie po zemi.`;
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
  function equipmentIcon(kind){
    const icon=svgNode('svg',{viewBox:'0 0 64 64',class:'exercise-kit-icon','aria-hidden':'true',focusable:'false'}),stroke='#173b31';
    if(kind==='ball'){icon.append(svgNode('circle',{cx:32,cy:32,r:25,fill:'white',stroke,'stroke-width':2.5}),svgNode('path',{d:'M32 21L43 29L39 42H25L21 29Z',fill:stroke}),svgNode('path',{d:'M32 7V21M43 29L56 24M39 42L47 52M25 42L17 52M21 29L8 24',fill:'none',stroke,'stroke-width':2}));}
    else if(kind==='cone'){icon.append(svgNode('path',{d:'M32 8L13 51H51ZM8 51H56V57H8Z',fill:'#f47700',stroke,'stroke-width':2,'stroke-linejoin':'round'}),svgNode('path',{d:'M23 29H41M19 39H45',stroke:'white','stroke-width':4}));}
    else if(kind==='bibs'){for(const[x,color]of[[4,'#176ca2'],[22,'#c14e33'],[40,'#eed06b']])icon.append(svgNode('path',{d:`M${x} 17l6-5 4 7 4-7 6 5v34H${x}Z`,fill:color,stroke:'white','stroke-width':1.5,'stroke-linejoin':'round'}));}
    else if(kind==='gates'){for(const x of[12,52])icon.append(svgNode('path',{d:`M${x} 24l-9 26h18Z`,fill:'#f47700',stroke,'stroke-width':2}));icon.append(svgNode('path',{d:'M21 45H43',stroke,'stroke-width':2,'stroke-dasharray':'3 3'}),svgNode('text',{x:32,y:20,'text-anchor':'middle','font-size':13,'font-weight':700,fill:stroke},'2 m'));}
    else if(kind==='timer'){icon.append(svgNode('circle',{cx:32,cy:36,r:22,fill:'white',stroke,'stroke-width':3}),svgNode('path',{d:'M25 6H39M32 6V14M47 15L53 21M32 21V36L42 41',fill:'none',stroke,'stroke-width':3,'stroke-linecap':'round'}));}
    else if(kind==='signal'){icon.append(svgNode('path',{d:'M7 30h24l10-11h14v18H40a16 16 0 1 1-33-7Z',fill:'#d8eea4',stroke,'stroke-width':2.5}),svgNode('circle',{cx:22,cy:40,r:7,fill:'white',stroke,'stroke-width':2}),svgNode('path',{d:'M49 10V5M58 16L62 13',stroke,'stroke-width':2.5,'stroke-linecap':'round'}));}
    else if(kind==='water'){icon.append(svgNode('path',{d:'M25 6H39V15L44 23V56H20V23L25 15Z',fill:'#d8edf6',stroke,'stroke-width':2.5,'stroke-linejoin':'round'}),svgNode('path',{d:'M25 12H39M21 34Q27 29 33 34T43 34M21 41Q27 36 33 41T43 41',fill:'none',stroke:'#16729c','stroke-width':2.5}));}
    return icon;
  }
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
    let layout=options.quarterPitch,stage=layout?.stages?.[block.diagram],areas=FootballScenes.groups(block.diagram,options.total,layout);
    let pitchIndex=Math.min(options.areaIndex||0,Math.max(0,areas.length-1)),scene,clock,frame=null,lastStep=-1,lastComplete=false,focusDialog=null,layoutDialog=null;
    if(areas.length)options.size=areas[pitchIndex].count;
    const focused=Boolean(options.brief),root=html('div',focused?'football-board exercise-flow':'football-board');
    const briefRoot=html('div','exercise-info'),tweaks=html('details','exercise-tweaks');
    const uiIcon=name=>{const icon=html('img','card-ui-icon');icon.src='./assets/bootstrap-icons/'+name+'.svg';icon.alt='';return icon;};
    const groupBar=html('div','card-group-bar'),glance=html('div','card-glance'),quickFacts=html('div','card-quick-facts');
    let topic='steps',instructionIndex=0,equipmentIndex=-1,timePart='work',instructionMode=false;
    const preview=html('button','exercise-preview'),previewBody=html('span','card-short-description'),descriptionButton=html('span','card-description-button','Popis cvičenia →'),itemPager=html('div','exercise-item-pager'),modeButton=html('button','secondary-button exercise-mode-button','Ako to robiť →');modeButton.type='button';modeButton.addEventListener('click',()=>{instructionMode=!instructionMode;pause();applyTopic();});
    preview.type='button';preview.addEventListener('click',()=>selectTopic('steps',{instructions:true}));preview.append(uiIcon('people-fill'),descriptionButton,previewBody);
    const moreMenu=html('details','exercise-card-menu'),menuSummary=html('summary'),menuItems=html('div','card-menu-items');menuSummary.setAttribute('aria-label','Ďalšie možnosti cvičenia');menuSummary.append(uiIcon('three-dots'));moreMenu.append(menuSummary,menuItems);
    const closeMenuOutside=event=>{if(!moreMenu.contains(event.target))moreMenu.open=false;};
    if(focused){const training=options.planState?.();if(training){const chooseBlock=html('details','card-exercise-picker');chooseBlock.append(html('summary','','Vybrať cvičenie'));for(const [index,item]of training.blocks.entries()){const button=html('button','',`${index+1}. ${item.title}`);button.type='button';if(item.id===block.id)button.setAttribute('aria-current','true');button.addEventListener('click',()=>options.onBlock(index));chooseBlock.append(button);}menuItems.append(chooseBlock);}}
    if(focused){parent.parentElement.querySelector('.activity-heading').append(moreMenu);document.addEventListener('click',closeMenuOutside);for(const[label,action]of[['Nákres',()=>selectTopic('steps',{instructions:false})],['Popis a postup',()=>selectTopic('steps',{instructions:true})],['Pokyny trénera',()=>selectTopic('coach')],['Nastavenia tréningu',()=>selectTopic('space',{settings:true})],['Predošlý cvik',()=>document.getElementById('previous-block').click()],['Moje · osobný plán',()=>options.onPrivate()]]){const button=html('button','',label);button.type='button';if(label==='Predošlý cvik')button.disabled=block.start===0;button.addEventListener('click',()=>{moreMenu.open=false;action();});menuItems.append(button);}moreMenu.addEventListener('keydown',event=>{if(event.key==='Escape'){moreMenu.open=false;menuSummary.focus();}});}
    const topicNav=html('nav','exercise-topic-nav');topicNav.setAttribute('aria-label','Podrobnosti cvičenia');
    if(focused)for(const[key,title]of[['steps','Postup'],['space','Nastaviť'],['time','Čas'],['coach','Tréner'],['kit','Pomôcky']]){const button=html('button','',title);button.type='button';button.dataset.topic=key;button.setAttribute('aria-controls','exercise-panel-'+key);button.addEventListener('click',()=>selectTopic(key,key==='steps'?{instructions:true}:{}));if(['space','time','kit'].includes(key))button.prepend(uiIcon({space:'bounding-box',time:'stopwatch',kit:'cone-striped'}[key]));topicNav.append(button);}
    tweaks.append(html('summary','',areas.length?'Nastaviť skupinu':'Schéma a nastavenia'));
    const selectors=html('div','football-selectors');
    const choose=(label,values,selected,callback)=>{const wrap=html('label','football-select-label',label),select=html('select');select.setAttribute('aria-label',label);values.forEach(([value,text])=>{const option=html('option','',text);option.value=value;select.append(option);});select.value=selected;select.addEventListener('change',()=>callback(Number(select.value)));wrap.append(select);selectors.append(wrap);};
    const areaTools=html('div','football-area-tools');
    const levelTools=html('div','football-level-tools');
    const countTools=html('details','football-count-tools');let countSignature='';
    const pitchTools=html('details','football-pitch-tools');let pitchSignature='';
    let areaSelect;
    const areaLabel=area=>`${area.label} · ${area.count} ${area.count<5?'hráči':'hráčov'}`;
    if(areas.length){
      const label=html('label','football-select-label',block.diagram==='football-warmup'?'Zobrazená zóna':'Zobrazená skupina');
      areaSelect=html('select');areaSelect.setAttribute('aria-label',block.diagram==='football-warmup'?'Zobrazená zóna':'Zobrazená skupina');
      for(const area of areas){const option=html('option','',areaLabel(area));option.value=area.index;areaSelect.append(option);}
      areaSelect.value=String(pitchIndex);areaSelect.addEventListener('change',()=>selectArea(Number(areaSelect.value)));label.append(areaSelect);areaTools.append(label);
      const mapButton=html('button','secondary-button','Rozmiestnenie');mapButton.type='button';mapButton.setAttribute('aria-haspopup','dialog');mapButton.addEventListener('click',openLayout);areaTools.append(mapButton);
    }else{
      if(['football-warmup','football-matches','football-mini-games'].includes(block.diagram))choose(block.diagram==='football-warmup'?'Zobrazená zóna':'Zobrazené ihrisko',[[0,'A'],[1,'B']],0,value=>{pitchIndex=value;build();});
      if(['football-pass','football-rondo','football-zones'].includes(block.diagram))choose('Hráčov v tejto skupine',options.groups.map(n=>[n,'Skupina '+n]),options.size,value=>{options.size=value;build();options.onGroupChange(value);});
    }
    const expand=html('button','secondary-button football-expand','Zväčšiť');expand.type='button';expand.setAttribute('aria-label','Zväčšiť schému a animáciu');selectors.append(expand);
    const figure=html('figure','diagram football-figure'),svg=svgNode('svg',{viewBox:'0 0 360 310',role:'img','aria-label':block.title}),visualLabel=html('figcaption','exercise-visual-label');figure.append(svg);if(focused)figure.append(visualLabel);
    const coneGuide=html('details','football-cone-guide');coneGuide.hidden=!block.coneSetup;
    const layoutGuide=html('details','football-cone-guide');layoutGuide.hidden=!stage;
    let map;
    if(stage){
      layoutGuide.append(html('summary','',`${layout.label||'Celá 1/4'}: ${layout.assumed?'pracovný rozmer':'približne'} ${layout.width} × ${layout.height} m`),html('p','',layout.assumption));
      map=svgNode('svg',{viewBox:`-3 -4 ${layout.width+6} ${layout.height+7}`,role:'img','aria-label':`Rozloženie pracovnej plochy: ${block.title}`,class:'football-layout-map'});
      layoutGuide.append(map,html('p','',stage.instructions));
    }
    const phaseBar=html('div','exercise-phase-bar'),phaseLabel=html('output','exercise-phase-label'),phaseNext=html('button','secondary-button','Ďalšia fáza →');phaseNext.type='button';phaseLabel.setAttribute('aria-live','polite');phaseBar.append(phaseLabel,phaseNext);
    const caption=html('p','football-caption'),skill=html('div','football-skill');
    const status=html('p','football-status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
    const progress=html('output','football-progress');progress.setAttribute('aria-live','off');progress.setAttribute('aria-label','Priebeh celej ukážky');
    const controls=html('div','football-controls'),play=html('button','button','Prehrať'),next=html('button','secondary-button','Ďalší krok'),reset=html('button','secondary-button','Od začiatku');
    for(const b of[play,next,reset])b.type='button';if(focused){controls.append(play,modeButton);figure.append(controls);}else controls.append(play,next,reset);
    const fineControls=html('div','football-controls exercise-animation-tools');if(focused)fineControls.append(next,reset);
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
    const toolsParent=focused?tweaks:root;
    if(areas.length)toolsParent.append(areaTools);
    if(options.levelConfig?.()&&areas.length)toolsParent.append(levelTools);
    if(options.onCountChange&&options.levelConfig?.()&&areas.length)toolsParent.append(countTools);
    if(options.onPitchChange&&options.levelConfig?.()&&areas.length)toolsParent.append(pitchTools);
    if(focused)root.append(groupBar,figure,phaseBar,preview,glance,quickFacts,briefRoot,itemPager,topicNav);else root.append(skill,figure,controls);
    let guide;
    if(options.onGuide){
      guide=html('button','football-guide-entry');guide.type='button';guide.setAttribute('aria-haspopup','dialog');
      const guideArrow=html('span','','→');guideArrow.setAttribute('aria-hidden','true');guide.append(html('strong','','Ako viesť cvičenie'),guideArrow);
      guide.addEventListener('click',options.onGuide);if(!focused)root.append(guide);
      const more=html('details','football-options');more.append(html('summary','','Schéma a nastavenia'),coneGuide,layoutGuide,selectors,settings,...(focused?[fineControls]:[]),status,progress,scrub,note,legend);toolsParent.append(more);
    }else root.append(coneGuide,layoutGuide,selectors,settings,...(focused?[fineControls]:[]),status,progress,scrub,note,legend);
    parent.append(root);
    let actors=new Map(),arrowLayers=[];
    function focusControl(element){element.focus({preventScroll:true});if(focused){const box=element.getBoundingClientRect();if(box.top<12||box.bottom>innerHeight-150)element.scrollIntoView({block:'nearest',behavior:'instant'});}}
    function selectTopic(key,settings={}){
      topic=key;if(settings.instructions!==undefined)instructionMode=settings.instructions;if(settings.part)timePart=settings.part;
      if(key!=='steps'||instructionMode)pause();moreMenu.open=false;applyTopic();briefRoot.scrollTop=0;
      if(settings.settings){tweaks.open=true;focusControl(areaSelect||tweaks.querySelector('summary'));}
    }
    function applyTopic(){
      root.dataset.topic=topic;root.dataset.instructions=String(instructionMode);
      modeButton.hidden=topic!=='steps';modeButton.textContent=instructionMode?'← Nákres':'Kroky →';preview.hidden=topic!=='steps'||instructionMode;modeButton.setAttribute('aria-expanded',String(instructionMode));modeButton.setAttribute('aria-controls','exercise-panel-steps');
      const oldPager=itemPager.firstElementChild;if(oldPager)briefRoot.querySelector('[data-panel="'+oldPager.dataset.panel+'"]')?.append(oldPager);itemPager.replaceChildren();const activePager=briefRoot.querySelector('[data-panel="'+topic+'"] .exercise-pager');if(activePager)itemPager.append(activePager);itemPager.hidden=topic==='steps'&&!instructionMode||!activePager;
      briefRoot.hidden=topic==='steps'&&!instructionMode;
      for(const panel of briefRoot.children)panel.hidden=panel.dataset.panel!==topic;
      const showHero=topic==='steps'&&!instructionMode;groupBar.hidden=!showHero;glance.hidden=!showHero;quickFacts.hidden=!showHero;phaseBar.hidden=!showHero;
      for(const section of briefRoot.querySelectorAll('[data-time-part]'))section.hidden=section.dataset.timePart!==timePart;
      for(const button of briefRoot.querySelectorAll('.exercise-time-nav button'))button.setAttribute('aria-pressed',String(button.getAttribute('aria-controls')==='exercise-time-'+timePart));
      for(const button of topicNav.children)button.setAttribute('aria-pressed',String(button.dataset.topic===topic));
    }
    function renderBrief(){
      if(!focused)return;
      const data=options.brief(pitchIndex);if(!data)return;itemPager.replaceChildren();briefRoot.replaceChildren();visualLabel.textContent=data.selection.replace(/^Ukážka /,'').replace(/ z \d+ detí/,' detí');previewBody.textContent=scene?.phases?.findLast(phase=>phase.start<=clock.time())?.cue||data.shortInstruction;
      const selectedArea=areas[pitchIndex],config=options.levelConfig(),localCount=selectedArea?.count||options.total;
      groupBar.replaceChildren();const groupButton=html('button','card-group-button',selectedArea?.label||'U11');groupButton.type='button';groupButton.setAttribute('aria-label','Vybrať skupinu a náročnosť');groupButton.addEventListener('click',()=>selectTopic('space',{settings:true}));groupBar.append(groupButton,html('span','',`${localCount} ${localCount>=2&&localCount<=4?'deti':'detí'}${selectedArea?.label?.length>1?' · '+TrainingPlanner.levels[config.levels[pitchIndex]]:''}`));
      glance.replaceChildren();for(const[label,value,hint,part,icon]of[['Práca',data.glance.work,data.glance.workHint,'work','stopwatch'],['Oddych',data.glance.rest,data.glance.restHint,'rest','cup-hot-fill']]){const button=html('button','card-dose');button.type='button';button.setAttribute('aria-label',label+': '+value+'. Celá dávka');const body=html('span');body.append(html('span','card-dose-label',label),html('strong','',value));if(hint)body.append(html('small','',hint));button.append(uiIcon(icon),body);button.addEventListener('click',()=>selectTopic('time',{part}));glance.append(button);}
      quickFacts.replaceChildren();const noun=(count,one,few,many)=>count===1?one:count>=2&&count<=4?few:many;for(const[label,value,hint,icon,action]of[['Plocha',selectedArea?`${selectedArea.length} × ${selectedArea.width} m`:'Pri trénerovi',`${config.width} × ${config.height} m spolu`,'bounding-box',()=>selectTopic('space')],['Deti',String(localCount),'z '+config.players,'people-fill',()=>selectTopic('space',{settings:true})],['Pomôcky',data.conesLocal?`${data.conesLocal} ${noun(data.conesLocal,'kužeľ','kužele','kužeľov')}`:'Voda',data.ballsLocal?`${data.ballsLocal} ${noun(data.ballsLocal,'lopta','lopty','lôpt')}`:'pre každého','cone-striped',()=>selectTopic('kit')]]){const button=html('button','card-quick-fact');button.type='button';const text=html('span');text.append(html('span','card-fact-label',label),html('strong','',value),html('small','',hint));const factIcon=uiIcon(icon);if(icon==='cone-striped')factIcon.src='./assets/card-cone.webp';button.append(factIcon,text);button.addEventListener('click',action);quickFacts.append(button);}

      const panels={};for(const key of['steps','space','time','coach','kit']){const panel=html('div','exercise-topic-panel');panel.id='exercise-panel-'+key;panel.dataset.panel=key;panel.setAttribute('role','region');panel.setAttribute('aria-label',{steps:'Postup cvičenia',space:'Plocha a skupiny',time:'Práca, oddych a striedanie',coach:'Pokyny trénera',kit:'Pomôcky cvičenia'}[key]);panels[key]=panel;briefRoot.append(panel);}
      for(const key of['space','time','coach','kit']){const back=html('button','secondary-button card-back-visual','← Nákres');back.type='button';back.addEventListener('click',()=>selectTopic('steps',{instructions:false}));panels[key].append(back);}
      const card=(title)=>{const section=html('section','exercise-card');section.append(html('h2','',title));return section;};
      const list=(tag,items)=>{const node=html(tag);items.forEach(text=>node.append(html('li','',text)));return node;};
      const pager=(kind,index,count,change)=>{const bar=html('div','exercise-pager exercise-'+kind+'-pager'),back=html('button','secondary-button','← Späť'),forward=html('button','button','Ďalej →'),counter=html('output','',`${index+1} / ${count}`);counter.setAttribute('aria-live','polite');for(const button of[back,forward])button.type='button';back.setAttribute('aria-label',kind==='step'?'Predošlý bod postupu':'Predošlá pomôcka');forward.setAttribute('aria-label',kind==='step'?'Ďalší bod postupu':'Ďalšia pomôcka');back.disabled=index===0;forward.disabled=index===count-1;for(const[button,direction]of[[back,-1],[forward,1]])button.addEventListener('click',()=>{change(index+direction);renderBrief();focusControl(root.querySelector('.exercise-'+kind+'-pager button'+(direction>0?':last-child':':first-child')+':not(:disabled)')||root.querySelector('.exercise-'+kind+'-pager button:not(:disabled)'));});bar.dataset.panel=kind==='step'?'steps':'kit';bar.append(back,counter,forward);return bar;};
      instructionIndex=Math.min(instructionIndex,data.steps.length-1);
      const how=card('Popis cvičenia');const backToVisual=html('button','secondary-button card-back-visual','← Nákres');backToVisual.type='button';backToVisual.addEventListener('click',()=>selectTopic('steps',{instructions:false}));how.append(html('p','card-full-description',data.description),html('h3','','Postup'),html('p','exercise-current-step',data.steps[instructionIndex]),pager('step',instructionIndex,data.steps.length,index=>instructionIndex=index));const full=html('details','exercise-more');full.append(html('summary','','Všetky kroky'),list('ol',data.steps));if(guide)full.append(guide);how.append(full);panels.steps.append(backToVisual,how);
      const space=card('Rozloženie'),facts=html('div','exercise-facts'),area=areas[pitchIndex];
      if(area){for(const[value,label]of[[`${layout.width} × ${layout.height} m`,'Celý priestor'],[`${area.length} × ${area.width} m`,'Jedna plocha']]){const fact=html('div');fact.append(html('strong','',value),html('span','',label));facts.append(fact);}space.append(facts,html('p','exercise-group-chip',visualLabel.textContent));}else space.append(html('p','',data.grouping));
      if(areas.length){const mapButton=html('button','secondary-button','Mapa rozloženia');mapButton.type='button';mapButton.dataset.exerciseMap='true';mapButton.setAttribute('aria-haspopup','dialog');mapButton.addEventListener('click',openLayout);space.append(mapButton);const prepare=html('button','text-button','Pripraviť ihrisko →');prepare.type='button';prepare.addEventListener('click',options.onSetup);space.append(prepare);}
      const organization=html('details','exercise-more');organization.append(html('summary','','Skupiny a tréneri'),html('p','',data.space),html('p','',data.grouping));if(data.groups.length)organization.append(list('ul',data.groups));if(data.coaches.length)organization.append(list('ul',data.coaches));if(data.spacing)organization.append(html('p','small-note',data.spacing));space.append(organization);panels.space.append(space,tweaks);
      const timeNav=html('div','exercise-time-nav');timeNav.setAttribute('role','group');timeNav.setAttribute('aria-label','Dávka cvičenia');
      for(const[title,text,kind]of[['Práca',data.work,'work'],['Oddych',data.rest,'rest'],['Striedanie',data.rotation,'rotation']]){const button=html('button','secondary-button',title);button.type='button';button.setAttribute('aria-pressed',String(timePart===kind));button.setAttribute('aria-controls','exercise-time-'+kind);button.addEventListener('click',()=>{timePart=kind;for(const item of timeNav.children)item.setAttribute('aria-pressed',String(item===button));for(const section of panels.time.querySelectorAll('[data-time-part]'))section.hidden=section.dataset.timePart!==kind;});timeNav.append(button);const section=card(title);section.id='exercise-time-'+kind;section.dataset.timePart=kind;section.hidden=timePart!==kind;section.classList.add('exercise-'+kind);section.append(html('p','',text));if(kind==='rotation'&&!['football-warmup','football-finish'].includes(block.diagram)){const rotate=html('button','secondary-button','Podrobné striedanie');rotate.type='button';rotate.addEventListener('click',()=>options.onGuideSection('rotations'));section.append(rotate);}panels.time.append(section);}panels.time.prepend(timeNav);
      if(data.notes.length){const notes=html('details','exercise-more exercise-coach-notes');notes.append(html('summary','','Pokyny trénera'),list('ul',data.notes));panels.coach.append(notes);}
      const slogan=card('Povedz deťom');slogan.classList.add('exercise-slogan');slogan.append(html('blockquote','',data.slogan));panels.coach.prepend(slogan);
      equipmentIndex=Math.min(equipmentIndex,data.visualKit.length-1);
      const kit=card('Pomôcky'),gear=html('div','exercise-kit-overview'),detail=html('div','exercise-kit-detail');detail.id='exercise-kit-detail';kit.classList.add('exercise-kit');
      const titles={ball:'Lopty',cone:'Kužele',bibs:'Rozlišovačky',gates:'Bránky',timer:'Stopky',signal:'Píšťalka',water:'Voda'};
      const showEquipment=index=>{equipmentIndex=index;detail.replaceChildren();detail.hidden=index<0;for(const[order,button]of [...gear.children].entries())button.setAttribute('aria-expanded',String(order===index));if(index<0)return;const item=data.visualKit[index];detail.append(html('h3','',item.title),html('p','',item.detail));if(item.kind==='cone'&&data.conesTotal)detail.append(html('p','small-note',data.conePlacement));};
      for(const[index,item]of data.visualKit.entries()){const tile=html('button','exercise-kit-choice');tile.type='button';tile.dataset.equipment=item.kind;tile.setAttribute('aria-controls',detail.id);tile.setAttribute('aria-label',`${item.title}: ${item.value}. Podrobnosti`);tile.append(equipmentIcon(item.kind),html('span','exercise-kit-name',titles[item.kind]),html('strong','exercise-kit-count',item.value));tile.addEventListener('click',()=>{showEquipment(equipmentIndex===index?-1:index);if(!detail.hidden)detail.scrollIntoView({block:'nearest',behavior:'instant'});});gear.append(tile);}kit.append(gear,detail);showEquipment(equipmentIndex);const all=html('details','exercise-more');all.append(html('summary','','Celý zoznam'),list('ul',data.kit));if(data.conesTotal)all.append(html('p','small-note',data.conePlacement));kit.append(all);panels.kit.append(kit);
      applyTopic();
    }
    function selection(){return{index:pitchIndex,count:options.size,label:areas[pitchIndex]?.label,areas};}
    function refreshPlan(){
      const training=options.planState();block=training.blocks.find(item=>item.id===block.id);options.total=training.planConfig.players;
      layout=training.quarterPitch;stage=layout.stages[block.diagram];areas=FootballScenes.groups(block.diagram,options.total,layout);options.size=areas[pitchIndex].count;
      areaSelect.replaceChildren(...areas.map(area=>{const option=html('option','',areaLabel(area));option.value=area.index;return option;}));areaSelect.value=String(pitchIndex);
      if(map){map.setAttribute('viewBox',`-3 -4 ${layout.width+6} ${layout.height+7}`);layoutGuide.firstElementChild.textContent=`${layout.label||'Celá 1/4'}: ${layout.assumed?'pracovný rozmer':'približne'} ${layout.width} × ${layout.height} m`;layoutGuide.children[1].textContent=layout.assumption;layoutGuide.lastElementChild.textContent=stage.instructions;}
    }
    function renderPitchTools(){
      const config=options.levelConfig?.();if(!options.onPitchChange||!config||!areas.length)return;
      const signature=JSON.stringify([config.pitch,config.width,config.height]);if(signature===pitchSignature)return;pitchSignature=signature;pitchTools.replaceChildren();
      pitchTools.append(html('summary','',`Veľkosť ihriska · ${config.width} × ${config.height} m`));
      const form=html('form'),partLabel=html('label','football-select-label','Dostupná časť ihriska'),part=html('select');part.setAttribute('aria-label','Dostupná časť ihriska');
      for(const[value,preset]of Object.entries(TrainingPlanner.pitches)){const option=html('option','',preset.label);option.value=value;part.append(option);}part.value=config.pitch;partLabel.append(part);
      const grid=html('div','football-pitch-grid'),fields=[];
      for(const[key,title,min,max]of[['width','Dĺžka dostupnej plochy (m)',35,120],['height','Šírka dostupnej plochy (m)',25,90]]){const label=html('label','football-select-label',title),input=html('input');input.type='number';input.min=min;input.max=max;input.step='1';input.required=true;input.value=config[key];input.setAttribute('aria-label',title);label.append(input);grid.append(label);fields.push(input);}
      part.addEventListener('change',()=>{const preset=TrainingPlanner.pitches[part.value];fields[0].value=preset.width;fields[1].value=preset.height;});
      const apply=html('button','button','Použiť priestor');apply.type='submit';
      form.addEventListener('submit',event=>{event.preventDefault();const space={pitch:part.value,width:Number(fields[0].value),height:Number(fields[1].value)};if(TrainingPlanner.resize(config,space)&&options.onPitchChange(space)){refreshPlan();build();options.onGroupChange(options.size,pitchIndex);focusControl(pitchTools.querySelector('button'));}});
      const area=stage.areas[0];form.append(html('p','small-note','Mení dostupný priestor pre celý tréning. Rozmiestnenie cvičení sa prepočíta; skupiny ostanú.'),partLabel,grid,html('p','small-note','Predvoľby polovice a celého ihriska sú orientačné; rozmery uprav podľa skutočnosti.'),html('p','small-note',`Pracovná plocha tohto cvičenia: ${area.length} × ${area.width} m.`),apply);pitchTools.append(form);
    }
    function renderCountTools(){
      const config=options.levelConfig?.();if(!options.onCountChange||!config||!areas.length)return;
      const signature=JSON.stringify(config.groupSizes);if(signature===countSignature)return;countSignature=signature;countTools.replaceChildren();
      countTools.append(html('summary','',`Počty skupín · spolu ${config.players}`));
      const form=html('form'),grid=html('div','football-count-grid'),fields=[];
      config.groupSizes.forEach((size,index)=>{const group=['A1','A2','B1','B2'][index],label=html('label','football-select-label','Detí '+group),input=html('input');input.type='number';input.min='2';input.max='8';input.step='1';input.required=true;input.value=size;input.setAttribute('aria-label','Detí '+group);label.append(input);fields.push(input);grid.append(label);});
      const preview=html('p','small-note');preview.setAttribute('role','status');
      const apply=html('button','button','Použiť rozdelenie');apply.type='submit';
      const update=()=>{const sizes=fields.map(input=>Number(input.value)),sum=sizes.reduce((a,b)=>a+b,0),valid=Boolean(TrainingPlanner.regroup(config,sizes));apply.disabled=!valid;preview.textContent=valid?(sum===config.players?`Spolu ${sum} detí; celkový počet ostane.`:`Spolu ${config.players} → ${sum} detí. Zmení sa aj počet detí spolu.`):'Každá skupina musí mať 2–8 detí, spolu 10–30.';apply.textContent=sum===config.players?'Použiť rozdelenie':`Použiť: ${Number.isFinite(sum)?sum:'—'} detí spolu`;};
      fields.forEach(input=>input.addEventListener('input',update));
      form.addEventListener('submit',event=>{event.preventDefault();const sizes=fields.map(input=>Number(input.value));if(TrainingPlanner.regroup(config,sizes)&&options.onCountChange(sizes)){refreshPlan();build();options.onGroupChange(options.size,pitchIndex);focusControl(countTools.querySelector('button'));}});
      form.append(html('p','small-note','Pri presune uprav aj druhú skupinu. Ak niekto príde alebo odíde, upraví sa aj počet detí spolu.'),grid,preview,apply);countTools.append(form);update();
    }
    function renderLevelTools(){
      const config=options.levelConfig?.();levelTools.replaceChildren();if(!config||!areas.length)return;
      const indices=block.diagram==='football-warmup'?[pitchIndex*2,pitchIndex*2+1]:[pitchIndex];
      for(const index of indices){
        const group=['A1','A2','B1','B2'][index],label=html('label','football-select-label','Náročnosť '+group),select=html('select');select.setAttribute('aria-label','Náročnosť '+group);select.dataset.levelGroup=index;
        for(const[value,title]of Object.entries(TrainingPlanner.levels)){const option=html('option','',title);option.value=value;select.append(option);}select.value=config.levels[index];
        select.addEventListener('change',()=>{if(options.onLevelChange?.(index,select.value)){const updated=options.levelConfig();if(block.diagram!=='football-warmup')areas.forEach(area=>area.skill=updated.levels[area.index]);build();options.onGroupChange(options.size,pitchIndex);focusControl(levelTools.querySelector(`[data-level-group="${index}"]`));}else select.value=options.levelConfig().levels[index];});
        label.append(select);levelTools.append(label);
      }
      const note=html('p','small-note','Ukladá sa pre skupinu v tomto tréningu.');note.style.gridColumn='1 / -1';levelTools.append(note);
    }
    function selectArea(index){
      if(!Number.isInteger(index)||!areas[index])return;
      pitchIndex=index;options.size=areas[index].count;areaSelect.value=String(index);build();options.onGroupChange(options.size,index);if(focused&&!layoutDialog)focusControl(areaSelect);
    }
    function renderMap(){
      if(!map)return;
      map.replaceChildren(svgNode('rect',{x:0,y:0,width:layout.width,height:layout.height,fill:'#e5eddd',stroke:'#173b31','stroke-width':.3}),svgNode('rect',{x:layout.corridor.x,y:0,width:layout.corridor.width,height:layout.height,fill:'#e7d5b7'}),svgNode('text',{x:layout.width/2,y:-1.5,'text-anchor':'middle','font-size':1.5,fill:'#173b31'},`${layout.width} m`),svgNode('text',{x:-1.5,y:layout.height/2,'text-anchor':'middle','font-size':1.5,fill:'#173b31',transform:`rotate(-90 -1.5 ${layout.height/2})`},`${layout.height} m`),svgNode('text',{x:layout.corridor.x+layout.corridor.width/2,y:layout.height/2,'text-anchor':'middle','font-size':1.4,fill:'#173b31'},String(layout.corridor.width)+' m'));
      for(const area of areas){
        map.append(svgNode('rect',{'data-map-area':area.label,x:area.x,y:area.y,width:area.w,height:area.h,fill:area.index===pitchIndex?'#d8eea4':'#f6f8f1',stroke:'#216a4b','stroke-width':area.index===pitchIndex?.5:.25}));
        const local=FootballScenes.build(block.diagram,{total:options.total,size:area.count,pitchIndex:area.index,area});
        for(const player of local.nodes.filter(n=>n.kind==='player')){const p=FootballScenes.mapPoint(area,local.pitch,player);map.append(svgNode('circle',{'data-map-player':area.label,cx:p.x,cy:p.y,r:.42,fill:colors[player.team],stroke:'white','stroke-width':.12}));}
        for(const cone of local.cones){const p=FootballScenes.mapPoint(area,local.pitch,cone);map.append(svgNode('path',{'data-map-cone':area.label,d:`M${p.x} ${p.y-.65}l-.55 1h1.1Z`,fill:'#f47700',stroke:'#713708','stroke-width':.12}));}
        const scale=Math.max(1,layout.width/35),labelSize=1.65*scale,dimensionSize=1.35*scale;
        for(const[text,dy,font]of[[scale>1.2?`${area.label} · ${area.count}`:areaLabel(area),-.3*labelSize,labelSize],[`${area.length} × ${area.width} m`,1.1*dimensionSize,dimensionSize]])map.append(svgNode('text',{x:area.x+area.w/2,y:area.y+area.h/2+dy,'text-anchor':'middle','font-size':font,'font-weight':650,fill:'#173b31','paint-order':'stroke',stroke:'white','stroke-width':.35*scale},text));
      }
    }
    function openLayout(){
      pause();
      const returnFocus=document.activeElement;
      const dialog=html('dialog','football-layout-dialog');dialog.setAttribute('aria-label','Rozmiestnenie celého tréningu');
      const head=html('header','layout-header');head.append(html('h2','',`Rozmiestnenie · ${layout.width} × ${layout.height} m`));
      const close=html('button','secondary-button','Späť na cvičenie');close.type='button';close.addEventListener('click',()=>dialog.close());
      const content=html('div','layout-body');content.append(map.cloneNode(true),html('p','layout-legend','Oranžové trojuholníky = kužele. Body = hráči, zelená plocha = zobrazená skupina. Postavenie hráčov je orientačné.'));
      const choices=html('div','layout-choices');
      for(const area of areas){const button=html('button','secondary-button',areaLabel(area));button.type='button';button.setAttribute('aria-pressed',String(area.index===pitchIndex));button.addEventListener('click',()=>{selectArea(area.index);content.querySelector('svg').replaceWith(map.cloneNode(true));choices.querySelectorAll('button').forEach((b,index)=>b.setAttribute('aria-pressed',String(index===pitchIndex)));});choices.append(button);}
      content.append(choices,html('p','',stage.instructions),html('p','',`Kužele: ${block.coneSetup.perArea} na jednu plochu · ${block.coneSetup.perArea*block.coneSetup.areas} spolu.`),html('p','',block.coneSetup.placement));
      const footer=html('footer','layout-footer');footer.append(close);dialog.append(head,content,footer);document.body.append(dialog);layoutDialog=dialog;
      dialog.addEventListener('close',()=>{dialog.remove();if(layoutDialog===dialog)layoutDialog=null;const target=returnFocus?.isConnected?returnFocus:briefRoot.querySelector('[data-exercise-map]')||areaTools.querySelector('button');target?.focus();},{once:true});dialog.showModal();
    }
    function build() {
      pause();scene=FootballScenes.build(block.diagram,{total:options.total,size:options.size,pitchIndex,area:areas[pitchIndex]});if(focused&&options.planState?.())scene=FootballSequences.build(options.planState(),block,pitchIndex,scene);clock=new FootballTimeline(scene.duration);svg.replaceChildren();actors=new Map();arrowLayers=[];lastStep=-1;lastComplete=false;
      renderLevelTools();
      renderCountTools();
      renderPitchTools();
      const variant=options.groupBlock?.(pitchIndex);skill.hidden=!variant?.skillTask;skill.replaceChildren();if(variant?.skillTask)skill.append(html('strong','',variant.skillLabel+' · '+(areas[pitchIndex]?.label||'')),html('p','',variant.skillTask));
      svg.setAttribute('aria-label',block.title+(areas.length?' · '+areaLabel(areas[pitchIndex]):''));renderMap();
      clock.setRate(Number(speed.value));clock.setLoop(repeat.checked);
      if(block.coneSetup){
        const setup=block.coneSetup,total=setup.perArea*setup.areas;
        coneGuide.replaceChildren(html('summary','',total?`Kužele: ${setup.perArea} v nákrese · ${total} spolu`:'Kužele: 0 · bez rozkladania'),html('p','',setup.placement));
        if(setup.extra)coneGuide.append(html('p','small-note',setup.extra));
      }
      const p=scene.pitch;root.classList.toggle('card-has-pitch',Boolean(p));
      if(focused)svg.setAttribute('viewBox',p?`${p.x-44} ${p.y-24} ${p.w+88} ${p.h+96}`:'0 0 360 270');
      if(p){
        svg.append(svgNode('rect',{x:p.x,y:p.y,width:p.w,height:p.h,fill:focused?'none':'#e5eddd',stroke:focused?'white':'#638268','stroke-width':1.2}));
        if(p.zones){const depth=p.w*2/p.length;for(const x of[p.x,p.x+p.w-depth])svg.append(svgNode('rect',{x,y:p.y,width:depth,height:p.h,fill:focused?'#ffffff22':'#cfdcbd',stroke:focused?'#f5fff080':'#638268'}));}
        for(const cone of scene.cones){
          const g=svgNode('g',{'data-cone':cone.kind,transform:`translate(${cone.x} ${cone.y})`});
          const shape='M0 -11L-9 6H9Z';
          g.append(svgNode('title',{},cone.kind==='zone'?'Méta hranice koncovej zóny, 2 m od konca':cone.kind==='gate'?'Kužeľ dvojmetrovej bránky':'Kužeľ v rohu plochy'));if(focused)g.append(svgNode('image',{href:'./assets/card-cone.webp',x:-12,y:-18,width:24,height:24}));else g.append(svgNode('path',{d:shape,fill:'#f47700',stroke:'white','stroke-width':5,'stroke-linejoin':'round'}),svgNode('path',{d:shape,fill:'#f47700',stroke:'#713708','stroke-width':1.8,'stroke-linejoin':'round'}),svgNode('path',{d:'M-4 -2H4',stroke:'white','stroke-width':2.5}));svg.append(g);
        }
        if(p.goals&&!p.goalGates)for(const x of[p.x-6,p.x+p.w])for(const u of[.25,.7]){const y=p.y+p.h*u;svg.append(svgNode('rect',{x,y:y-8,width:6,height:16,fill:'white',stroke:'#173b31'}),svgNode('path',{d:`M${x} ${y-3}h6M${x} ${y+3}h6`,stroke:'#638268'}));}
        if(focused){const bottom=p.y+p.h+18,mid=p.x+p.w/2,side=p.x-24;svg.append(svgNode('path',{class:'card-dimension-line',d:`M${p.x} ${bottom}h${p.w/2-24}M${mid+24} ${bottom}H${p.x+p.w}M${p.x+5} ${bottom-3}l-5 3 5 3M${p.x+p.w-5} ${bottom-3}l5 3-5 3M${side} ${p.y}V${p.y+p.h}M${side-3} ${p.y+5}l3-5 3 5M${side-3} ${p.y+p.h-5}l3 5 3-5`,fill:'none',stroke:'white','stroke-width':1}),svgNode('text',{x:mid,y:bottom+4,'text-anchor':'middle',fill:'white','font-size':11},`${p.length} m`),svgNode('text',{x:side-10,y:p.y+p.h/2,'text-anchor':'middle',fill:'white','font-size':11,transform:`rotate(-90 ${side-10} ${p.y+p.h/2})`},`${p.width} m`));}else svg.append(svgNode('text',{x:180,y:p.y+p.h+22,'text-anchor':'middle',fill:'#596c63','font-size':11},`${p.length} × ${p.width} m${p.zones?' · zóny 2 m':''}`));
      }
      const drawnPassRoutes=new Set();
      for(const a of scene.arrows){
        const layer=svgNode('g',{'data-motion-arrow':a.number});
        const points=a.points,b=points.at(-1),v=points.at(-2),angle=Math.atan2(b.y-v.y,b.x-v.x);
        const path=routePath(points,a.kind==='dribble');
        const routeKey=focused&&areas[pitchIndex]?.skill==='base'&&block.diagram==='football-pass'?points.map(point=>point.x+','+point.y).sort().join('|'):null,duplicateRoute=routeKey&&drawnPassRoutes.has(routeKey);if(routeKey)drawnPassRoutes.add(routeKey);
        if(a.kind==='shot')for(const dy of[-1.5,1.5])layer.append(svgNode('path',{d:path,transform:`translate(0 ${dy})`,fill:'none',stroke:focused?'white':'#173b31','stroke-width':1}));
        else if(!duplicateRoute)layer.append(svgNode('path',{d:path,fill:'none',stroke:focused?'white':'#173b31','stroke-width':1.4,...(a.kind==='pass'?{'stroke-dasharray':'4 3'}:{})}));
        const tip=focused&&a.kind==='pass'?{x:b.x-13*Math.cos(angle),y:b.y-13*Math.sin(angle)}:b;layer.append(svgNode('path',{d:`M${tip.x} ${tip.y}L${tip.x-7*Math.cos(angle-.4)} ${tip.y-7*Math.sin(angle-.4)}L${tip.x-7*Math.cos(angle+.4)} ${tip.y-7*Math.sin(angle+.4)}Z`,fill:focused?'white':'#173b31'}));
        const mid=points[Math.floor((points.length-1)/2)],end=points[Math.ceil((points.length-1)/2)]||mid;
        if(a.label!==false)layer.append(svgNode('text',{x:(mid.x+end.x)/2+5,y:(mid.y+end.y)/2-5,fill:focused?'white':'#173b31','font-size':9,'font-weight':700,'paint-order':'stroke',stroke:focused?'#2f5a27':'white','stroke-width':3},String(a.number)));
        svg.append(layer);arrowLayers.push({element:layer,start:a.start??0,end:a.end??Infinity});
      }
      for(const node of scene.nodes){
        const g=svgNode('g',{'data-actor':node.id,'data-team':node.team||'',transform:`translate(${node.x} ${node.y})`});
        paintActor(g,node);
        svg.append(g);actors.set(node.id,g);
      }
      caption.textContent=scene.caption;scrub.max=String(scene.duration);controls.hidden=scene.duration===0&&!focused;play.hidden=scene.duration===0;fineControls.hidden=scene.duration===0;settings.hidden=scene.duration===0;scrub.hidden=scene.duration===0;note.hidden=scene.duration===0;progress.hidden=scene.duration===0;
      if(focused)note.textContent='Celé cvičenie je ukázané v skrátenom čase. Uvedené dávky platia v tréningu; tréningový časovač je samostatný.';
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)note.textContent='Prehrávanie spustíš iba tlačidlom. Pri obmedzenom pohybe môžeš použiť Ďalší krok alebo posuvník.';
      renderBrief();
      delete phaseBar.dataset.phase;
      render();
    }
    function paintActor(g,node){
        g.replaceChildren();g.setAttribute('data-team',node.team||'');
        const r=node.kind==='ball'?4:scene.localCount>12?7:focused?11:10;
        if(focused&&node.kind==='ball')g.append(svgNode('image',{href:'./assets/card-ball.webp',x:-4,y:-4,width:8,height:8}));
        else if(focused&&node.kind==='player'&&node.team==='A')g.append(svgNode('image',{class:'card-player-sprite',href:'./assets/card-player-blue.webp',x:-r*1.16,y:-r*1.16,width:r*2.32,height:r*2.32}));
        else if(node.kind==='coach')g.append(svgNode('rect',{x:-11,y:-11,width:22,height:22,rx:2,fill:colors.T,stroke:'#173b31'}));
        else g.append(svgNode('circle',{cx:0,cy:0,r,fill:node.kind==='ball'?'white':colors[node.team],stroke:node.kind==='ball'?'#173b31':'white','stroke-width':1}));
        if(node.kind==='ball'&&!focused)g.append(svgNode('circle',{cx:0,cy:0,r:1.5,fill:'#173b31'}));
        else if(node.kind!=='ball')g.append(svgNode('text',{x:0,y:.5,'text-anchor':'middle','dominant-baseline':'middle',fill:['N','T'].includes(node.team)?'#173b31':'white','font-size':r===7?7:9,'font-weight':650},node.label));
    }
    function render() {
      if(!clock)return;
      const time=clock.time();
      const phases=scene.phases||[],phaseIndex=Math.max(0,phases.findLastIndex(phase=>phase.start<=time)),phase=phases[phaseIndex];
      if(phase){
        const dose=phase.actualSeconds%60===0?phase.actualSeconds/60+' min':phase.actualSeconds+' s';
        phaseLabel.textContent=`${phaseIndex+1}/${phases.length} · ${phase.name}${phase.actualSeconds?' · '+dose+' v tréningu':''}`;
        phaseBar.dataset.kind=phase.kind;phaseNext.disabled=phaseIndex===phases.length-1;
        if(phaseBar.dataset.phase!==String(phaseIndex)){
          phaseBar.dataset.phase=String(phaseIndex);previewBody.textContent=phase.cue;
          for(const node of scene.nodes){const role=phase.roles[node.id];if(!role)continue;const g=actors.get(node.id);g.setAttribute('visibility',role.visible?'visible':'hidden');paintActor(g,{...node,...role});}
        }
      }
      for(const[id,frames]of Object.entries(scene.tracks)){const p=FootballScenes.sample(frames,time);actors.get(id)?.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);}
      let index=0;scene.steps.forEach((s,i)=>{if(time>=s.time-.001)index=i;});
      const complete=scene.duration>0&&time>=scene.duration;
      if(index!==lastStep||complete!==lastComplete){status.textContent=(complete?'Ukážka dokončená. ':'')+scene.steps[index].text;lastStep=index;lastComplete=complete;}
      status.classList.toggle('football-complete',complete);
      progress.textContent=`Krok ${index+1}/${scene.steps.length} · ${time.toFixed(1)} / ${scene.duration.toFixed(1)} s`;
      for(const layer of arrowLayers)layer.element.setAttribute('visibility',time>=layer.start&&time<layer.end?'visible':'hidden');
      scrub.value=String(time);next.disabled=time>=scene.duration;play.textContent=clock.origin===null?(complete?'Prehrať znova':'Prehrať'):'Pauza';play.dataset.playing=String(clock.origin!==null);
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
    phaseNext.addEventListener('click',()=>{pause();const phase=scene.phases?.find(phase=>phase.start>clock.time()+.02);clock.seek(phase?.ready??phase?.start??scene.duration);render();});
    reset.addEventListener('click',()=>{pause();clock.seek(0);render();});
    scrub.addEventListener('input',()=>{const value=scrub.value;pause();clock.seek(value);render();});
    speed.addEventListener('change',()=>{clock.setRate(Number(speed.value));render();});
    repeat.addEventListener('change',()=>{clock.setLoop(repeat.checked);render();});
    active={pause,selection,selectArea,destroy:()=>{pause();moreMenu.remove();document.removeEventListener('click',closeMenuOutside);root.remove();if(layoutDialog){const dialog=layoutDialog;layoutDialog=null;dialog.close();dialog.remove();}if(focusDialog){const dialog=focusDialog;focusDialog=null;dialog.close();dialog.remove();}}};build();
  }
  function clear(){active?.destroy();active=null;}
  window.FootballBoard={supports:key=>FootballScenes.keys.includes(key),mount,pause:()=>active?.pause(),selection:()=>active?.selection(),selectArea:index=>active?.selectArea(index),clear};
})();
