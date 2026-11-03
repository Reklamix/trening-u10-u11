'use strict';

const TrainingIntervals = {
  build(training,block,index=0){
    if(!training.planConfig)return {scope:'Celý blok',parts:[{name:block.title,kind:'work',milliseconds:(block.end-block.start)*60000}]};
    const areas=FootballScenes.groups(block.diagram,training.planConfig.players,training.quarterPitch),area=areas[index]||areas[0];
    const base=FootballScenes.build(block.diagram,{total:training.planConfig.players,size:area?.count,pitchIndex:index,area});
    const scene=FootballSequences.build(training,block,index,base);
    if(['duel','two-one'].includes(block.programKind)){
      const n=area.count,roles=SessionPrograms.roles(block.programKind,n),lanes=SessionPrograms.lanes(block.programKind,n);
      return {scope:`${area.label} · ${n} detí`,rotation:{roles,lanes,count:n,recovery:SessionPrograms.duelDose(n,block.duelBudget).reset},parts:[{name:block.title,kind:'task',milliseconds:(block.end-block.start)*60000,cue:'Akcia končí strelou, stratou, autom alebo pokynom trénera. Po dokončení kola vymeň roly.'}]};
    }
    if(block.programKind==='speed'){
      // The coach releases each wave; a stopwatch cannot determine a safe running time.
      const parts=[];let series=null;
      for(const phase of scene.phases.filter(p=>p.actualSeconds>0)){
        const match=phase.name.match(/^Séria (\d+)\/4/);
        if(match){
          if(!series||series.number!==match[1]){series={number:match[1],name:`Séria ${match[1]}/4 · jeden beh na dieťa`,kind:'work',milliseconds:0,requiresStart:match[1]!=='1',regroupBefore:match[1]!=='1',cue:'Vlny spúšťa tréner po uvoľnení dráhy. Každý raz; zvyšok série návrat a zotavenie.'};parts.push(series);}
          series.milliseconds+=phase.actualSeconds*1000;
        }else if(series&&phase.kind==='rest'){series.milliseconds+=phase.actualSeconds*1000;}
        else {series=null;parts.push({name:phase.name,kind:phase.kind,milliseconds:phase.actualSeconds*1000,cue:phase.cue});}
      }
      return {scope:`${area.label} · ${area.count} detí`,participants:area.count,speed:true,parts};
    }
    let previousWork=null;
    const parts=scene.phases.filter(phase=>phase.actualSeconds>0).map(phase=>{
      const series=phase.name.replace(/ · (?:kolo|časť) .*/,'');
      const grouped=['football-rondo','football-zones','football-mini-games'].includes(block.diagram)||['speed','large-game'].includes(block.programKind);
      const requiresStart=phase.kind==='work'&&previousWork!==null&&(!grouped||series!==previousWork);
      if(phase.kind==='work')previousWork=series;
      return {name:phase.name,kind:phase.kind,milliseconds:phase.actualSeconds*1000,requiresStart,regroupBefore:requiresStart,cue:phase.cue,roles:phase.roles};
    });
    return {scope:area?`${area.label} · ${area.count} detí`:'Celé mužstvo',participants:scene.nodes.filter(n=>n.kind==='player').length,parts};
  },
  participantsText(clock,snapshot){
    const ids=Array.from({length:clock.participants||clock.rotation?.count||0},(_,i)=>i+1),list=values=>values.length?values.join(', '):'nikto';
    if(!ids.length)return 'Cvičia: podľa pôvodného rozpisu\nOddychujú: podľa pôvodného rozpisu\nĎalší: '+(snapshot.next?.name||'ďalšie cvičenie');
    if(snapshot.finished)return 'Cvičia: nikto\nOddychujú: všetci\nĎalší: ďalšie cvičenie';
    if(clock.rotation){
      const describe=round=>{const roles=clock.rotation.roles;return roles.map((role,i)=>({role,id:(i+round)%clock.rotation.count+1}));};
      const now=describe(clock.rotationRound),next=describe(clock.rotationRound+1),names=entries=>entries.filter(p=>p.role!=='R').map(p=>`${p.id} (${p.role==='D'?'obrana':'útok'})`).join(', ');
      return `Cvičia: ${clock.taskRegroup?'nikto — pripravujú sa '+names(now):names(now)}\nOddychujú: ${clock.taskRegroup?'všetci počas výmeny':list(now.filter(p=>p.role==='R').map(p=>p.id))}\nĎalší: ${clock.taskRegroup?names(now):names(next)}`;
    }
    if(clock.speed&&snapshot.part.kind==='work'){
      const lanes=ids.length>=4?2:1,wave=clock.waves[snapshot.index]||0,active=ids.slice(wave*lanes,(wave+1)*lanes),next=ids.slice((wave+1)*lanes,(wave+2)*lanes);
      return `Cvičia: ${clock.waiting?'nikto — čakajú na štart':list(active)}\nOddychujú: ${clock.waiting?'všetci':list(ids.filter(id=>!active.includes(id)))}\nĎalší: ${clock.waiting?list(active):next.length?list(next):'ďalšia séria až po zotavení'} · vlnu potvrdí tréner`;
    }
    const work=snapshot.part.kind==='work'&&!clock.waiting,roles=snapshot.part.roles||{},rest=work?ids.filter(id=>roles['child'+(id-1)]?.label?.endsWith('R')):ids;
    const next=clock.parts.slice(snapshot.index+(work?1:0)).find(p=>p.kind==='work');
    const nextIds=next?ids.filter(id=>!next.roles?.['child'+(id-1)]?.label?.endsWith('R')):[];
    const named=(values,roles)=>values.map(id=>{const label=roles?.['child'+(id-1)]?.label||'';return String(id)+(label.endsWith('D')?' (obrana)':label.endsWith('N')?' (neutrálny)':'');});
    const detail=next?.cue&&/Obranca| N:/.test(next.cue)?' · '+next.cue:'';
    return `Cvičia: ${work?list(named(ids.filter(id=>!rest.includes(id)),roles)):'nikto — '+(snapshot.part.kind==='setup'?'ukážka trénera':'prestávka/príprava')}\nOddychujú: ${list(rest)}\nĎalší: ${next?list(named(nextIds,next.roles))+detail:'ďalšie cvičenie'}`;
  },
  rotationText(clock){
    if(!clock.rotation)return '';
    const {roles,count,lanes}=clock.rotation,round=clock.rotationRound||0;
    const children=role=>roles.flatMap((value,i)=>value===role?[(i+round)%count+1]:[]).join(', ')||'—';
    const recovery=` Návrat chôdzou a aspoň ${clock.rotation.recovery} s oddychu; pri únave dlhšie.`;
    if(lanes===1)return `Útok: ${children('A')} · Obrana: ${children('D')} · Oddych: ${children('R')}.`+recovery;
    const perLane=roles.filter(role=>role!=='R').length/lanes;
    return Array.from({length:lanes},(_,lane)=>{const entries=roles.slice(lane*perLane,(lane+1)*perLane).map((role,i)=>({role,id:(lane*perLane+i+round)%count+1}));return `${lane+1}. dráha: útok ${entries.filter(e=>e.role==='A').map(e=>e.id).join(', ')} / obrana ${entries.filter(e=>e.role==='D').map(e=>e.id).join(', ')}`;}).join(' · ')+` · Oddych: ${children('R')}. Výmena až po oboch útokoch.`+recovery;
  },
  signals(parts){
    const events=[];let offset=0;
    parts.forEach((part,index)=>{
      const end=offset+part.milliseconds;
      for(let seconds=5;seconds>=1;seconds--)if(part.milliseconds>=seconds*1000)events.push({at:end-seconds*1000,type:'countdown',seconds,index});
      const next=parts[index+1];
      const type=!next?'finish':next.requiresStart?'ready':next.kind==='work'?(part.kind==='work'?'change':'start'):part.kind==='work'?'stop':'transition';
      events.push({at:end,type,index});offset=end;
    });
    return events.sort((a,b)=>a.at-b.at);
  }
};

class IntervalClock {
  constructor(spec){
    this.participants=spec.participants;this.speed=spec.speed;this.rotation=spec.rotation;this.scope=spec.scope;this.originalParts=spec.parts.map(part=>({...part}));
    this.trainingTotal=spec.parts.reduce((sum,part)=>sum+part.milliseconds,0);
    this.reset();
  }
  settle(now){
    if(this.deadline===null)return;
    const elapsed=this.total-Math.max(0,this.deadline-now);let offset=0;
    for(let index=0;index<this.parts.length;index++){
      const part=this.parts[index];
      if(part.requiresStart&&offset>=this.progressBase&&elapsed>=offset){this.left=this.total-offset;this.deadline=null;this.waiting=true;this.waitIndex=index;return;}
      offset+=part.milliseconds;
    }
  }
  remaining(now=Date.now()){this.settle(now);return this.deadline===null?this.left:Math.max(0,this.deadline-now);}
  elapsed(now=Date.now()){return this.total-this.remaining(now);}
  start(now=Date.now()){
    if(this.remaining(now)<=0)this.reset();
    this.taskRegroup=false;
    if(this.deadline!==null)return;
    if(this.waiting){this.parts[this.waitIndex].requiresStart=false;this.parts.splice(this.waitIndex,0,{name:'Priprav sa na ďalšiu sériu',kind:'ready',milliseconds:5000});this.total+=5000;this.left+=5000;this.signals=TrainingIntervals.signals(this.parts);this.waiting=false;}
    this.progressBase=this.total-this.left;this.deadline=now+this.left;this.started=true;
  }
  pause(now=Date.now()){this.left=this.remaining(now);this.deadline=null;}
  reset(){this.waves={};this.rotationRound=0;this.taskRegroup=false;this.parts=this.originalParts.map(part=>({...part}));this.total=this.trainingTotal;this.signals=TrainingIntervals.signals(this.parts);this.left=this.total;this.deadline=null;this.started=false;this.waiting=false;this.waitIndex=-1;this.progressBase=0;}
  snapshot(now=Date.now()){
    const elapsed=this.elapsed(now);let offset=0,overall=0;
    for(const part of this.parts){const end=offset+part.milliseconds;if(part.kind!=='ready'&&elapsed<end)overall+=end-Math.max(offset,elapsed);offset=end;}offset=0;
    for(let index=0;index<this.parts.length;index++){
      const part=this.parts[index],end=offset+part.milliseconds;
      if(elapsed<end)return {part,index,remaining:end-elapsed,overall,next:this.parts[index+1],finished:false};
      offset=end;
    }
    return {part:{name:'Cvičenie dokončené',kind:'end'},index:this.parts.length,remaining:0,overall:0,next:null,finished:true};
  }
}

const TimerTonePatterns={
  countdown:[[0,880,.09]],start:[[0,1200,.42]],stop:[[0,440,.14],[.22,440,.14]],
  change:[[0,440,.12],[.2,1200,.35]],ready:[[0,740,.13],[.2,740,.13]],transition:[[0,660,.18]],finish:[[0,660,.18],[.25,880,.18],[.5,1100,.45]]
};

// TIMER_AUDIO_BROWSER
(() => {
  let context=null,clock=null,cursor=0,enabled=true,wake=null,waking=false,wakeDenied=false;
  const nodes=new Set();
  function cancel(){for(const node of nodes){try{node.stop();}catch{}}nodes.clear();clock=null;}
  function tone(type,when){
    if(!context||context.state!=='running'||!enabled)return;
    for(const [offset,frequency,duration]of TimerTonePatterns[type]||TimerTonePatterns.transition){
      const oscillator=context.createOscillator(),gain=context.createGain(),at=when+offset;
      oscillator.type='sine';oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.2,at+.008);gain.gain.setValueAtTime(.2,at+Math.max(.009,duration-.025));gain.gain.linearRampToValueAtTime(0,at+duration);
      oscillator.connect(gain);gain.connect(context.destination);nodes.add(oscillator);
      oscillator.onended=()=>{nodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(at);oscillator.stop(at+duration+.02);
    }
  }
  async function unlock(){
    if(!enabled)return false;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;if(!context)context=new Audio();await context.resume();return context.state==='running';}catch{return false;}
  }
  function bind(next,initial=false){
    cancel();clock=next;const elapsed=next.elapsed();cursor=next.signals.findIndex(event=>event.at>elapsed);if(cursor<0)cursor=next.signals.length;
    if(initial){const kind=next.snapshot().part.kind;tone(kind==='ready'?'countdown':kind==='work'?'start':'transition',context?.currentTime||0);}
  }
  function update(next){
    if(next.deadline===null||next.remaining()===0){
      // Final tone was already scheduled before the deadline. Do not cancel it at zero.
      if(next.deadline===null&&!next.waiting&&clock)cancel();return;
    }
    if(clock!==next)bind(next);
    if(!context||context.state!=='running'||!enabled)return;
    const elapsed=next.elapsed(),limit=elapsed+1500;
    while(cursor<next.signals.length&&next.signals[cursor].at<=limit){const event=next.signals[cursor++];if(event.at>=elapsed-40)tone(event.type,context.currentTime+Math.max(0,event.at-elapsed)/1000);}
  }
  async function keepAwake(running){
    if(!running){if(wake){await wake.release().catch(()=>{});wake=null;}return;}
    if(wake||waking||wakeDenied||document.hidden||!navigator.wakeLock)return;
    waking=true;try{wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null;});}catch{wakeDenied=true;}finally{waking=false;}
  }
  window.TimerAudio={unlock,bind,update,cancel,keepAwake,
    setEnabled(value){enabled=value;if(!value)cancel();},
    async test(){const ready=await unlock();if(ready)tone('start',context.currentTime);return ready;},
    status:()=>!enabled?'off':context?.state||'locked'
  };
})();
