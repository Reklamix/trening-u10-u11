'use strict';

const TrainingIntervals = {
  build(training,block,index=0){
    if(!training.planConfig)return {scope:'Celý blok',parts:[{name:block.title,kind:'work',milliseconds:(block.end-block.start)*60000}]};
    const areas=FootballScenes.groups(block.diagram,training.planConfig.players,training.quarterPitch),area=areas[index]||areas[0];
    const base=FootballScenes.build(block.diagram,{total:training.planConfig.players,size:area?.count,pitchIndex:index,area});
    const scene=FootballSequences.build(training,block,index,base);
    let previousWork=null;
    const parts=scene.phases.filter(phase=>phase.actualSeconds>0).map(phase=>{
      const series=phase.name.replace(/ · (?:kolo|časť) .*/,'');
      const requiresStart=phase.kind==='work'&&previousWork!==null&&(!['football-rondo','football-zones','football-mini-games'].includes(block.diagram)||series!==previousWork);
      if(phase.kind==='work')previousWork=series;
      return {name:phase.name,kind:phase.kind,milliseconds:phase.actualSeconds*1000,requiresStart};
    });
    return {scope:area?`${area.label} · ${area.count} detí`:'Celé mužstvo',parts};
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
    this.scope=spec.scope;this.originalParts=spec.parts.map(part=>({...part}));
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
    if(this.deadline!==null)return;
    if(this.waiting){this.parts[this.waitIndex].requiresStart=false;this.parts.splice(this.waitIndex,0,{name:'Priprav sa na ďalšiu sériu',kind:'ready',milliseconds:5000});this.total+=5000;this.left+=5000;this.signals=TrainingIntervals.signals(this.parts);this.waiting=false;}
    this.progressBase=this.total-this.left;this.deadline=now+this.left;this.started=true;
  }
  pause(now=Date.now()){this.left=this.remaining(now);this.deadline=null;}
  reset(){this.parts=[{name:'Priprav sa',kind:'ready',milliseconds:5000},...this.originalParts.map(part=>({...part}))];this.total=this.trainingTotal+5000;this.signals=TrainingIntervals.signals(this.parts);this.left=this.total;this.deadline=null;this.started=false;this.waiting=false;this.waitIndex=-1;this.progressBase=0;}
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
    if(initial)tone('countdown',context?.currentTime||0);
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
