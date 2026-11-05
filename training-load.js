'use strict';

// Keep the approved block doses; Monday includes the extra rondo requested by the coach.
const TrainingLoad = {
  kinds:['strength','speed','large-game'],
  merged(c){return c.width>=45&&c.height>=30;},
  skill(c,members){return ['base','standard','challenge'][Math.min(...members.map(i=>['base','standard','challenge'].indexOf(c.levels[i])))];},
  form(n){return{team:Math.floor(n/2),neutral:n%2,label:`${Math.floor(n/2)} na ${Math.floor(n/2)}${n%2?' + N':''}`};},
  apply(t){
    const c=t.planConfig,tue=t.programId===SessionPrograms.ids[1],old=t.blocks,areas=t.quarterPitch.stages['football-zones'].areas;
    const physical=(id,kind,title,minutes)=>({id,diagram:'football-'+kind,programKind:kind,title,start:0,end:minutes,summary:'',space:'',dose:'',steps:[],cues:[],adjustments:[],tables:[],topics:['coordination','movement']});
    const strength=physical('7','strength','Pohybová sila a rovnováha',4),speed=physical('8','speed','Krátke zrýchlenia a brzdenie',6);
    strength.summary='Ukáž kontrolovaný drep, rovnováhu a mäkký dopad; deti cvičia vo vlastnom priestore.';
    strength.dose='1 min ukážka + 4 × (20 s kvalitný pohyb + 10 s oddych) + 1 min voda/príprava = 4 min.';
    strength.cues=['Pomaly a kontrolovane. Koleno a chodidlo drž v rovnakom smere.'];
    strength.steps=['Tréner predvedie: rovnováha pravá, rovnováha ľavá, pomalý drep, nízky skok a mäkký dopad.','V každom 20 s úseku len niekoľko kvalitných opakovaní; pri rovnováhe pokojné držanie. Medzi úlohami 10 s oddych.','Bez závažia. Drep iba do zvládnutého rozsahu; pri skoku zostaň po dopade chvíľu stabilný.'];
    strength.adjustments=['Schéma ukazuje rozostupy; techniku pohybu názorne ukáže tréner.','Zjednoduš úlohu individuálne podľa kontroly pohybu, nie podľa technickej skupiny.'];
    speed.summary='Na signál svižne zrýchli po priamej dráhe, za cieľom plynulo zabrzdi a vráť sa vonkajšou stranou.';
    speed.dose='1 min ukážka + 4 série po 60 s + 1 min voda = 6 min. Každý beží raz za sériu; krátky beh do 4 s, zvyšok návrat a zotavenie.';
    speed.cues=['Rýchle prvé kroky, po cieli brzdi postupne.'];
    speed.steps=['Očísluj deti. V skupine 2–3 jedna dráha; od 4 dve súbežné dráhy. Ďalšia vlna na signál po 7 s.','Štyri série, každý presne jeden beh v každej. Prvá séria uvoľnenejšia, ďalšie svižne podľa pripravenosti.','Návrat chôdzou po označenej vonkajšej strane. Oddychujúci čakajú v 2 m servisnom páse. Ďalšiu sériu spustí tréner.'];
    speed.adjustments=['Rýchlosť podľa pripravenosti a kvality brzdenia; nie podľa Základy/Výzva.','Po poslednom behu sa všetci vrátia a vydýchnu do konca série. Zrýchlenia nepridávaj navyše k dávke.'];
    for(const b of[strength,speed]){b.stepTitles=['Úloha','Práca a oddych','Organizácia'];b.space=`${c.groupSizes.length} oddelené plochy; skupiny ${c.groupSizes.join(' + ')}.`;t.quarterPitch.stages[b.diagram]={areas:areas.map((a,i)=>({...a,count:c.groupSizes[i],skill:c.levels[i],programKind:b.programKind,runDistance:Math.min(tue?15:10,a.length-5)})),instructions:b.space};}
    old[1].loadSeconds=tue?720:600;old[2].loadSeconds=tue?840:600;old[3].loadSeconds=tue?720:840;old[4].loadSeconds=1080;
    if(!tue)old[1].dose='30 s ukážka + 3 × 150 s prihrávky + 2 × 30 s oddych + 1 min voda = 10 min.';
    if(!tue)old[2].duelBudget=480;
    old[2].dose=tue?'30 s ukážka + 10 min útokov/návratov + spolu 2 min medzi sériami + 90 s voda = 14 min. Pri 5: 4 × 5 kôl po 30 s.':'1 min ukážka + 8 min súbojov/návratov vrátane doplnkového oddychu + 1 min voda = 10 min. Pri 5: 3 × 5 kôl po 30 s + 30 s oddych; útok do 10 s, 20 s návrat/oddych.';
    let rondo;
    if(!tue){
      // The former small-game scene slot is free once the final game uses its larger field.
      const duelStage=t.quarterPitch.stages[old[2].diagram];
      old[2].diagram='football-mini-games';t.quarterPitch.stages[old[2].diagram]=duelStage;
      rondo={...old[2],id:'9',programExtra:true,programKind:'rondo',diagram:'football-rondo',title:'Držanie lopty s obrancom',loadSeconds:600};
      delete rondo.duelBudget;
      rondo.summary='Ukáž sa vedľa obrancu a prihraj voľnému spoluhráčovi.';
      rondo.dose='1 min ukážka + 2 × 210 s rotácií + 1 min medzi sériami + 1 min voda = 10 min. Pri 5: 5 × (30 s hra + 12 s oddych) v sérii.';
      rondo.cues=['Ukáž sa vedľa obrancu.'];rondo.topics=['passing','touch','decisions'];
      rondo.steps=[rondo.summary,rondo.dose,'Obranca sa mení podľa čísel, nie po chybe. Pri dvoch deťoch prihrávajte bez obrancu.'];
      rondo.adjustments=['Základy: obranca iba kráča a zachytáva prihrávky, pri nohe neodoberá. Pri opakovanom neúspechu zníž tlak.','Upevnenie: primerane aktívny obranca a voľné dotyky; po prihrávke vytvor nový uhol.'];
      const rondoAreas=areas.map((a,i)=>{const length=c.levels[i]==='base'?6:8,width=c.levels[i]==='base'?6:7;return{...a,x:a.x+(a.w-length)/2,y:a.y+(a.h-width)/2,w:length,h:width,length,width,count:c.groupSizes[i],skill:c.levels[i],programKind:'rondo'};});
      rondo.space=`${c.groupSizes.length} samostatné plochy: Základy 6 × 6 m, Upevnenie/Výzva 8 × 7 m. Priechody a obvod zostávajú voľné.`;
      t.quarterPitch.stages[rondo.diagram]={areas:rondoAreas,instructions:rondo.space};
    }
    old[3].dose=tue?'1 min ukážka + 2 × 4 min herný úsek + 1 min oddych medzi úsekmi + 2 min voda/prestavba = 12 min.':'1 min ukážka + 2 × 5 min herný úsek + 1 min oddych medzi úsekmi + 2 min voda/prestavba = 14 min.';
    const game=old[4];game.diagram='football-large-game';game.programKind='large-game';game.title='Hra s nábehmi a návratmi';game.summary='Po prihrávke podpor útok; po strate sa vráť medzi loptu a vlastnú bránku.';
    game.dose='1 min organizácia + 4 × 3 min herný úsek + 3 × 1 min oddych + 2 min voda/spätná väzba = 18 min. Pri 2–6 v hre je v každom úseku aj oddych.';
    game.topics=['games','movement','decisions'];game.cues=['Podpor útok. Po strate sa zapoj do obrany.'];
    game.steps=[game.summary,game.dose,'Vyrovnané družstvá v rámci svojej zóny, voľné dotyky. Bod za prevedenie alebo krátke zakončenie po zemi; N sám neboduje.'];
    game.adjustments=['Záťaž sleduj podľa skutočného zapojenia, kvality návratov a pripravenosti po prestávke.','Technicky rozdielne skupiny zachovaj podľa nastavenia. Väčší priestor je príležitosť na dlhší nábeh, nie povinnosť stále šprintovať.'];
    let games;
    if(this.merged(c)&&c.groupSizes.length===4){
      const w=Math.min((c.width-7)/2,30),h=Math.min(c.height-4,40),ox=(c.width-(2*w+3))/2,oy=(c.height-h)/2;
      games=[0,1].flatMap(i=>c.levels[i*2]===c.levels[i*2+1]?[{label:i?'B':'A',x:ox+i*(w+3),y:oy,w,h,length:h,width:w,members:[i*2,i*2+1],count:c.groupSizes[i*2]+c.groupSizes[i*2+1],skill:c.levels[i*2],programKind:'large-game'}]:[i*2,i*2+1].map(j=>({...areas[j],members:[j],count:c.groupSizes[j],skill:c.levels[j],programKind:'large-game'})));
    }else games=areas.map((a,i)=>({...a,members:[i],count:c.groupSizes[i],skill:c.levels[i],programKind:'large-game'}));
    t.quarterPitch.stages[game.diagram]={areas:games,instructions:this.merged(c)&&c.groupSizes.length===4?`${games.length} hry podľa náročnosti: A1+A2 alebo B1+B2 sa spoja iba pri rovnakej úrovni; rozdielne skupiny ostávajú oddelené. Priechody aspoň 3 m, obvod aspoň 2 m.`:`${games.length} oddelené hry podľa skupín; väčšiu hru zvoľ až s reálne dostupným priestorom a rovnakou náročnosťou.`};
    game.space=t.quarterPitch.stages[game.diagram].instructions;
    t.blocks=tue?[old[0],speed,...old.slice(1)]:[old[0],strength,speed,old[1],rondo,...old.slice(2)];
    let elapsed=0;for(const b of t.blocks){const seconds=b.loadSeconds??(b===strength?240:b===speed?360:(b.end-b.start)*60);b.start=elapsed/60;elapsed+=seconds;b.end=elapsed/60;}
    t.duration=tue?75:85;
    if(elapsed!==t.duration*60)throw Error('Session blocks must match the approved duration');
    t.loadRevision=1;t.physicalGoal='Príprava z 6+1 na 10+1 od leta: pohybová sila, kvalitné zrýchlenie, podpora útoku a návrat po strate.';
    t.sources.push({label:'The FA: fyzický rozvoj hráčov 9–12 rokov',url:'https://www.thefa.com/bootroom/resources/coaching/how-to-support-physical-development'});
    t.focus=t.physicalGoal+' '+(tue?'Krátke súboje a rozhodovanie.':'Prvý dotyk, presná prihrávka a odvaha v 1 na 1 so zakončením.');
    for(const b of t.blocks)if(b.programKind==='rondo')b.rotation=Array.from({length:7},(_,i)=>this.rondo(i+2));
    for(const b of t.blocks)if(!['warm','finish','large-game'].includes(b.programKind))b.tables=Array.from({length:7},(_,i)=>this.table(t,b,i+2));
    t.organizationNotes.push(t.physicalGoal,c.groupSizes.length===4?'Väčšia hra spája iba susedné technické skupiny A1+A2 a B1+B2 s rovnakou náročnosťou. Rozdielne úrovne ostávajú oddelené; fyzickú dávku uprav individuálne podľa pripravenosti.':'Každá skupina zostáva na vlastnej ploche podľa svojej náročnosti; fyzickú dávku uprav individuálne podľa pripravenosti.');
    if(!tue)t.organizationNotes.push('Dnes 85 minút: rondo zostáva a 1 na 1 so strelou je navyše. Ak klesá kvalita, pripravenosť alebo chuť hrať, záver skráť; 85 minút nie je povinná dávka pre každé dieťa.');
  },
  rondo(n){const work=Math.max(10,Math.min(35,Math.floor(210/n)-12));return{size:n,rounds:n,defenders:n===2?0:1,playSeconds:work,restSeconds:12,bufferSeconds:210-n*(work+12)};},
  gameDose(n,seconds=180){const small=n<=6,work=small?Math.floor(seconds*2/3):seconds,parts=n%2?n:(small?2:1),slot=Math.floor(work/parts),rest=small?Math.floor((seconds-work)/parts):0;return{parts,slot,rest,buffer:seconds-parts*(slot+rest)};},
  between(cycles,index){return Math.floor(120/(cycles-1))+(index<120%(cycles-1)?1:0);},
  equipment(t){
    const c=t.planConfig,small=c.groupSizes.reduce((sum,n)=>sum+TrainingPlanner.form(n).team,0),smallN=c.players-2*small,large=t.quarterPitch.stages['football-large-game'].areas,largeTeam=large.reduce((sum,a)=>sum+this.form(a.count).team,0),largeN=c.players-2*largeTeam,team=Math.max(small,largeTeam),neutral=Math.max(smallN,largeN);
    t.equipment[3].quantity=`${team} svetlých + ${team} tmavých${neutral?' + '+neutral+' odlišných pre N':''}`;
    t.equipment[3].detail='Maximum potrebných kusov každej farby naprieč cvikmi; v jednom cviku sa použije len jeho aktuálny počet.';
    const gates=Math.max(...t.blocks.map(b=>SessionPrograms.cones(t,b).filter(p=>p.kind==='gate').length/2));
    t.equipment[2].quantity=`${gates} ${gates===1?'bránka':gates<=4?'bránky':'bránok'} zo ${gates*2} pripravených mét`;
    t.equipment[2].detail='Maximum súčasných kužeľových bránok; ich méty už patria do celkového počtu mét.';
  },
  table(t,b,n){
    if(b.programKind==='zones'){
      const period=t.date==='2026-11-03'?240:300,parts=n<=3?6:n,slot=n<=3?period/10:Math.floor(period/n),f=TrainingPlanner.form(n);
      return{groupSize:n,caption:`${f.label}. Úsek ${period/60} min; čas v tabuľke je len práca, oddych podľa rozpisu.`,headers:['Čas práce','Neutrálni','Družstvá'],rows:Array.from({length:parts},(_,k)=>{const neutrals=Array.from({length:f.neutral},(_,j)=>(k+j)%n+1),others=Array.from({length:n},(_,i)=>i+1).filter(i=>!neutrals.includes(i));return[`${k*slot}–${(k+1)*slot} s`,neutrals.join(', ')||'Bez N',others.slice(0,f.team).join(', ')+' / '+others.slice(f.team).join(', ')];})};
    }
    if(b.programKind==='rondo'){const d=this.rondo(n);return{...SessionPrograms.table('rondo',n),caption:`2 série po 210 s: ${n} × (${d.playSeconds} s práca + 12 s oddych)${d.bufferSeconds?' + '+d.bufferSeconds+' s oddych':''}.`};}
    if(b.programKind==='speed')return{groupSize:n,caption:'4 série; každý 1 beh v sérii. Dve dráhy od 4 detí.',headers:['Vlna','Bežia','Ostatní'],rows:Array.from({length:Math.ceil(n/(n>=4?2:1))},(_,k)=>[String(k+1),Array.from({length:n>=4?2:1},(_,j)=>k*(n>=4?2:1)+j+1).filter(i=>i<=n).join(', '),'Oddych v servisnom páse; návrat vonkajšou stranou.'])};
    if(b.programKind==='strength')return{groupSize:n,caption:'Každý vlastné miesto, všetci súčasne.',headers:['Úloha','Práca','Oddych'],rows:['Rovnováha pravá','Rovnováha ľavá','Pomalý drep','Nízky skok a dopad'].map(v=>[v,'20 s','10 s'])};
    return SessionPrograms.table(b.programKind,n,b.duelBudget);
  },
  variant(t,b,index){
    const area=t.quarterPitch.stages[b.diagram].areas[index],n=area.count,c=t.planConfig,members=area.members||[index],label=members.map(i=>TrainingPlanner.labels(c.groupSizes.length)[i]+' · '+TrainingPlanner.levels[c.levels[i]]).join(' / ');
    let task=b.summary,rotation='Všetci vo vlastnom priestore.';
    if(b.programKind==='speed'){
      const lanes=n>=4?2:1;task=`${lanes} ${lanes===1?'dráha':'dráhy'} po ${area.runDistance} m. Každý 4 behy, raz za 60 s; beh do 4 s a potom návrat/oddych. Na prvý pokus uvoľnenejšie, potom svižne podľa pripravenosti.`;
      rotation=`Štartujú ${lanes} ${lanes===1?'hráč':'hráči'} naraz, ďalšia vlna po 7 s. Pri nepárnom počte posledný beží sám. Po cieli je brzdný priestor; späť chôdzou vonkajšou stranou. Na ďalšiu sériu majú všetci čas na zotavenie.`;
    }
    if(b.programKind==='large-game'){
      const f=this.form(n),d=this.gameDose(n);task=`${f.label}; spolu ${n} detí${members.length>1?' zo skupín '+members.map(i=>TrainingPlanner.labels(c.groupSizes.length)[i]).join('+'):''}. Po prihrávke sa ponúkni, po strate sa zapoj do obrany. ${area.skill==='base'?'Pri príjme približne 2 s bez odoberania.':'Primeraná aktívna obrana.'} Voľné dotyky; ${f.neutral?'N pomáha tímu s loptou a sám neboduje.':'bez N.'}`;
      if(n===2)task='1 na 1. Veď loptu do voľnej cesty a preveď ju cez súperovu bránku. Po strate sa vráť medzi loptu a svoju bránku; bez neutrálneho hráča.';
      task+=' '+(n===2?'Voľná cesta? Zrýchli prvé dva kroky; kľučka nie je povinná.':SessionPrograms.confidenceCue);
      rotation=f.neutral?`V každom úseku N postupne 1–${n}, po ${d.slot} s hry; odchádzajúci N vymení miesto s prichádzajúcim. Každý rovnako dlho N.`:'Vyrovnané družstvá; všetci zapojení, bez čakajúcich.';
      if(n<=6)rotation+=` Každý 3-minútový úsek: ${d.parts} × (${d.slot} s hra + ${d.rest} s oddych)${d.buffer?' + '+d.buffer+' s vydýchanie':''}.`;
      else if(d.buffer)rotation+=` Po poradí ${d.buffer} s vydýchanie do konca 3 min.`;
    }
    const steps=b.programKind==='strength'?[b.steps[0],b.steps[1]+' '+b.dose,b.steps[2]+' '+rotation]:b.programKind==='speed'?[task,b.dose+' '+b.steps[1],rotation+' '+b.steps[2]]:[task,b.dose,rotation];
    if(t.date==='2026-11-03'&&b.programKind==='speed')steps.push('Variant podľa videa v 3. a 4. sérii: dvojica začne oproti sebe vo vlastných oddelených dráhach. Prvý hráč krátko naznačí smer, druhý reaguje; potom každý zrýchli vo svojej dráhe k vlastnej cieľovej méte. V ďalšej sérii vymeň iniciátora. Pri jednej dráhe alebo nepárnom poslednom hráčovi štartuje jednotlivec na pohybový signál trénera.', 'Vo videu je beh po oblúku a súboj o tenisovú loptičku. Dnes pre U11 iba krátky oblúk, ak ho vieš vyznačiť v existujúcej ploche bez kríženia a so zachovaným brzdením; inak beh priamo. Bez spoločnej loptičky a kontaktu. Každý stále iba jeden beh v sérii, spolu štyri; nepridávaj ďalšie pokusy. Nákres a animácia ukazujú základný priamy beh, variant vysvetľuje tento postup a video.');
    return{...b,summary:task,skillTask:task,skillLabel:label,rotationText:rotation,steps,adjustments:[...b.adjustments],tables:b.programKind==='large-game'?[{caption:`${area.label}: ${this.form(n).label}`,headers:['Úsek','Roly'],rows:Array.from({length:4},(_,r)=>[String(r+1),rotation])}]:b.tables};
  },
  placement(t,b,index){
    const a=t.quarterPitch.stages[b.diagram].areas[index];
    if(b.programKind==='strength')return `4 rohové méty na plochu ${a.length} × ${a.width} m. Každý má vlastné miesto s rozostupom približne 2 m; techniku ukáže tréner.`;
    if(b.programKind==='speed')return `4 rohy. V 2 m od štartu vyznač servisný pás. ${a.count>=4?'Dve dráhy':'Jedna dráha'}: od servisnej čiary odmeraj ${a.runDistance} m a vyznač cieľ dvojicou mét. Za cieľom zostáva ${a.length-2-a.runDistance} m na plynulé brzdenie. Vonkajšie strany vyznač ako návratové cesty; servis ani návrat nesmú zasahovať do susedných plôch.`;
    return `Plocha ${a.length} × ${a.width} m: 4 rohové méty + 4 na dve 2 m bránky v strede koncových čiar. Priechod 3 m a obvod aspoň 2 m nechaj voľný.`;
  },
  scene(key,{area,size:n,total,pitchIndex}){
    const kind=area.programKind,pitch={x:40,y:46,w:280,h:280*area.width/area.length,length:area.length,width:area.width},p=(u,v)=>({x:pitch.x+u*pitch.w,y:pitch.y+v*pitch.h});
    const s={key,total,size:n,pitchIndex,pitch,localCount:n,nodes:[],tracks:{},arrows:[],cones:[],steps:[],lines:[],duration:8,loopMode:'cut',caption:'Schéma organizácie; techniku pohybu ukáže tréner.'};
    const add=(id,u,v,team='A',kind='player',label)=>s.nodes.push({id,...p(u,v),team,kind,label:label??(kind==='player'?String(Number(id.slice(1))+1):'')});
    const track=(id,frames)=>s.tracks[id]=frames.map(([time,u,v])=>[time,...Object.values(p(u,v))]);
    const cone=(u,v,kind='corner')=>s.cones.push({...p(u,v),kind});
    [[0,0],[1,0],[0,1],[1,1]].forEach(([u,v])=>cone(u,v));
    if(kind==='strength'){
      for(let i=0;i<n;i++){const u=.5+.34*Math.cos(i*2*Math.PI/n),v=.5+.34*Math.sin(i*2*Math.PI/n);add('p'+i,u,v);track('p'+i,[[0,u,v],[8,u,v]]);}
      s.steps=[{time:0,text:'Tréner ukáže pohyb; každý cvičí na svojom mieste. Schéma ukazuje rozostupy.'}];
    }else if(kind==='speed'){
      const lanes=n>=4?2:1,start=2/area.length,end=(2+area.runDistance)/area.length;
      s.annotations=[{...p((start+end)/2,.5),text:`Beh ${area.runDistance} m`}];
      for(const u of[start,end]){cone(u,0,'line');cone(u,1,'line');s.lines.push({from:p(u,0),to:p(u,1)});}
      for(let i=0;i<n;i++){
        const active=i<lanes,v=active?(i+.5)/lanes:(i-lanes+.5)/(n-lanes),u=active?start:.8/area.length;add('p'+i,u,v,active?'A':'N','player',String(i+1)+(active?'':'R'));
        track('p'+i,active?[[0,start,v],[5,end,v],[8,Math.min(.97,end+1.3/area.length),v]]:[[0,u,v],[8,u,v]]);
      }
      for(let i=0;i<lanes;i++){const v=(i+.5)/lanes;s.arrows.push({kind:'run',number:i+1,label:false,points:[p(start,v),p(end,v)]});const outer=i===0?.035:.965;s.lines.push({from:p(.95,outer),to:p(.08,outer)});}
      s.steps=[{time:0,text:`Zrýchli ${area.runDistance} m, za cieľom postupne brzdi. Návrat chôdzou vonkajšou stranou.`}];
    }else{
      const f=this.form(n);pitch.goals=true;pitch.goalGates=true;
      for(const u of[0,1])for(const v of[.5-1/area.width,.5+1/area.width])cone(u,v,'gate');
      for(let i=0;i<n;i++){
        const team=i<f.team?'A':i<2*f.team?'B':'N',j=i%f.team,u=team==='A'?.18+(j%2)*.16:team==='B'?.65+(j%2)*.14:.48,v=team==='N'?.04:(j+1)/(f.team+1);add('p'+i,u,v,team);
        const endU=team==='A'?Math.min(.88,u+.24):team==='B'?Math.max(.4,u-.12):.49;
        track('p'+i,[[0,u,v],[3,u+.04,v],[6,endU,v],[8,endU,v]]);
      }
      s.duration=12;
      for(const node of s.nodes){const frames=s.tracks[node.id],last=frames[2];s.tracks[node.id]=[...frames.slice(0,3),[12,last[1]-(node.team==='A'?.2:node.team==='B'?.12:0)*pitch.w,last[2]]];}
      add('ball',.2,1/(f.team+1),'A','ball','');
      const receiver=f.team>1?'p1':'p0',q=s.nodes.find(n=>n.id===receiver),opponent='p'+(f.team+(f.team>1?1:0)),won=FootballScenes.sample(s.tracks[opponent],7),carried=FootballScenes.sample(s.tracks[opponent],12);
      s.tracks.ball=[[0,p(.2,1/(f.team+1)).x,p(.2,1/(f.team+1)).y],[3,q.x+.04*pitch.w,q.y],[6,q.x+.24*pitch.w,q.y],[7,won.x+.02*pitch.w,won.y],[12,carried.x+.02*pitch.w,carried.y]];
      s.arrows=[{kind:'pass',number:1,label:false,start:0,end:3,points:[p(.18,1/(f.team+1)),{x:q.x+.04*pitch.w,y:q.y}]},{kind:'run',number:2,label:false,start:0,end:6,points:[p(.18,1/(f.team+1)),p(.42,1/(f.team+1))]},{kind:'run',number:3,label:false,start:6,end:12,points:[p(.42,1/(f.team+1)),p(.22,1/(f.team+1))]},{kind:'dribble',number:4,label:false,start:7,end:12,points:[{x:won.x,y:won.y},{x:carried.x,y:carried.y}]}];
      s.steps=[{time:0,text:'Prihrávka a nábeh; v druhej časti loptu získa súper a nasleduje návrat do obrany.'}];
      if(n===2){s.arrows[0]={kind:'dribble',number:1,label:false,start:0,end:6,points:[p(.2,.5),p(.42,.5)]};s.steps[0].text='Vedenie lopty; po zisku súpera návrat do obrany v 1 na 1.';}
      s.caption='Ukážková akcia: prihrávka, podpora, strata a skutočný návrat do obrany. Vo voľnej hre deti rozhodujú samy.';
    }
    return s;
  },
  plan(t,b,index,base,{action,hold,gameOrder,gameScene}){
    const n=base.localCount,kind=b.programKind;
    if(kind==='strength'){
      hold('Ukážka techniky',60,'setup','Tréner ukáže rovnováhu, pomalý drep a nízky skok s mäkkým dopadom.');
      for(const name of['Rovnováha pravá','Rovnováha ľavá','Pomalý drep','Nízky skok a dopad']){action(name,20,base,{seconds:3,cue:name+': pokojne a kontrolovane. Schéma ukazuje rozostupy; pohyb predvedie tréner.'});hold('Oddych a zmena úlohy',10);}
      hold('Voda a príprava dráh',60,'water');return true;
    }
    if(kind==='speed'){
      const lanes=n>=4?2:1,waves=Math.ceil(n/lanes),ids=Array.from({length:n},(_,i)=>'child'+i);
      hold('Ukážka dráh a brzdenia',60,'setup');
      for(let r=0;r<4;r++){
        let lastScene=base,lastOrder=ids;
        for(let k=0;k<waves;k++){
          const active=ids.slice(k*lanes,k*lanes+lanes),rest=ids.filter(id=>!active.includes(id)),source=active.length===lanes?base:this.singleRunner(base),order=[...active,...rest];
          lastScene=source;lastOrder=order;
          action(`Séria ${r+1}/4 · kolo ${k+1}/${waves}`,4,source,{order,seconds:4,cue:`Bežia ${active.map(id=>Number(id.slice(5))+1).join(', ')}; ostatní oddychujú v servisnom páse.`});hold('Brzdenie a uvoľnenie dráhy',3);
        }
        action('Návrat chôdzou a zotavenie',60-waves*7,this.walkback(lastScene),{kind:'rest',order:lastOrder,seconds:5,cue:'Vráť sa vonkajšou stranou a vydýchni. Ďalšiu sériu spustí tréner.'});
      }hold('Voda po zrýchleniach',60,'water');return true;
    }
    if(kind==='large-game'){
      const d=this.gameDose(n),neutral=n%2;hold('Organizácia väčšej hry',60,'setup');
      for(let r=0;r<4;r++){
        for(let k=0;k<d.parts;k++){const source=gameScene(r%2===1),neutrals=neutral?[k%n]:[];action(`Úsek ${r+1}/4 · časť ${k+1}/${d.parts}`,d.slot,source,{mirror:r%2===1,order:gameOrder(source,neutrals),cue:this.variant(t,b,index).skillTask+(neutral?' N: '+(k+1):'')});hold('Oddych v hernom úseku',d.rest);}
        hold('Výmena a vydýchanie',d.buffer);if(r<3)hold('Oddych medzi úsekmi',60,'water');
      }hold('Voda a krátka spätná väzba',120,'water');return true;
    }
    return false;
  },
  singleRunner(base){
    const out={...base,nodes:base.nodes.map(n=>({...n})),tracks:{...base.tracks},arrows:base.arrows.slice(0,1)},people=out.nodes.filter(n=>n.kind==='player');
    people.slice(1).forEach((node,i)=>{node.team='N';if(!node.label.endsWith('R'))node.label+='R';node.x=base.pitch.x+base.pitch.w*.8/base.pitch.length;node.y=base.pitch.y+base.pitch.h*(i+.5)/(people.length-1);out.tracks[node.id]=[[0,node.x,node.y],[8,node.x,node.y]];});return out;
  },
  walkback(base){
    const nodes=base.nodes.map(n=>({...n})),out={...base,nodes,tracks:{},arrows:[],duration:8},people=nodes.filter(n=>n.kind==='player'),p=base.pitch;
    const active=people.filter(n=>n.team==='A').length;
    people.forEach((node,i)=>{const running=node.team==='A',slot=active===2?(i===0?0:i===1?people.length-1:i-1):i,end=FootballScenes.sample(base.tracks[node.id],base.duration),x=p.x+p.w/p.length,y=p.y+p.h*(slot+.5)/people.length,side=p.y+p.h*(i%2?.965:.035);node.team='N';if(!node.label.endsWith('R'))node.label+='R';if(running){node.x=end.x;node.y=end.y;out.tracks[node.id]=[[0,end.x,end.y],[2,end.x,side],[6,x,side],[8,x,y]];}else out.tracks[node.id]=[[0,node.x,node.y],[3,x,y],[8,x,y]];});
    return out;
  },
  brief(t,b,index){
    const c=t.planConfig,a=t.quarterPitch.stages[b.diagram].areas[index],n=a.count,v=this.variant(t,b,index),s=this.scene(b.diagram,{area:a,size:n,total:c.players,pitchIndex:index}),conesTotal=SessionPrograms.cones(t,b).length;
    const speed=b.programKind==='speed',strength=b.programKind==='strength',work=speed?'do 4 s':strength?'20 s':n<=6?'120 s':'3 min',rest=speed?'návrat a zotavenie':strength?'10 s':'1 min',balls=strength||speed?0:1,ballsTotal=balls?t.quarterPitch.stages[b.diagram].areas.length:0;
    const kit=[`${s.cones.length} mét na túto plochu; ${conesTotal} spolu.`,this.placement(t,b,index),balls?'1 lopta na hru + rezervné.':'Lopty odlož mimo dráh a voľných priechodov.','Signál/časovač a vlastná voda.'];
    return{referenceVideo:speed&&t.date==='2026-11-03'?{url:'https://www.instagram.com/reel/De2Pr3eyR7R/',label:'Video: reakčný štart a súboj — COMPETE'}:null,title:b.title,selection:`Ukážka ${a.label} · ${n} z ${c.players} detí`,shortInstruction:b.summary,description:v.skillTask,steps:v.steps,space:`${a.length} × ${a.width} m; dostupných ${c.width} × ${c.height} m.`,grouping:`${a.label}: ${n} detí`,groups:c.groupSizes.map((size,i)=>`${TrainingPlanner.labels(c.groupSizes.length)[i]}: ${size} · ${TrainingPlanner.levels[c.levels[i]]}`),coaches:t.organizationNotes.filter(s=>s.startsWith('Tréner')),spacing:'Medzi pracovnými plochami aspoň 3 m, obvod aspoň 2 m.',work,rest,rotation:v.rotationText,glance:{work,rest,workHint:speed?'jeden beh':'v úseku',restHint:'podľa rozpisu'},timing:{totalMinutes:b.end-b.start,total:`${b.end-b.start} min`,work,workHint:speed?'jeden beh':'v úseku',rest,restHint:'podľa rozpisu',repetitions:{value:'4',hint:speed?'behy na dieťa':strength?'úlohy':'herné úseky'},schedule:b.dose,note:v.rotationText},notes:b.adjustments,kit,kitNotes:[],conePlacement:this.placement(t,b,index),slogan:b.cues[0],ballsLocal:balls,ballsTotal,conesLocal:s.cones.length,conesTotal,round:null,visualKit:[...(balls?[{kind:'ball',title:'Lopty',value:`${ballsTotal} + 4 rezervné`,detail:'Jedna na hru a rezervné bokom.'}]:[]),{kind:'cone',title:'Méty a kužele',value:`${conesTotal} spolu`,detail:`${s.cones.length} na túto plochu.`},{kind:'timer',title:'Časovač',value:'Pre trénera',detail:'Práca, oddych a štarty.'},{kind:'water',title:'Voda',value:`Pre ${c.players} detí`,detail:'Každý vlastnú vodu.'}]};
  }
};
