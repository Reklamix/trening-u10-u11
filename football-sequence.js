'use strict';

// A compressed walkthrough of the approved doses. The training clock is independent.
const FootballSequences = {
  build(training, block, index, base) {
    const config=training.planConfig;
    if(!config)return base;
    const key=block.diagram,n=base.localCount;
    const out={...base,nodes:[],tracks:{},arrows:[],steps:[],phases:[],duration:0,transfers:[]};
    const players=base.nodes.filter(node=>node.kind==='player'),balls=base.nodes.filter(node=>node.kind==='ball');
    const ids=players.map((_,i)=>'child'+i),ballIds=balls.map((_,i)=>'sequenceBall'+i);
    const sourcePlayers=scene=>scene.nodes.filter(node=>node.kind==='player');
    players.forEach((node,i)=>out.nodes.push({...node,id:ids[i],label:String(i+1)}));
    balls.forEach((node,i)=>out.nodes.push({...node,id:ballIds[i]}));
    for(const node of base.nodes.filter(node=>node.kind==='coach'))out.nodes.push({...node});
    const positions=new Map(out.nodes.map(node=>[node.id,{x:node.x,y:node.y}]));
    const push=(id,time,p)=>{const frames=out.tracks[id]||(out.tracks[id]=[]);if(frames.at(-1)?.[0]===time)frames[frames.length-1]=[time,p.x,p.y];else frames.push([time,p.x,p.y]);};
    let roles=Object.fromEntries(out.nodes.map(node=>[node.id,{team:node.team,label:node.label,visible:true}]));
    const append=(name,actualSeconds,{scene=null,order=ids,seconds=3,mirror=false,kind='rest',cue=name}={})=>{
      if(actualSeconds<=0)return;
      const start=out.duration,end=start+seconds,transition=Math.min(1,seconds/3),phase={name,actualSeconds,start,ready:start+(scene?transition:0),end,kind,cue,roles:{...roles}};
      const mapping=new Map(),targets=new Map(),transform=p=>mirror?{x:2*base.pitch.x+base.pitch.w-p.x,y:p.y}:p;
      if(scene){
        sourcePlayers(scene).forEach((node,i)=>mapping.set(node.id,order[i]));
        scene.nodes.filter(node=>node.kind==='ball').forEach((node,i)=>mapping.set(node.id,ballIds[i]));
        scene.nodes.filter(node=>node.kind==='coach').forEach(node=>mapping.set(node.id,node.id));
        for(const [source,id]of mapping){
          if(!id)continue;
          const node=scene.nodes.find(node=>node.id===source),p=transform(node);
          targets.set(id,{node,source,p});
          const person=ids.indexOf(id),suffix=node.team==='N'?'N':key==='football-rondo'&&node.team==='B'?'D':'';
          phase.roles[id]={team:node.team,label:person<0?node.label:String(person+1)+suffix,visible:true};
        }
        for(const id of ballIds)if(!targets.has(id))phase.roles[id]={...phase.roles[id],visible:false};
      }
      for(const node of out.nodes){
        const id=node.id,old=positions.get(id),target=targets.get(id);push(id,start,old);
        if(target){
          push(id,start+transition,target.p);
          const frames=scene.tracks[target.source]||[[0,target.node.x,target.node.y],[scene.duration,target.node.x,target.node.y]];
          for(const[t,x,y]of frames){const p=transform({x,y});push(id,start+transition+(seconds-transition)*t/(scene.duration||1),p);}
          positions.set(id,transform(FootballScenes.sample(frames,scene.duration)));
        }
        push(id,end,positions.get(id));
      }
      if(scene){
        const scale=(seconds-transition)/(scene.duration||1);
        for(const arrow of scene.arrows)out.arrows.push({...arrow,number:out.arrows.length+1,label:false,points:arrow.points.map(transform),start:start+transition+(arrow.start??0)*scale,end:Math.min(end,start+transition+(arrow.end??scene.duration)*scale)});
        for(const transfer of scene.transfers||[])out.transfers.push({...transfer,from:mapping.get(transfer.from),to:mapping.get(transfer.to),ballId:ballIds[0],depart:start+transition+transfer.depart*scale,arrive:start+transition+transfer.arrive*scale,settled:start+transition+transfer.settled*scale});
      }
      out.phases.push(phase);out.steps.push({time:start,text:cue});out.duration=end;roles=phase.roles;
    };
    const hold=(name,actualSeconds,kind='rest',cue=name)=>append(name,actualSeconds,{kind,cue,seconds:kind==='setup'?3:2});
    const action=(name,actualSeconds,scene=base,extra={})=>append(name,actualSeconds,{scene,kind:'work',cue:scene.steps[0]?.text||name,seconds:Math.max(5,Math.min(12,scene.duration+1)),...extra});
    const orderFor=(defenders=[],neutrals=[])=>{
      const assigned=new Set([...defenders,...neutrals]),others=ids.filter((_,i)=>!assigned.has(i));let attacker=0,defender=0,neutral=0;
      return players.map(node=>node.team==='N'?ids[neutrals[neutral++]]:key==='football-rondo'&&node.team==='B'?ids[defenders[defender++]]:others[attacker++]);
    };
    const neutralAt=(round,count)=>Array.from({length:count},(_,j)=>(round*count+j)%n);
    const gameScene=(reverse=false)=>{
      if(!reverse)return base;
      // Same tactical action in the opposite direction, with the other team on the ball.
      return {...base,nodes:base.nodes.map(node=>({...node,team:node.team==='A'?'B':node.team==='B'?'A':node.team}))};
    };
    const gameOrder=(scene,neutrals)=>{
      const available=ids.filter((_,i)=>!neutrals.includes(i)),team=Math.floor(available.length/2),slots={A:available.slice(0,team),B:available.slice(team),N:neutrals.map(i=>ids[i])},used={A:0,B:0,N:0};
      return sourcePlayers(scene).map(node=>slots[node.team][used[node.team]++]);
    };
    if(key==='football-warmup'){
      const mobilize={...base,tracks:{},arrows:[],nodes:base.nodes.map(node=>({...node}))};
      for(const node of players)mobilize.tracks[node.id]=base.tracks[node.id];
      mobilize.nodes=mobilize.nodes.filter(node=>node.kind!=='ball');mobilize.duration=base.duration;
      action('Rozhýbanie',120,mobilize,{seconds:18,cue:'Ľahký pohyb medzi spoluhráčmi, zmeny smeru a rozhýbanie. Lopty zatiaľ stoja.'});
      action('Vedenie lopty',180,base,{seconds:25,cue:'Každý vedie svoju loptu medzi spoluhráčmi. Hlava hore, vyhni sa im a zrýchli do voľna.'});
      const pass={...base,nodes:[],tracks:{},arrows:[],duration:8,transfers:[]},counts=config.groupSizes.slice(index*2,index*2+2);let offset=0,podIndex=0;
      counts.forEach((count,group)=>{
        const pods=Array.from({length:Math.floor(count/2)},()=>2);if(count%2)pods[pods.length-1]=3;
        pods.forEach((size,row)=>{
          const y=(row+1)/(pods.length+1),cx=group?.73:.27,dx=1.75/base.pitch.length,dy=3.5*Math.sqrt(3)/4/base.pitch.width;
          const poses=size===3?[[cx-dx,y-dy],[cx+dx,y-dy],[cx,y+dy]]:[[cx-dx,y],[cx+dx,y]],personIds=[];
          poses.forEach(([u,v])=>{const id='p'+offset,p={x:base.pitch.x+u*base.pitch.w,y:base.pitch.y+v*base.pitch.h};personIds.push(id);pass.nodes.push({id,label:String(++offset),...p,team:'A',kind:'player'});});
          const ballId=podIndex?'b'+podIndex:'ball',first=pass.nodes.find(node=>node.id===personIds[0]);pass.nodes.push({id:ballId,label:'',x:first.x+base.pitch.w*.03,y:first.y+base.pitch.h*.02,team:'A',kind:'ball'});
          const route=size===2?[0,1,1,0,0]:[0,1,1,2,2,0,0];
          pass.tracks[ballId]=route.map((target,i)=>{const node=pass.nodes.find(node=>node.id===personIds[target]);return[i*8/(route.length-1),node.x+base.pitch.w*.03,node.y+base.pitch.h*.02];});
          for(let i=0;i<size;i++)pass.arrows.push({kind:'pass',number:i+1,label:false,points:[personIds[i],personIds[(i+1)%size]].map(id=>{const node=pass.nodes.find(node=>node.id===id);return{x:node.x,y:node.y};})});
          podIndex++;
        });
      });
      for(let round=0;round<3;round++){
        action(`Prihrávky ${round+1}/3`,60,pass,{cue:'Dvojice/trojica vo svojej skupine. Prijmi a prihraj po zemi.'});
        if(round<2)hold(`Oddych po ${round+1}. sérii`,30);
      }
      hold('Voda a koniec rozohriatia',60,'water');
    }else if(key==='football-pass'){
      hold('Ukážka a rozdelenie',60,'setup',config.levels[index]==='base'?'Dvojice/trojica: prijmi, priprav si loptu a prihraj po zemi.':'Prijmi, prihraj po zemi a ukáž sa v novom uhle.');
      for(let round=0;round<3;round++){action(`Prihrávky ${round+1}/3`,180);if(round<2)hold(`Oddych po ${round+1}. sérii`,30);}
      hold('Voda a koniec cvičenia',60,'water');
    }else if(key==='football-rondo'){
      const rotation=block.rotation.find(row=>row.size===n);hold('Ukážka a očíslovanie hráčov',120,'setup',n===2?'Dvojica prihráva bez obrancu.':n>=7?'Očísluj deti. Dvaja obrancovia vnútri, ostatní sa ponúkajú.':'Očísluj deti. Obranca vnútri, ostatní sa ponúkajú okolo neho.');
      for(let series=0;series<2;series++){
        for(let round=0;round<rotation.rounds;round++){
          const defenders=rotation.defenders?Array.from({length:rotation.defenders},(_,j)=>(round+j)%n):[];
          action(`Séria ${series+1}/2 · kolo ${round+1}/${rotation.rounds}`,rotation.playSeconds,base,{order:orderFor(defenders),seconds:7,cue:defenders.length?`Obrana: ${defenders.map(i=>i+1).join(', ')}. Ostatní ponúkajú uhol a prihrávajú.`:'Dvojica prihráva bez obrancu. Prvý dotyk a nový uhol.'});
          hold(rotation.defenders?'Oddych · ďalší obranca na signál':'Oddych oboch hráčov',rotation.restSeconds);
        }
        hold(`Oddych po poradí · séria ${series+1}`,rotation.bufferSeconds);
        if(series===0)hold('Voda medzi sériami',60,'water');
      }
      hold('Voda a príprava zón',120,'water');
    }else if(key==='football-zones'||key==='football-mini-games'){
      const zones=key==='football-zones',count=zones?6:4,play=zones?(n<=3?60:n===4?80:90):(n<=3?120:240),neutralCount=TrainingPlanner.form(n).neutral;
      hold(zones?'Ukážka hry v zónach':'Organizácia minihry',zones?90:60,'setup',zones?'Bod za kontrolované vedenie alebo príjem v súperovej zóne.':n===2?'Hra 1 na 1. Preveď loptu cez súperovu kužeľovú bránku.':'Dve družstvá. Gól po zemi cez súperovu kužeľovú bránku.');
      for(let round=0;round<count;round++){
        const halves=zones&&n!==7?1:2;
        for(let half=0;half<halves;half++){
          const neutralRound=zones?(n===7?round*2+half:round):round*2+half,neutrals=neutralAt(neutralRound,neutralCount),reverse=(round+half)%2===1,source=gameScene(reverse);
          action(`${zones?'Kolo':'Úsek'} ${round+1}/${count}${halves===2?' · časť '+(half+1)+'/2':''}`,play/halves,source,{mirror:reverse,order:gameOrder(source,neutrals),cue:`${reverse?'Tmaví':'Modrí'} útočia ${reverse?'doľava':'doprava'}.${neutrals.length?' N: '+neutrals.map(i=>i+1).join(', ')+'.':''} ${zones?'Bod po príjme alebo vedení v koncovej zóne.':'Zakonči po zemi cez kužeľovú bránku.'}`});
        }
        if(zones||n<=3)hold(`Oddych po ${round+1}. ${zones?'kole':'úseku'}`,zones?120-play:120);
        if(round<count-1)hold(zones?'Prestávka medzi kolami':'Voda medzi úsekmi',zones?30:60,zones?'rest':'water');
      }
    }else if(key==='football-finish'){
      action('Pokojná chôdza',60,{...base,duration:4,tracks:Object.fromEntries(players.map(node=>[node.id,[[0,node.x,node.y],[4,180+(node.x-180)*.85,145+(node.y-145)*.85]]]))},{cue:'Spomaľ, vydýchaj sa a prejdi k trénerovi.'});
      hold('Voda',60,'water');hold('Otázka a konkrétna pochvala',60,'setup');
    }else return base;
    // Finish in the starting formation so repeating the whole sequence does not jump.
    const start=out.duration;for(const node of out.nodes){push(node.id,start,positions.get(node.id));push(node.id,start+2,node);}
    out.phases.push({name:'Cvičenie dokončené',actualSeconds:0,start,end:start+2,kind:'end',cue:key==='football-finish'?'Pokojný záver je dokončený. Môžeš dokončiť tréning.':'Ukážka prešla všetkými fázami. Pokračuj tlačidlom Hotovo → ďalej.',roles:out.phases[0].roles});
    out.steps.push({time:start,text:'Cvičenie dokončené. Všetky fázy sú prejdené.'});out.duration+=2;
    out.caption='Celé cvičenie v skrátenom čase: všetky fázy, prestávky a zmeny rolí. Herné akcie sú príklady, deti v hre rozhodujú samy.';
    return out;
  }
};
