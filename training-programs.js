'use strict';

// Approved sessions are isolated from the archived October template and later drafts.
const SessionPrograms = {
  ids:['u11-touch-2026-11-02','u11-decisions-2026-11-03','u11-support-2026-11-05'],
  supports(t){return this.ids.includes(t?.programId);},
  plain(t){return {...t,programId:undefined};},
  confidenceCue:'Voľná cesta? Skús 1 na 1 a zrýchli prvé dva kroky. Ak je cesta zavretá, využi spoluhráča; kľučka nie je povinná.',
  confidenceSupport:'Páruj deti podľa aktuálnej zručnosti a pohybovej vyspelosti. Pri opakovanom neúspechu alebo váhaní zníž tlak obrancu; pri samostatnom zvládaní ho postupne pridaj. Oceň konkrétny pokus, rozhodnutie a nové zapojenie po chybe; bez povinného počtu výhier.',
  duelDose(n,budget=600){
    const cycles=budget===600?Math.ceil(budget/(n*30)):Math.max(1,Math.floor(budget/(n*30))),slot=Math.floor(budget/(cycles*n)/5)*5;
    return {cycles,rounds:n,slot,action:10,reset:slot-10,buffer:budget-cycles*n*slot,between:180/(cycles-1)};
  },
  pods(n){const pods=Array.from({length:Math.floor(n/2)},()=>2);if(n%2)pods[pods.length-1]=3;return pods;},
  lanes(kind,n){return kind==='duel'?(n>=4?2:1):(n>=6?2:1);},
  roles(kind,n){
    const lane=this.lanes(kind,n),active=kind==='duel'||n===2?2:3;
    return Array.from({length:n},(_,i)=>i<lane*active?(i%active===active-1?'D':'A'):'R');
  },
  adapt(source,input){
    // Use the existing normalization/geometry; replace only the two approved programs.
    const raw={...this.plain(source),blocks:source.blocks.filter(b=>!['strength','speed'].includes(b.programKind)&&!b.programExtra)};
    const t=TrainingPlanner.adapt(raw,input),c=t.planConfig,tue=source.programId===this.ids[1],thu=source.programId===this.ids[2];
    t.programId=source.programId;
    const kinds=['warm',tue?'duel':'pairs',tue?'two-one':'duel','zones','game','finish'];
    const ends=tue?[10,22,38,54,72,75]:[10,22,36,52,72,75];
    const names=['Rozohriatie s loptou',tue?'1 na 1 so strelou':'Prijmi a prihraj',tue?'2 na 1 na dve bránky':'1 na 1 so strelou','Hra do koncových zón','Minihra podľa počtu','Pokojný záver'];
    const instructions=[
      'Pohybuj sa medzi spoluhráčmi, veď loptu do voľna a potom prihrávaj.',
      tue?'Prekonaj obrancu a po otvorení cesty zakonči krátkou prízemnou strelou na kužeľovú bránku.':'Prijmi loptu, priprav si ju a prihraj spoluhráčovi po zemi.',
      tue?'Pritiahni obrancu a vyber voľnú bránku alebo spoluhráča.':'Prekonaj obrancu a po otvorení cesty zakonči krátkou prízemnou strelou na kužeľovú bránku.',
      'Boduj vedením alebo príjmom prihrávky v súperovej zóne.',
      tue?'Vyber vedenie alebo prihrávku podľa situácie.':'Prijmi, prihraj a znovu sa ponúkni.',
      'Spomaľ, napi sa a povedz jednu vec, ktorá sa dnes podarila.'
    ];
    const dose=[
      '2 min rozhýbanie + 3 min vedenie + 3 × 60 s prihrávky + 2 × 30 s oddych + 1 min voda = 10 min.',
      tue?'1 min ukážka + 10 min krátkych súbojov a návratov + 1 min voda = 12 min. Pri 5: 4 × 5 kôl po 30 s; útok do 10 s, 20 s návrat/oddych.':'1 min ukážka + 3 × 3 min práca + 2 × 30 s oddych + 1 min voda = 12 min.',
      tue?'1 min ukážka + 10 min útokov a návratov + spolu 3 min medzi sériami + 2 min voda = 16 min. Pri 5: 4 × 5 kôl po 30 s.':'1 min ukážka + 2 × 5 min rotácií + 1 min voda medzi sériami + 2 min voda/prestavba = 14 min. Pri 5: v sérii 5 × (45 s práca + 15 s oddych).',
      '1 min ukážka + 5 min herný úsek + 1 min oddych + 5 min herný úsek + 2 min voda/spätná väzba + 2 min prestavba = 16 min. Pri 2–3 deťoch je v úseku aj oddych.',
      `1 min organizácia + 3 × 5 min herný úsek + 2 × 1 min oddych${tue?'':' + 2 min voda/spätná väzba'} = ${tue?18:20} min. Skupina 2–3 má v každom úseku aj oddych.`,
      '1 min pokojná chôdza + 1 min voda + 1 min otázka/pochvala = 3 min.'
    ];
    const gameAreas=t.quarterPitch.stages['football-zones'].areas;
    for(let i=0;i<6;i++){
      const b=t.blocks[i];b.diagram=['football-warmup','football-pass','football-rondo','football-zones','football-mini-games','football-finish'][i];b.programKind=kinds[i];b.title=names[i];b.start=i?ends[i-1]:0;b.end=ends[i];b.summary=instructions[i];b.dose=dose[i];delete b.loadSeconds;
      b.cues=[i===1&&tue?'Voľná cesta? Zrýchli prvé kroky.':instructions[i]];
      b.steps=[instructions[i],dose[i],i===5?'Jedna otázka, jedna konkrétna pochvala.':'Čísla hráčov držia poradie rotácie; po chybe nikoho netrestaj výmenou.'];
      b.stepTitles=['Úloha','Práca a oddych','Striedanie a tréner'];
      b.tables=[];b.variantNotes={};
      if(i>0&&i<5)b.tables=Array.from({length:7},(_,j)=>this.table(kinds[i],j+2));
      b.adjustments=['Zníž tlak, ak mizne kvalita. Pri dobrej kvalite pridaj aktívnejšiu obranu alebo nový uhol.',
        'Záťaž tvorí hra a krátke zrýchlenia do voľna. Pri zjavnej únave skráť herný úsek a pridaj oddych; žiadne trestné behy.'];
      if(kinds[i]==='duel')b.adjustments.push('Bez brankára, len krátke prízemné strely vo vlastnej dráhe. Za bránkou nechaj voľný priestor. Po strele, strate, aute alebo pokyne trénera je akcia hotová; obranca po zisku nezakončuje naspäť. Lopty zbieraj až po zastavení oboch dráh, návrat mimo streleckej dráhy.');
      b.topics=kinds[i]==='duel'?['duels','dribbling','coordination']:i===2&&tue?['decisions','passing','dribbling']:TrainingLibrary.tags[b.diagram];
      const stage=t.quarterPitch.stages[b.diagram];
      if(stage&&i>0&&i<5){
        stage.areas=gameAreas.map((a,j)=>({...a,programKind:kinds[i],skill:c.levels[j],count:c.groupSizes[j]}));
        if(kinds[i]==='rondo')stage.areas=stage.areas.map(a=>{const length=a.skill==='base'?6:8,width=a.skill==='base'?6:7;return{...a,x:a.x+(a.w-length)/2,y:a.y+(a.h-width)/2,w:length,h:width,length,width};});
        stage.instructions=`${c.groupSizes.length} plochy podľa nákresu; ${c.groupSizes.join(' + ')} detí. Medzi pracovnými plochami 3 m, po obvode aspoň 2 m voľna.`;
        b.space=stage.instructions;
      }
      b.rotation=Array.from({length:7},(_,j)=>({size:j+2,rounds:j+2,defenders:j===0?0:1,playSeconds:Math.min(45,Math.floor(300/(j+2))-15),restSeconds:15,bufferSeconds:0}));
    }
    if(thu){
      const ends=[10,22,34,50,72,75];
      t.blocks.forEach((b,i)=>{b.start=i?ends[i-1]:0;b.end=ends[i];b.cues.unshift('Prihraj a vytvor nový voľný uhol.');});
      t.blocks[1].title='Prihraj a ponúkni sa';
      t.blocks[1].summary='Prijmi bokom, prihraj po zemi a ponúkni sa v novom uhle.';
      t.blocks[2].dose='12 min celá úloha 1 na 1 so strelou vrátane ukážky, návratov, oddychu a vody. Obranca sa mení po dokončení útoku; ďalší pokus až po pripravení.';
      t.blocks[4].title='Minihry: prihrávka a nová ponuka';
      t.blocks[4].dose='1 min organizácia + 4 × 4 min herný úsek + 3 × 1 min oddych + 2 min voda a spätná väzba = 22 min. Pri 2–3 deťoch má každý herný úsek aj vlastný oddych.';
      t.blocks[4].tables=Array.from({length:7},(_,j)=>this.table('game',j+2,600,240));
      t.blocks[4].summary='Prihraj, zmeň uhol a ponúkni sa znova. Voľná cesta umožňuje aj 1 na 1; bez povinného počtu prihrávok.';
      t.sources.push({label:'The FA: rozvoj techniky a rozhodovania detí',url:'https://www.thefa.com/bootroom/resources/coaching/how-to-support-technical-tactical-development'});
    }
    if(!thu&&typeof TrainingLoad!=='undefined')TrainingLoad.apply(t);
    for(const b of t.blocks)if(['duel','zones','large-game'].includes(b.programKind)){
      b.adjustments.push(this.confidenceSupport);
      b.cues.push(this.confidenceCue);
      b.topics=[...new Set([...b.topics,'duels'])];
    }
    t.notes=t.notes.filter(n=>n.title!=='Odvaha v 1 na 1');
    t.notes.unshift({title:'Odvaha v 1 na 1',text:(tue?'Samostatné krátke súboje, potom rozhodovanie 2 na 1. ':'Samostatné 1 na 1 so strelou, potom prenos do koncových zón a záverečnej hry. ')+this.confidenceCue+' '+this.confidenceSupport});
    t.sources.push({label:'The FA: individuálne výzvy v malých hrách',url:'https://www.thefa.com/bootroom/resources/coaching/challenges-in-small-sided-games'});
    t.sources.push({label:'The FA: 1 na 1 so zakončením',url:'https://www.thefa.com/bootroom/resources/coaching/1v1-and-score'});
    // Dynamic kit totals come from exactly the same scene markers as the maps.
    for(const b of t.blocks){
      const areas=FootballScenes.groups(b.diagram,c.players,t.quarterPitch);
      const counts=areas.map((area,j)=>FootballScenes.build(b.diagram,{total:c.players,size:area.count,pitchIndex:j,area}).cones?.length||0);
      const count=counts[0]||0;
      b.coneSetup={perArea:count,areas:areas.length,total:counts.reduce((a,b)=>a+b,0),counts,placement:this.placement(b.programKind,t,0),extra:counts.every(v=>v===count)?'Všetky skupiny majú rovnaké rozloženie.':`Počty podľa skupín: ${counts.join(' + ')}. Presný počet otvor v Pomôckach vybranej skupiny.`};
    }
    const maximum=Math.max(...t.blocks.map(b=>this.cones(t,b).length));
    t.equipment[1].quantity=`${maximum} pracovných + 8 rezervných = ${maximum+8} mét`;
    t.equipment[1].detail='Maximum súčasne rozložených mét podľa zvolených skupín. Bránkové méty sú už započítané; medzi cvikmi ich presúvaj podľa prípravy.';
    const gates=Math.max(...t.blocks.map(b=>this.cones(t,b).filter(p=>p.kind==='gate').length/2));
    t.equipment[2].quantity=`${gates} bránok z ${gates*2} pripravených kužeľov`;
    t.equipment[2].detail='Maximum súčasných kužeľových bránok; ich méty už patria do celkového počtu mét.';
    if(t.loadRevision)TrainingLoad.equipment(t);
    const load=t.loadRevision?'Pohybová príprava 6+1 → 10+1: krátke kvalitné zrýchlenia, koordinácia a väčšia hra s nábehmi a návratmi. Rýchlosť podľa pripravenosti; ďalšiu sériu spustí tréner.':tue?'Krátke intenzívne akcie do 10 s, návrat a oddych 15–20 s. Ďalší štart až po signále, medzi sériami voda.':'Aktívne držanie lopty a malé hry, po prihrávke nová ponuka. Zrýchlenie iba do voľného priestoru; medzi hernými úsekmi oddych.';
    t.organizationNotes.push('Riadená záťaž: '+load,'Na začiatku sleduj pripravenosť, počas práce kvalitu pohybu. Pri únave uber odpor alebo čas hry a pridaj oddych.');
    t.notes=t.notes.filter(n=>!['Zameranie tohto dňa','Organizácia podľa aktuálnych podmienok','Riadená záťaž'].includes(n.title));
    t.notes.unshift({title:'Riadená záťaž',text:load},{title:'Organizácia podľa aktuálnych podmienok',text:t.organizationNotes.join(' ')});
    t.sources=[...new Map(t.sources.map(s=>[s.url,s])).values()];
    return t;
  },
  table(kind,n,budget=600,period=300){
    const ids=Array.from({length:n},(_,i)=>i+1);
    if(['duel','two-one'].includes(kind)){
      const roles=this.roles(kind,n),d=this.duelDose(n,budget);
      return{groupSize:n,caption:'Po každom dokončenom útoku posuň roly o jedno miesto. Po celom poradí začni znova podľa pripravenosti; A útok, D obrana, R oddych.',headers:['Kolo','Útok','Obrana','Oddych','Kedy vymeniť'],rows:ids.map((_,k)=>[String(k+1),...['A','D','R'].map(role=>ids.filter((_,i)=>roles[i]===role).map(id=>(id-1+k)%n+1).join(', ')||'—'),'Po dokončení útoku a pokojnom návrate'])};
    }
    if(kind==='rondo')return{groupSize:n,caption:'2 série, obranca sa mení podľa čísel; nie po chybe.',headers:['Kolo','Obranca','Prihrávajú'],rows:ids.map(id=>[String(id),n===2?'Bez obrancu':String(id),ids.filter(p=>n===2||p!==id).join(', ')])};
    if(['zones','game'].includes(kind)){const f=TrainingPlanner.form(n),slot=n<=3?period/10:Math.floor(period/n);return{groupSize:n,caption:`${f.label}. Roly v každom hernom úseku; tabuľka ukazuje čas hry bez prestávok.`,headers:['Čas hry','Neutrálni','Družstvá'],rows:Array.from({length:n<=3?6:n},(_,k)=>{const neutrals=Array.from({length:f.neutral},(_,j)=>(k+j)%n+1),others=ids.filter(id=>!neutrals.includes(id));return[`${k*slot}–${(k+1)*slot} s`,neutrals.join(', ')||'Bez N',others.slice(0,f.team).join(', ')+' / '+others.slice(f.team).join(', ')];})};}
    return{groupSize:n,caption:'Každá podskupina má vlastnú loptu; každý je aktívny.',headers:['Počet','Rozdelenie'],rows:[[String(n),this.pods(n).map(v=>v===2?'dvojica':'trojica').join(' + ')]]};
  },
  variant(t,b,index){
    if(typeof TrainingLoad!=='undefined'&&TrainingLoad.kinds.includes(b.programKind))return TrainingLoad.variant(t,b,index);
    if(['warm','finish'].includes(b.programKind))return TrainingPlanner.forGroup(this.plain(t),b,index);
    const n=t.planConfig.groupSizes[index],level=t.planConfig.levels[index],base=level==='base',kind=b.programKind;
    let task=b.summary,rotation='';
    if(kind==='pairs')task=`Vytvor ${this.pods(n).map(v=>v===2?'dvojicu':'trojicu').join(' + ')}. ${base?'Prihrávky na 3–4 m: prijmi, priprav a prihraj.':'Prihrávky na 4–6 m, pohľad pred prijatím, prvý dotyk do voľna a nový uhol po prihrávke.'} Každá podskupina vlastnú loptu; počas oddychu vymeň partnerov.`;
    if(t.programId===this.ids[2]&&kind==='pairs'){task+=' Po úspešnej prihrávke urob 1–2 kroky do voľného uhla a ukáž sa spoluhráčovi; pri problémoch najprv zabezpeč príjem a presnosť.';rotation='Každá dvojica/trojica cvičí súčasne s vlastnou loptou. V trojici poradie 1 → 2 → 3 → 1. Partnerov vymeň v 30 s prestávke, novú sériu spustí tréner.';}
    if(kind==='rondo'){const play=t.loadRevision?TrainingLoad.rondo(n).playSeconds:Math.min(45,Math.floor(300/n)-15),buffer=t.loadRevision?TrainingLoad.rondo(n).bufferSeconds:300-n*(play+15);task=n===2?'Dvojica bez obrancu. Prihrávaj, priprav prvý dotyk a znovu sa ponúkni.':`${n-1} na 1. ${base?'Obranca iba kráča a zachytáva prihrávku, pri nohe neodoberá. Ak sa nedarí, dočasne prihrávajte bez odoberania.':'Obranca aktívne zatvára líniu; ostatní sa ponúkajú. Voľné dotyky.'}`;rotation=`2 série po ${n} kolách: ${play} s práca + ${t.loadRevision?12:15} s oddych/výmena${buffer?`; po poradí ešte ${buffer} s oddych`:''}. ${n===2?'Bez obrancu.':'Obranca podľa čísel 1–'+n+', každý raz v sérii; nikdy nie za chybu.'}`;}
    if(['duel','two-one'].includes(kind)){
      const d=this.duelDose(n,b.duelBudget),roles=this.roles(kind,n),lanes=this.lanes(kind,n);
      task=kind==='duel'?`${lanes} ${lanes===1?'dráha':'dráhy'}, v každej 1 na 1 a jedna kužeľová bránka bez brankára. Prekonaj obrancu, otvor si cestu a zakonči krátkou prízemnou strelou. Po strele, strate, aute alebo pokyne trénera akcia končí; obranca po zisku nezakončuje naspäť. ${base?'Obranca začína o 2 s neskôr a s kontrolovaným odporom.':'Aktívny obranca; zmeň smer alebo rytmus a zrýchli do otvorenej cesty.'}`:n===2?'Pri dvoch hrajte 1 na 1 na dve bránky; tretieho hráča nepridávame.':`${lanes} ${lanes===1?'hra':'hry'} 2 na 1. Voľné vedenie aj prihrávka, bez povinnej kombinácie. ${base?'Obranca najprv iba zatvára cestu/zachytáva prihrávku.':'Pritiahni obrancu a rozhodni podľa jeho reakcie.'}`;
      rotation=`Obrancu vymeň po každom dokončenom útoku. ${lanes>1?'Počkaj na dokončenie oboch dráh. ':''}Potom každý postúpi o jednu rolu: ${roles.join(' → ')}; A útok, D obrana, R oddych. Po ${n} kolách prejde každý celý kruh. Návrat chôdzou a aspoň ${d.reset} s oddychu po útoku; pri únave dlhšie. Voda podľa potreby; nevyžaduj pevný počet útokov. Preskupenie potvrď tlačidlom Pripravení — pokračovať.`;
    }
    if(kind==='two-one')task+=' Útok končí zakončením, stratou, autom alebo pokynom trénera; po uviaznutí akciu pokojne obnov.';
    if(['zones','game'].includes(kind)){
      const f=TrainingPlanner.form(n),period=t.programId===this.ids[2]&&kind==='game'?240:t.loadRevision&&kind==='zones'&&t.programId===this.ids[1]?240:300,unit=n<=3?period/10:Math.floor(period/n);
      task=`${f.label}. ${kind==='zones'?'Bod za vedenie alebo príjem v koncovej zóne.':'Bod za kontrolované prevedenie alebo prízemné zakončenie cez bránku.'} ${f.neutral?'N pomáha držiteľovi lopty a sám neboduje. ':''}${base?'Pri príjme približne 2 s bez odoberania, voľné dotyky.':'Aktívna primeraná obrana; po akcii pokračuj v hre.'}`;
      rotation=f.neutral?`Roly posúvaj podľa čísel po ${Number(unit.toFixed(2))} s hry; v každom ${period/60}-minútovom úseku každý rovnako dlho N. Odchádzajúci N zaujme miesto prichádzajúceho. Neutrálna rola je práca, nie oddych.`:'Bez neutrálnych; vyrovnané družstvá v rámci skupiny.';
      if(n<=3)rotation+=` V každom ${period/60}-minútovom úseku 6 × (${period/10} s hra + ${period/15} s oddych) = ${period*.6} s hry / ${period*.4} s oddychu.`;
      else if(period%n)rotation+=` Po celom poradí ešte ${period-n*unit} s na výmenu/vydýchanie; celý úsek ${period/60} min.`;
    }
    if(t.programId===this.ids[2]&&['zones','game'].includes(kind))task+=' Po prihrávke vytvor nový voľný uhol; neschovaj sa za obrancu. Bez povinného počtu prihrávok.';
    if(['duel','zones'].includes(kind))task+=' '+(kind==='duel'?'Voľná cesta? Zrýchli prvé dva kroky. Vyber vlastné riešenie; kľučka nie je povinná.':this.confidenceCue);
    const taskDose=['duel','two-one'].includes(kind)?`${b.end-b.start} min celá úloha vrátane vysvetlenia, návratov, oddychu a vody; útoky sa neodpočítavajú. Čas zahŕňa aj návraty a oddych. Pri únave úlohu skráť alebo preruš.`:b.dose;
    return {...b,dose:taskDose,skillLabel:TrainingPlanner.levels[level],skillTask:task,summary:task,steps:[task,taskDose,rotation||'Pravidelne vymeň partnerov počas prestávky.'],adjustments:[task,...b.adjustments],rotationText:rotation};
  },
  placement(kind,t,index){
    if(typeof TrainingLoad!=='undefined'&&TrainingLoad.kinds.includes(kind))return TrainingLoad.placement(t,t.blocks.find(b=>b.programKind===kind),index);
    const key=t.blocks.find(b=>b.programKind===kind)?.diagram,area=t.quarterPitch.stages[key]?.areas?.[index];
    if(!area)return 'Bez nového rozkladania; pomôcky zbieraj až po zastavení hry.';
    const l=area.length,w=area.width,n=area.count;
    if(kind==='warm')return `4 rohové méty na zónu ${l} × ${w} m, ${t.quarterPitch.stages[key].areas.length*4} spolu. Vnútri voľný priestor na vedenie medzi deťmi.`;
    if(['duel','two-one'].includes(kind)){
      const lanes=this.lanes(kind,n),laneW=(w-(lanes-1))/lanes;
      return `4 rohy plochy ${l} × ${w} m. Vo vzdialenosti 2 m od štartu označ servisný pás pre oddych a lopty. Za ním ${lanes} ${lanes===1?'dráha':'dráhy'} ${(l-2)} × ${laneW} m${lanes===2?', medzi nimi 1 m deliaci pás':''}. ${kind==='two-one'?`Na vzdialenom konci každej dráhy dve bránky ${lanes===2?1:2} m, vyznačené 4 métami.`:`Na vzdialenom konci uprostred každej dráhy jedna ${lanes===2?1:2} m bránka z 2 mét. Len prízemné strely; za bránkou nechaj voľný obvodový pás. Návrat mimo streleckej dráhy, lopty zbieraj až po zastavení oboch dráh.`} Všetko vo vnútri pracovnej plochy.`;
    }
    return `4 rohy každej plochy ${l} × ${w} m.${kind==='zones'?' Ďalšie 4 méty na hranice zón 2 m od oboch koncov.':kind==='game'?' Ďalšie 4 méty na dve 2 m bránky v strede koncových čiar.':''}`;
  },
  cones(t,b){return FootballScenes.groups(b.diagram,t.planConfig.players,t.quarterPitch).flatMap((area,i)=>{const s=FootballScenes.build(b.diagram,{total:t.planConfig.players,size:area.count,pitchIndex:i,area});return(s.cones||[]).map(p=>({...FootballScenes.mapPoint(area,s.pitch,p),area:area.label,kind:p.kind}));});},
  scene(key,opts){
    if(typeof TrainingLoad!=='undefined'&&TrainingLoad.kinds.includes(opts.area.programKind))return TrainingLoad.scene(key,opts);
    const {area,size:n,total,pitchIndex}=opts,kind=area.programKind;
    if(['zones','game'].includes(kind))return FootballScenes.build(key,{...opts,area:{...area,programKind:undefined}});
    const pitch={x:40,y:46,w:280,h:280*area.width/area.length,length:area.length,width:area.width};
    const s={key,total,size:n,pitchIndex,localCount:n,pitch,nodes:[],tracks:{},arrows:[],steps:[],cones:[],duration:8,loopMode:'cut',caption:'Celá ukážková akcia. V hre hráči rozhodujú podľa situácie.'};
    const p=(u,v)=>({x:pitch.x+u*pitch.w,y:pitch.y+v*pitch.h});
    const node=(id,u,v,team='A',kind='player',label)=>{const q=p(u,v);s.nodes.push({id,...q,kind,team,label:label??(kind==='player'?String(s.nodes.filter(v=>v.kind==='player').length+1):'')});};
    const track=(id,frames)=>s.tracks[id]=frames.map(([time,u,v])=>[time,...Object.values(p(u,v))]);
    const cone=(u,v,kind='corner',label)=>{const q=p(u,v);if(!s.cones.some(v=>Math.hypot(v.x-q.x,v.y-q.y)<.001))s.cones.push({...q,kind,...(label?{label}:{})});};
    const arrow=(kind,points)=>s.arrows.push({kind,number:s.arrows.length+1,label:false,points:points.map(([u,v])=>p(u,v))});
    [[0,0],[1,0],[0,1],[1,1]].forEach(([u,v])=>cone(u,v));
    if(kind==='pairs'){
      const pods=this.pods(n);let offset=0;
      pods.forEach((count,j)=>{
        const cy=(j+.5)/pods.length,dy=Math.min(.14,1/(pods.length*3)),dx=(area.skill==='base'?3.5:5)/area.length/2;
        const poses=count===2?[[.5-dx,cy],[.5+dx,cy]]:[[.5-dx,cy-dy],[.5+dx,cy-dy],[.5,cy+dy]];
        poses.forEach(([u,v],k)=>{const id='p'+(offset+k),arrival=(2*k+1)*8/(2*count),settled=Math.min(8,arrival+8/(2*count));node(id,u,v);track(id,[[0,u,v],[arrival,u,v],[settled,u+(area.skill==='base'?0:(k%2?-.04:.04)),v+(area.skill==='base'?0:.025)],[8,u+(area.skill==='base'?0:(k%2?-.04:.04)),v+(area.skill==='base'?0:.025)]]);});
        const id='ball'+j;node(id,poses[0][0]+.025,poses[0][1]+.02,'A','ball');
        const route=count===2?[0,1,1,0,0]:[0,1,1,2,2,0,0];s.tracks[id]=route.map((k,i)=>{const time=8*i/(route.length-1),q=FootballScenes.sample(s.tracks['p'+(offset+k)],time);return[time,q.x+.025*pitch.w,q.y+.02*pitch.h];});
        poses.forEach((a,k)=>arrow('pass',[a,poses[(k+1)%count]]));offset+=count;
      });
    }else if(kind==='rondo'){
      const attackers=n===2?2:n-1,poses=Array.from({length:attackers},(_,i)=>[.5+.37*Math.cos(i*2*Math.PI/attackers),.5+.37*Math.sin(i*2*Math.PI/attackers)]);
      poses.forEach(([u,v],i)=>{node('p'+i,u,v);track('p'+i,[[0,u,v],[4,u-.03*(u-.5),v+.03*(v-.5)],[8,u,v]]);});
      if(n>2){node('def',.5,n===3?.25:.5,'B');track('def',n===3?[[0,.5,.25],[2,.6,.3],[4,.42,.25],[6,.5,.32],[8,.5,.25]]:[[0,.5,.5],[2,.6,.43],[4,.42,.48],[6,.5,.6],[8,.5,.5]]);}
      node('ball',poses[0][0]+.025,poses[0][1]+.02,'A','ball');
      track('ball',Array.from({length:attackers*2+1},(_,i)=>{const a=poses[Math.ceil(i/2)%attackers];return[8*i/(attackers*2),a[0]+.025,a[1]+.02];}));
      poses.forEach((a,i)=>arrow('pass',[a,poses[(i+1)%attackers]]));
    }else{
      const lanes=this.lanes(kind,n),active=kind==='duel'||n===2?2:3,service=2/area.length,gap=lanes===2?1/area.width:0,laneW=(1-gap*(lanes-1))/lanes;
      s.lines=[{from:p(service,0),to:p(service,1),label:'2 m servis'}];
      cone(service,0,'service');cone(service,1,'service');
      for(let lane=0;lane<lanes;lane++){
        const low=lane*(laneW+gap),high=low+laneW,mid=(low+high)/2;
        if(lanes===2){for(const v of[low,high]){cone(service,v,'lane');cone(1,v,'lane');}s.lines.push({from:p(service,low),to:p(1,low)},{from:p(service,high),to:p(1,high)});}
        const u=service+.07,dy=laneW*.24,idx=lane*active;
        node('p'+idx,u,mid-dy);track('p'+idx,[[0,u,mid-dy],[2,.4,mid-dy],[4,.6,mid+dy],[6,.8,mid+dy],[8,.96,mid+dy]]);
        const defender=idx+active-1;node('p'+defender,.42,mid,'B');track('p'+defender,[[0,.42,mid],[2,area.skill==='base'?.42:.48,area.skill==='base'?mid:mid-dy*.5],[4,.62,active===3?mid-dy:mid],[6,.76,active===3?mid-dy:mid],[8,.83,mid]]);
        let route=[[0,u+.025,mid-dy+.02],[2,.425,mid-dy+.02],[4,.625,mid+dy+.02],[6,.825,mid+dy+.02],[8,.98,mid+dy]];
        if(active===3){
          node('p'+(idx+1),u,mid+dy);track('p'+(idx+1),[[0,u,mid+dy],[2,.4,mid+dy],[4,.58,mid+dy],[6,.8,mid+dy],[8,.97,mid+dy]]);
          track('p'+idx,[[0,u,mid-dy],[2,.4,mid-dy],[4,.6,mid-dy],[6,.8,mid-dy],[8,.94,mid-dy]]);
          track('p'+defender,[[0,.42,mid],[2,area.skill==='base'?.42:.46,mid],[4,.52,mid],[6,.65,mid],[8,.78,mid]]);
          route=[[0,u+.025,mid-dy],[2,.425,mid-dy],[4,.6,mid+dy],[6,.825,mid+dy],[8,.99,mid+dy]];
          arrow('pass',[[.4,mid-dy],[.58,mid+dy]]);arrow('dribble',[[u,mid-dy],[.4,mid-dy]]);arrow('dribble',[[.58,mid+dy],[.99,mid+dy]]);
        }else if(kind==='duel'){
          track('p'+idx,[[0,u,mid-dy],[2,.4,mid-dy],[3,.42,mid+dy],[4,.62,mid+dy],[6,.78,mid+dy],[6.4,.8,mid+dy],[8,.84,mid+dy]]);
          const defenderStart=p(.5,mid);Object.assign(s.nodes.find(v=>v.id==='p'+defender),defenderStart);
          track('p'+defender,[[0,.5,mid],[2,area.skill==='base'?.5:.47,area.skill==='base'?mid:mid-dy*.4],[3,.53,mid-dy*.5],[4,.57,mid-dy*.5],[6,.65,mid],[8,.7,mid]]);
          route=[[0,u+.025,mid-dy+.02],[2,.425,mid-dy+.02],[3,.445,mid+dy+.02],[4,.645,mid+dy+.02],[6,.805,mid+dy+.02],[6.4,.825,mid+dy+.02],[7.2,1,mid],[8,1,mid]];
          arrow('dribble',[[u,mid-dy],[.4,mid-dy],[.42,mid+dy],[.62,mid+dy],[.8,mid+dy]]);arrow('shot',[[.825,mid+dy+.02],[1,mid]]);
          const goalWidth=lanes===2?1:2,gate=goalWidth/area.width/2,label=`Kužeľ bránky širokej ${goalWidth} m`;cone(1,mid-gate,'gate',label);cone(1,mid+gate,'gate',label);
        }else arrow('dribble',[[u,mid-dy],[.4,mid-dy],[.6,mid+dy],[.98,mid+dy]]);
        node('ball'+lane,u+.025,mid-dy,'A','ball');track('ball'+lane,route);
        if(kind==='two-one'){const gate=(lanes===2?1:2)/area.width/2;for(const center of[mid-dy,mid+dy]){cone(1,center-gate,'gate');cone(1,center+gate,'gate');}}
      }
      for(let i=lanes*active;i<n;i++){const v=(i-lanes*active+1)/(n-lanes*active+1);node('p'+i,service/2,v,'N','player',String(i+1)+'R');track('p'+i,[[0,service/2,v],[8,service/2,v]]);}
    }
    if(['duel','two-one'].includes(kind))s.nodes.sort((a,b)=>a.kind===b.kind&&a.kind==='player'?Number(a.id.slice(1))-Number(b.id.slice(1)):a.kind==='player'?-1:b.kind==='player'?1:0);
    s.steps=[{time:0,text:kind==='duel'?'Útok do 10 s: prekonaj obrancu a zakonči prízemnou strelou.':kind==='two-one'?'Voľná cesta alebo prihrávka: vyber riešenie a dokonči cez bránku.':kind==='pairs'?'Prijmi a prihraj po zemi.':'Prihraj voľnému spoluhráčovi a ukáž sa.'}];
    return s;
  },
  plan(t,b,index,base,api){
    if(typeof TrainingLoad!=='undefined'&&TrainingLoad.kinds.includes(b.programKind))return TrainingLoad.plan(t,b,index,base,api);
    const kind=b.programKind,n=base.localCount,{action,hold,orderFor,gameOrder,gameScene}=api;
    if(['warm','finish'].includes(kind))return false;
    const variant=this.variant(t,b,index);
    hold('Ukážka a rozdelenie',t.loadRevision&&['pairs','two-one'].includes(kind)?30:60,'setup',variant.skillTask);
    if(kind==='pairs'){for(let r=0;r<3;r++){action(`Séria ${r+1}/3`,t.loadRevision?150:180);if(r<2)hold('Oddych a výmena partnerov',30);}hold('Voda a príprava ďalšej úlohy',60,'water');}
    if(kind==='rondo'){
      const play=t.loadRevision?TrainingLoad.rondo(n).playSeconds:Math.min(45,Math.floor(300/n)-15),buffer=t.loadRevision?TrainingLoad.rondo(n).bufferSeconds:300-n*(play+15);
      for(let r=0;r<2;r++){
        for(let k=0;k<n;k++){action(`Séria ${r+1}/2 · kolo ${k+1}/${n}`,play,base,{order:orderFor(n===2?[]:[k]),cue:n===2?'Dvojica bez obrancu.':`Obranca ${k+1}; ostatní sa ponúkajú.`});hold('Oddych a výmena obrancu',t.loadRevision?12:15);}
        hold('Oddych po celom poradí',buffer);if(r===0)hold('Voda medzi sériami',60,'water');
      }hold('Voda a príprava zón',t.loadRevision?60:120,'water');
    }
    if(['duel','two-one'].includes(kind)){
      const d=this.duelDose(n,b.duelBudget),ids=Array.from({length:n},(_,i)=>'child'+i),roles=this.roles(kind,n);
      for(let r=0;r<d.cycles;r++){
        for(let k=0;k<n;k++){
          const order=ids.map((_,i)=>ids[(i+k)%n]);
          action(`Séria ${r+1}/${d.cycles} · kolo ${k+1}/${n}`,10,base,{order,seconds:8,cue:order.map((id,i)=>`${Number(id.slice(5))+1}: ${roles[i]==='R'?'oddych':roles[i]==='D'?'obrana':'útok'}`).join(' · ')});
          hold('Návrat, výmena a oddych',d.reset);
        }
        if(kind==='two-one'&&r<d.cycles-1)hold('Oddych medzi sériami',t.loadRevision?TrainingLoad.between(d.cycles,r):d.between,'water');
      }
      hold('Oddych a krátka oprava',d.buffer);hold('Voda a prestavba',kind==='duel'?60:t.loadRevision?90:120,'water');
    }
    if(['zones','game'].includes(kind)){
      const count=kind==='zones'?2:t.programId===this.ids[2]?4:3,f=TrainingPlanner.form(n),period=t.programId===this.ids[2]&&kind==='game'?240:t.loadRevision&&kind==='zones'&&t.programId===this.ids[1]?240:300,parts=n<=3?6:n,slot=n<=3?period/10:Math.floor(period/n);
      for(let r=0;r<count;r++){
        for(let k=0;k<parts;k++){
          const neutrals=Array.from({length:f.neutral},(_,j)=>(k+j)%n),source=gameScene(r%2===1);
          action(`Úsek ${r+1}/${count} · časť ${k+1}/${parts}`,slot,source,{order:gameOrder(source,neutrals),mirror:r%2===1,cue:variant.skillTask+(neutrals.length?' N: '+neutrals.map(i=>i+1).join(', '):'')});
          if(n<=3)hold('Oddych celej skupiny',period/15);
        }
        if(n>3)hold('Výmena a vydýchanie po poradí',period-parts*slot);
        if(r<count-1)hold('Oddych medzi úsekmi',60,'water');
      }
      if(kind==='zones'){hold('Voda a spätná väzba',120,'water');if(!t.loadRevision)hold('Príprava minibránok',120,'setup');}
      else if([this.ids[0],this.ids[2]].includes(t.programId))hold('Voda a spätná väzba',120,'water');
    }
    return true;
  },
  brief(t,b,index,legacy){
    if(typeof TrainingLoad!=='undefined'&&TrainingLoad.kinds.includes(b.programKind))return TrainingLoad.brief(t,b,index);
    const kind=b.programKind;if(['warm','finish'].includes(kind))return legacy;
    const v=this.variant(t,b,index),area=t.quarterPitch.stages[b.diagram].areas[index],n=area.count,d=this.duelDose(n,b.duelBudget),duel=['duel','two-one'].includes(kind);
    const s=FootballScenes.build(b.diagram,{size:n,total:t.planConfig.players,pitchIndex:index,area});
    const conesLocal=s.cones.length,conesTotal=this.cones(t,b).length,ballsLocal=kind==='pairs'?this.pods(n).length:duel?this.lanes(kind,n):1;
    const ballsTotal=t.planConfig.groupSizes.reduce((sum,size)=>sum+(kind==='pairs'?this.pods(size).length:duel?this.lanes(kind,size):1),0);
    const period=t.programId===this.ids[2]&&kind==='game'?240:t.loadRevision&&kind==='zones'&&t.programId===this.ids[1]?240:300;
    const work=duel?'Do skončenia útoku':kind==='pairs'?(t.loadRevision?'150 s':'3 min'):kind==='rondo'?`${b.rotation.find(r=>r.size===n).playSeconds} s`:n<=3?`${period/10} s`:`${period/60} min`;
    const rest=duel?`aspoň ${d.reset} s`:kind==='pairs'?'30 s':kind==='rondo'?(t.loadRevision?'12 s':'15 s'):n<=3?`${period/15} s`:'1 min';
    const repetitions=duel?{value:`${n} kôl`,hint:'potom poradie znova podľa pripravenosti'}:kind==='rondo'?{value:`2 × ${n}`,hint:'série × kolá'}:{value:kind==='zones'?'2':t.programId===this.ids[2]&&kind==='game'?'4':'3',hint:'úseky'};
    const gatesLocal=kind==='duel'?this.lanes(kind,n):0,gatesTotal=kind==='duel'?t.planConfig.groupSizes.reduce((sum,size)=>sum+this.lanes(kind,size),0):0;
    const kit=[`Lopty: ${ballsLocal} tu, ${ballsTotal} spolu + 4 rezervné.`,`Méty: ${conesLocal} tu, ${conesTotal} spolu.`,...(gatesLocal?[`Bránky z kužeľov: ${gatesLocal} tu, ${gatesTotal} spolu. Ich méty sú už započítané.`]:[]),this.placement(kind,t,index),'Rozlišovačky, signál a vlastná voda pre každé dieťa.'];
    return {...legacy,shortInstruction:duel?(kind==='duel'||n===2?'Prekonaj obrancu a zakonči po zemi.':'Dva útočníci na jedného obrancu: vyber prihrávku alebo vedenie do voľna a zakonči.'):b.summary,description:v.skillTask,steps:v.steps,space:`${area.length} × ${area.width} m pre túto skupinu; celkom ${t.planConfig.width} × ${t.planConfig.height} m.`,grouping:`${area.label}: ${n} detí · ${v.skillLabel}`,work,rest,rotation:v.rotationText,notes:b.adjustments,
      glance:{work,rest,workHint:duel?'jeden útok':'v úseku',restHint:duel?'návrat/výmena/oddych':'plus voda podľa rozpisu'},
      timing:{...legacy.timing,work,rest,repetitions,schedule:v.dose,note:v.rotationText,workHint:duel?'jeden útok':'v úseku',restHint:duel?'návrat a výmena':'medzi úsekmi'},
      kit,conePlacement:this.placement(kind,t,index),ballsLocal,ballsTotal,conesLocal,conesTotal,slogan:b.cues[0],
      visualKit:[{kind:'ball',title:'Lopty',value:`${ballsTotal} + 4 rezervné`,detail:`${ballsLocal} v tejto skupine.`,local:ballsLocal,total:ballsTotal},{kind:'cone',title:'Méty a kužele',value:`${conesTotal} spolu`,detail:`${conesLocal} v tejto skupine.`,local:conesLocal,total:conesTotal},...(gatesLocal?[{kind:'gates',title:'Kužeľové bránky',value:`${gatesTotal} spolu`,detail:`${gatesLocal} tu; 2 méty na bránku už v počte mét.`,local:gatesLocal,total:gatesTotal}]:[]),{kind:'bibs',title:'Rozlišovačky',value:`${t.planConfig.players} spolu`,detail:`${n} v tejto skupine; odlíš spoluhráčov, obranu a prípadných N. Oddychujúci R sú v servisnom páse.`,local:n,total:t.planConfig.players},...legacy.visualKit.filter(v=>!['ball','cone','gates','bibs'].includes(v.kind))]};
  },
  preparation(t){
    let previous=[];const all=t.blocks.map(b=>this.cones(t,b)),capacity=Math.max(...all.map(v=>v.length));
    const steps=t.blocks.map((b,i)=>{
      const cones=b.programKind==='finish'?previous:all[i],areas=t.quarterPitch.stages[b.diagram]?.areas||t.quarterPitch.stages['football-large-game']?.areas||t.quarterPitch.stages['football-mini-games'].areas;
      const remaining=[...cones],kept=[],moves=[],removed=[];
      for(const p of previous){const j=remaining.findIndex(q=>Math.hypot(q.x-p.x,q.y-p.y)<1e-7);if(j>=0)kept.push(remaining.splice(j,1)[0]);else removed.push(p);}
      for(const p of [...removed]){const candidates=remaining.map((q,j)=>({q,j})).filter(({q})=>q.area===p.area||q.area.startsWith(p.area)||p.area.startsWith(q.area)).sort((a,b)=>Math.hypot(a.q.x-p.x,a.q.y-p.y)-Math.hypot(b.q.x-p.x,b.q.y-p.y)),j=candidates[0]?.j??-1;if(j>=0){moves.push({from:p,to:remaining.splice(j,1)[0]});removed.splice(removed.indexOf(p),1);}}
      const start=t.startTime?t.startTime.split(':').map(Number):null,clock=m=>{const total=start[0]*60+start[1]+m;return`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;};
      const action=b.programKind==='finish'?'Zastav všetky hry. Pokojný záver pri trénerovi; potom spoločné upratanie.':this.placement(b.programKind,t,0)+` Teraz ${cones.length} mét spolu.${removed.length?` ${removed.length} nepotrebných mét odlož mimo plochy.`:''}`;
      const lines=areas.flatMap((area,j)=>{const scene=FootballScenes.build(b.diagram,{area,size:area.count,total:t.planConfig.players,pitchIndex:j});return(scene.lines||[]).map(line=>({from:FootballScenes.mapPoint(area,scene.pitch,line.from),to:FootballScenes.mapPoint(area,scene.pitch,line.to)}));});
      const shortAction=i===0?`Vyznač ${areas.length} zóny ${areas[0].length} × ${areas[0].width} m; ${cones.length} rohových mét.`:b.programKind==='finish'?'Zastav hry, zíďte sa pri trénerovi. Potom upracte pomôcky.':`Uprav rozloženie podľa nákresu. ${cones.length} mét: ${moves.length} presuň, ${remaining.length} pridaj${removed.length?`, ${removed.length} odlož`:''}.`;
      const step={title:b.title,name:b.title,blockId:b.id,when:start?`${clock(b.start)}–${clock(b.end)}`:`${b.start} min–${b.end} min`,shortAction,action,extra:'Podrobnosti platia pre zvolený počet a plochu. Lopty a oddychujúci nesmú byť v 3 m priechodoch.',coach:t.organizationNotes.filter(v=>v.startsWith('Tréner')).join(' '),kept,moves,added:remaining,total:cones.length,stored:capacity-cones.length,map:{key:b.diagram,areas,cones,lines}};
      previous=cones;return step;
    });return{layout:t.quarterPitch,steps};
  }
};
