'use strict';

// Approved sessions are isolated from the archived October template and later drafts.
const SessionPrograms = {
  ids:['u11-touch-2026-11-02','u11-decisions-2026-11-03','u11-support-2026-11-05','u11-receive-2026-11-09','u11-duel-rondo-2026-11-10'],
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
    if(source.programId==='u11-duel-rondo-2026-11-10')return November10Program.adapt(source,input);
    if(source.programId==='u11-receive-2026-11-09')return November9Program.adapt(source,input);
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
    if(t.programId==='u11-duel-rondo-2026-11-10')return November10Program.variant(t,b,index);
    if(t.programId==='u11-receive-2026-11-09')return November9Program.variant(t,b,index);
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
    if(t.programId==='u11-duel-rondo-2026-11-10')return November10Program.placement(t,t.blocks.find(b=>b.programKind===kind),index);
    if(t.programId==='u11-receive-2026-11-09')return November9Program.placement(t,t.blocks.find(b=>b.programKind===kind),index);
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
    if(opts.area?.november10)return November10Program.scene(key,opts);
    if(opts.area?.november9)return November9Program.scene(key,opts);
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
    if(t.programId==='u11-duel-rondo-2026-11-10')return November10Program.brief(t,b,index);
    if(t.programId==='u11-receive-2026-11-09')return November9Program.brief(t,b,index);
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

// Date-scoped session. Existing programs, archived doses and renderers keep their paths.
const November9Program = {
  id:'u11-receive-2026-11-09',
  keepers:['G1','G2','G3'],
  keeperOrder:[[1,2,3],[3,1,2],[2,3,1],[1,2,3],[3,1,2]],
  definitions:[
    ['1','warm','football-warmup',10,'Rozohriatie a úvodná hra','Pozri, kde je voľno.','1 min privítanie + 2 min rozhýbanie + 3 min vedenie + 3 min úvodná hra + 1 min voda = 10 min.'],
    ['8','speed','football-speed',8,'Štarty a zrýchlenie','Rýchle prvé kroky, potom plynulo spomaľ.','1 min ukážka + 4 okná po 100 s + 20 s voda = 8 min. Každý najviac 4 behy; prvý nácvik, potom 3 rýchle štarty.'],
    ['2','pairs','football-pass',12,'Príjem a prihrávka · brankári osobitne','Pozri — prijmi do voľna — prihraj.','1 min ukážka/presun + 3 × 3 min práca + 2 × 30 s oddych + 1 min voda/návrat = 12 min.'],
    ['3','duel','football-rondo',11,'Prvý dotyk a 1 na 1 so zakončením','Prvý dotyk na voľnú stranu.','11 min celá úloha: 1 min ukážka + 9 min okruhy, návraty a oddych + 1 min voda. Akcie končia prirodzene; žiadny odpočet každého útoku.'],
    ['4','zones','football-zones',13,'Hra do koncových zón','Prijmi tam, odkiaľ môžeš pokračovať.','1 min ukážka + 5 min hra + 1 min oddych + 5 min hra + 1 min voda/prestavba = 13 min.'],
    ['5','large-game','football-large-game',23,'Herný záver · rotácia troch brankárov','Prihraj, ponúkni sa; po strate sa vráť.','2 min príprava + 5 × 3 min hra + 4 × 1 min oddych + 2 min voda/spätná väzba = 23 min.'],
    ['6','finish','football-finish',3,'Pokojný záver','Kedy ti dnes prvý dotyk pomohol?','1 min chôdza + 1 min voda + 1 min otázka a konkrétna pochvala = 3 min.']
  ],
  split(n,count){return Array.from({length:count},(_,i)=>Math.floor(n/count)+(i<n%count?1:0));},
  pairPods(n,round=0){
    if(n===6)return [[[0,1],[2,3],[4,5]],[[0,2],[1,4],[3,5]],[[0,3],[1,5],[2,4]]][round%3];
    if(n===5)return [[[0,1,2],[3,4]],[[0,3,4],[1,2]],[[1,3,4],[0,2]]][round%3];
    let k=0;return SessionPrograms.pods(n).map(size=>Array.from({length:size},()=>k++));
  },
  grid(config,specs,kind){
    const cols=specs.length===1?1:specs.length>4?3:2,rows=Math.ceil(specs.length/cols);
    const l=Math.min(18,(config.width-4-3*(cols-1))/cols),w=Math.min(12,(config.height-4-3*(rows-1))/rows);
    return specs.map((spec,i)=>({...spec,label:spec.label||String.fromCharCode(65+i),index:i,count:spec.labels.length,playerLabels:spec.labels,skill:spec.skill||config.levels[Math.min(i,config.levels.length-1)]||'standard',x:2+(i%cols)*(l+3),y:2+Math.floor(i/cols)*(w+3),w:l,h:w,length:l,width:w,november9:true,programKind:'nov9-'+kind,phaseKind:kind}));
  },
  adapt(source,input={}){
    const c=TrainingPlanner.normalize({...source.defaultConfig,...input}),template=JSON.parse(JSON.stringify(source.nov9Template||source));
    delete template.programId;delete template.nov9Template;
    const t=TrainingPlanner.adapt(template,c);t.nov9Template=template;t.programId=this.id;t.duration=80;
    t.planConfig=c;t.defaultConfig={players:20,coaches:3,pitch:'half',width:50,height:35,groupMode:'auto',groupSizes:[5,5,5,5],levels:['base','base','standard','standard']};
    const fields=Array.from({length:c.players-3},(_,i)=>'P'+(i+1));let p=0;
    const baseSpecs=c.groupSizes.map((n,i)=>{const g=this.keepers.filter((_,j)=>j%c.groupSizes.length===i);return{labels:[...fields.slice(p,p+=n-g.length),...g]};});
    const bases=this.grid(c,baseSpecs,'warm');
    const techCount=Math.min(4,Math.ceil(fields.length/6)),techSizes=this.split(fields.length,techCount);p=0;
    const tech=this.grid(c,[...techSizes.map(n=>({labels:fields.slice(p,p+=n)})),{labels:[...this.keepers],keeperPractice:true,label:'Brankári',skill:'standard'}],'pairs');
    const gameCount=c.players>=25?3:2,counts=this.split(c.players,gameCount),gap=gameCount===2?4:3;
    const gw=Math.min(20,(c.width-4-gap*(gameCount-1))/gameCount),gl=Math.min(26,c.height-8);p=0;
    const games=counts.map((n,i)=>{const g=i===0?['G1','G2']:i===1?['G3']:[],labels=[...fields.slice(p,p+=n-g.length),...g];return{label:'Ihrisko '+(i+1),index:i,count:n,playerLabels:labels,skill:c.levels[Math.min(i*2,c.levels.length-1)]||'standard',x:2+i*(gw+gap),y:4,w:gw,h:gl,length:gl,width:gw,goalkeepers:i===0,november9:true,programKind:'nov9-large-game',phaseKind:'large-game'};});
    const stages={};let start=0;
    t.blocks=this.definitions.map(([id,kind,diagram,minutes,title,cue,dose])=>{
      const areas=kind==='pairs'?tech:kind==='large-game'?games:kind==='finish'?this.grid(c,[{labels:[...fields,...this.keepers],label:'Mužstvo'}],kind):bases.map(a=>({...a,phaseKind:kind,programKind:'nov9-'+kind}));
      stages[diagram]={areas,instructions:areas.map(a=>a.label+': '+a.playerLabels.join(', ')).join(' · ')};
      const b={id,title,programKind:kind,diagram,start,end:start+minutes,summary:cue,dose,cues:[cue],space:stages[diagram].instructions,stepTitles:['Úloha','Dávka','Striedanie'],steps:[cue,dose,stages[diagram].instructions],tables:[],adjustments:['Pri únave alebo zhoršení pohybu uber dávku a zachovaj oddych. Pri bolesti ukonči záťaž.','Ľahšie: pokojnejší príjem a menší tlak. Náročnejšie: aktívnejší primeraný odpor a meniaci sa uhol, bez automatického pridávania behov.'],topics:[kind==='speed'?'coordination':kind==='duel'?'duels':'passing']};
      start=b.end;return b;
    });
    stages['football-mini-games']=stages['football-large-game'];
    t.quarterPitch={...t.quarterPitch,width:c.width,height:c.height,corridor:{x:c.width/2-1.5,width:3},dynamic:true,stages};
    t.players=`${c.players} detí spolu · ${c.players-3} do poľa + 3 brankári`;t.coaches=`${c.coaches} tréneri`;t.keepers=3;
    t.attendanceCases=t.attendanceCases.map(item=>({...item,keepers:3,outfield:item.total-3}));
    if(t.planning)t.planning={...t.planning,assumptions:'Dnešný variant: 20 detí spolu vrátane 3 brankárov, 3 tréneri, polovica ihriska; pracovný rozmer 50 × 35 m over pred začiatkom. Pri zmene počtu uprav organizáciu.'};
    t.organizationNotes=['Tréner 1: A/B, v závere ihrisko 1.','Tréner 2: C/D, v technike posledná poľová skupina; v závere ihrisko 2.','Tréner 3: brankári v technickom bloku, inak štarty/striedanie; v závere brankári a ich presuny.',`Základné skupiny: ${bases.map(a=>a.label+' = '+a.playerLabels.join(', ')).join(' · ')}. Čísla v každej skupine sú miestne.`,`Technika: ${tech.map(a=>a.label+' = '+a.playerLabels.join(', ')).join(' · ')}; potom návrat do základných skupín.`];
    if(c.coaches<3)t.organizationNotes.unshift('Pozor: tento blok brankárov a súbežné plochy sú pripravené pre troch trénerov. Pri menšom dohľade zjednoť činnosť a organizáciu pred začatím.');
    t.notes=t.notes.filter(n=>!['Zameranie tohto dňa','Organizácia podľa aktuálnych podmienok','Riadená záťaž','Odvaha v 1 na 1'].includes(n.title));
    t.notes.unshift({title:'Dnešné podmienky',text:t.players+'; 3 brankári sú zahrnutí v celkovom počte. Polovica ihriska, pracovný rozmer 50 × 35 m treba zmerať. Dve ukotvené brány; bez nich použite kužeľové a brankári hrajú nohami.'},{title:'Riadená záťaž',text:'80 min. Štarty 4 × 10 m pri ploche 18 × 12 m, približne 90 s zotavenia. Najviac tri okruhy 1 na 1; záver 5 × 3 min. Zajtra zápas 2 × 30 min; pri poklese kvality posledný okruh/úsek vynechaj.'},{title:'Organizácia podľa aktuálnych podmienok',text:t.organizationNotes.join(' ')});
    const maxima=t.blocks.map(b=>{const a=stages[b.diagram].areas;const counts=a.map(area=>this.scene(b.diagram,{area}).cones.length);b.coneSetup={counts,areas:a.length,perArea:counts[0],total:counts.reduce((x,y)=>x+y,0),placement:this.placement(t,b,0),extra:'Počet a rozloženie sú zo zobrazených scén; pri presune najprv zastav činnosť.'};return b.coneSetup.total;});
    const maximum=Math.max(...maxima);
    t.equipment=[{name:'Lopty',quantity:`${c.players} + 4 rezervné = ${c.players+4} lôpt`,detail:'Vedenie každý s loptou, potom samostatné lopty v dvojiciach/trojici a pre brankárov.'},{name:'Méty a kužele',quantity:`${maximum} pracovných + 8 rezervných = ${maximum+8} mét`,detail:'Maximum súčasne rozložených mét; bránkové sú započítané.'},{name:'Brány',quantity:'2 ukotvené + 4 kužeľové bránky',detail:'Bez ukotvených brán oba zápasy na kužeľové a všetci brankári nohami.'},{name:'Rozlišovačky',quantity:`${Math.ceil(c.players/2)} svetlých + ${Math.ceil(c.players/2)} tmavých + 4 neutrálne`,detail:'Brankári odlíšení; rolu neutrálneho striedajte podľa čísel.'},{name:'Organizácia',quantity:'Stopky, signál, voda, lekárnička; rukavice pre 3 brankárov',detail:'Počas návratu oddych, ďalšiu sériu spúšťa tréner.'}];
    return t;
  },
  areas(t,b){return t.quarterPitch.stages[b.diagram].areas;},
  duelPairs(n){const cycles=Math.max(1,Math.min(3,Math.floor(480/(n*30))));return Array.from({length:cycles},(_,r)=>Array.from({length:n},(_,i)=>[i,(i+1+r%(n-1))%n])).flat();},
  roster(area,round=0){
    if(area.phaseKind!=='large-game'||area.index>1)return [...area.playerLabels];
    const order=this.keeperOrder[round%5],fields=area.playerLabels.filter(s=>!s.startsWith('G'));
    if(area.index===1){const at=Math.max(0,Math.floor((fields.length+1)/2)-1);return[...fields.slice(0,at),'G'+order[2],...fields.slice(at)];}
    return [...fields,'G'+order[0],'G'+order[1]];
  },
  rotation(t,b,index=0){
    const a=this.areas(t,b)[index],n=a.count,kind=b.programKind;
    if(kind==='duel')return this.duelPairs(n).map(([x,y],i)=>`Okruh ${Math.floor(i/n)+1}, akcia ${i%n+1}: útok ${x+1}, obrana ${y+1}; ostatní oddych. Po akcii aspoň 20 s, medzi okruhmi navyše 30 s.`).join('\n');
    if(kind==='speed')return `Poradie 1–${n}, jeden hráč v dráhe. Každý raz v 100 s okne, 4 okná. Odstup približne 8 s a vždy voľná dráha; návrat vedľa. ${a.playerLabels.map((s,i)=>(i+1)+'='+s).join(', ')}.`;
    if(kind==='pairs'&&a.keeperPractice)return 'V každej 3 min sérii: 1. min prijíma G1/podáva G2/cieľ G3; 2. min G2/G3/G1; 3. min G3/G1/G2. Séria 1 ruky, 2 lopta po zemi, 3 práca nohami. Posledná minúta návrat do pôvodných päťiek.';
    if(kind==='pairs'&&n===6)return 'Miestne čísla: séria 1 dvojice 1/2, 3/4, 5/6; séria 2: 1/3, 2/5, 4/6; séria 3: 1/4, 2/6, 3/5. Výmena v 30 s prestávke. Posledná minúta návrat do pôvodných päťiek.';
    if(kind==='pairs'&&n===5)return 'Séria 1 trojica 1/2/3 + dvojica 4/5; séria 2 trojica 1/4/5 + dvojica 2/3; séria 3 trojica 2/4/5 + dvojica 1/3. V trojici postupne všetci, bez čakania.';
    if(kind==='pairs')return 'Dvojice a pri nepárnom počte jedna trojica; všetci aktívni. Partnerov vymeň počas 30 s prestávky.';
    if(kind==='large-game')return this.keeperOrder.map((g,i)=>`Úsek ${i+1}: ľavá brána G${g[0]}, pravá G${g[1]}, na druhom ihrisku nohami G${g[2]}.`).join(' ')+' Brankári sa presúvajú počas 1 min oddychu; poľové tímy zostávajú. Bez ukotvených brán všetci nohami na kužeľové.';
    if(kind==='warm')return 'Úvodná hra trvá 3 min. Neutrálny pomáha držiteľom lopty; po každej minúte preberie rolu ďalšie číslo. Všetci zostávajú aktívni.';
    if(kind==='zones')return `Neutrálny pomáha držiteľom lopty. Roly posúvaj podľa čísel; v 5 min úseku každý z piatich raz N. Pri inom počte rozdeľ celý úsek na ${n} rovnakých častí a posuň neutrálne roly.`;
    return 'Spoločný pokojný záver; bez ďalšej záťaže.';
  },
  variant(t,b,index=0){const a=this.areas(t,b)[index]||this.areas(t,b)[0];return{...b,tables:this.tables(t,b,a),skillLabel:a.keeperPractice?'Brankári':TrainingPlanner.levels[a.skill],skillTask:this.task(t,b,a),rotationText:this.rotation(t,b,a.index),steps:[this.task(t,b,a),b.dose,this.rotation(t,b,a.index)]};},
  tables(t,b,a){
    const n=a.count,labels=a.playerLabels,table=(headers,rows,caption)=>[{groupSize:n,headers,rows,caption}];
    if(b.programKind==='duel')return table(['Okruh','Útok','Obrana','Oddych','Výmena'],this.duelPairs(n).map(([x,y],i)=>[String(Math.floor(i/n)+1),`${x+1} (${labels[x]})`,`${y+1} (${labels[y]})`,labels.filter((_,j)=>j!==x&&j!==y).join(', '),'Po akcii; aspoň 20 s návrat/oddych']),'Každý raz útok aj obrana v celom okruhu; medzi okruhmi 30 s navyše. Akcia bez pevného odpočtu.');
    if(b.programKind==='speed')return table(['Okno','Poradie','Beh','Zotavenie'],[1,2,3,4].map(r=>[String(r),labels.join(' → '),`Každý raz, ${Math.min(10,Math.max(3,Math.floor(a.length-8)))} m`,'Približne 90 s; voľnú dráhu potvrdí tréner']),'Jedna dráha, 100 s okná, nie dvojice bežiace naraz.');
    if(b.programKind==='pairs'&&a.keeperPractice)return table(['Séria','Minúta','Prijíma','Podáva','Cieľ'],[0,1,2].flatMap(r=>[0,1,2].map(j=>[String(r+1),String(j+1),labels[j],labels[(j+1)%3],labels[(j+2)%3]])),'Séria 1 ruky, séria 2 pomalá lopta po zemi, séria 3 práca nohami.');
    if(b.programKind==='pairs'){const plans=[0,1,2].map(r=>this.pairPods(n,r));return table(['Séria','Dvojice / trojica'],plans.map((pods,i)=>[String(i+1),pods.map(p=>p.map(j=>labels[j]).join('/')).join(' · ')]),'Každá podskupina má vlastnú loptu. Výmena počas 30 s oddychu.');}
    if(b.programKind==='large-game')return table(['Úsek','Ľavá brána I','Pravá brána I','Nohami na II'],this.keeperOrder.map((g,i)=>[String(i+1),'G'+g[0],'G'+g[1],'G'+g[2]]),'Presuny brankárov len počas 1 min oddychu; bez ukotvených brán všetci nohami.');
    if(b.programKind==='zones')return table(['Úsek','Poradie N','Práca / oddych'],[1,2].map(r=>[String(r),n%2?labels.join(' → '):'Bez neutrálneho','5 min hra; medzi úsekmi 1 min oddych']),'Neutrál je aktívna práca; odchádzajúci preberie miesto prichádzajúceho.');
    return table(['Skupina','Deti'],[[a.label,labels.join(', ')]],'Všetci sa zapájajú podľa rozpisu.');
  },
  task(t,b,a){
    const n=a.count;
    if(b.programKind==='warm')return 'Privítanie, rozhýbanie, vedenie lopty; potom úvodná hra 2 na 2 + N pri piatich. Bod za kontrolované prevedenie cez koncovú čiaru. Tempo rastie postupne.';
    if(b.programKind==='speed')return `Jedna priama dráha: štart ${Math.min(10,Math.max(3,Math.floor(a.length-8)))} m a najmenej 6 m na spomalenie. Najviac 4 behy, prvý kontrolovaný. Približne 100 s medzi vlastnými štartmi; oddych neskracuj.`;
    if(b.programKind==='pairs'&&a.keeperPractice)return 'S trénerom 3: pripravený postoj, pokojné podanie do rúk, zachytenie pomalej lopty po zemi a krátka rozohrávka. Potom príjem a prihrávka nohami. V prijímacej minúte najviac 4–6 podaní podľa kvality; bez série pádov a dorážok.';
    if(b.programKind==='pairs')return 'Oddelené dvojice/trojica, prihrávky 4–5 m (ľahšie 3–4 m). Pred príjmom pohľad, natočiť telo, prvý dotyk vedľa méty a presná prihrávka. Po odovzdaní nový uhol.';
    if(b.programKind==='duel')return 'Jeden súboj naraz. Obranca prihrá útočníkovi, ten si prvým dotykom otvorí cestu a zakončí po zemi na kužeľovú bránku. Koniec strelou, stratou alebo autom; obranca neútočí naspäť. Ostatní oddychujú zboku.';
    if(b.programKind==='zones')return `${Math.floor(n/2)} na ${Math.floor(n/2)}${n%2?' + N':''}. Bod za kontrolované vedenie do 2 m koncovej zóny alebo prihrávku nabiehajúcemu, ktorý loptu ovládne. V zóne nečakať; bez povinných prihrávok.`;
    if(b.programKind==='large-game')return a.goalkeepers?'4 na 4 + dvaja brankári pri 20 deťoch. Zapoj krátku rozohrávku a ponuku po prihrávke. Brankári podľa päťúsekovej rotácie. Použi iba riadne ukotvené brány; bez nich všetci nohami.':`Pri 20 deťoch 5 na 5, tretí brankár hrá nohami ako piaty hráč štvorice. Štyri kužeľové bránky, prízemné zakončenie. Pri inom počte ${Math.floor(n/2)} na ${Math.floor(n/2)}${n%2?' + N':''}.`;
    return 'Pokojná chôdza, voda a jedna otázka: kedy ti prvý dotyk pomohol?';
  },
  placement(t,b,index=0){const a=this.areas(t,b)[index]||this.areas(t,b)[0];return `${a.label}: ${a.length} × ${a.width} m; ${a.playerLabels.join(', ')}. ${b.programKind==='speed'?'Štart 1 m od okraja, cieľ po behu, potom najmenej 6 m spomalenia; návrat vedľa.':b.programKind==='duel'?'Bránka 3 m pred koncom, čakajúci zboku; lopty zbierať pri zastavenej hre.':b.programKind==='large-game'?'Priechod a voľné pásy zachovať, započítať hĺbku brán/sietí. Presun a kotvenie iba dospelí.':'Rohy a vnútorné méty podľa nákresu; lopty a čakajúci mimo priechodov.'}`;},
  scene(key,{area:a,round=0,mode='',receiver=0}={}){
    const labels=this.roster(a,round),n=labels.length,kind=a.phaseKind,pitch={x:40,y:42,w:280,h:280*a.width/a.length,length:a.length,width:a.width};
    const s={key,pitch,total:n,size:n,localCount:n,pitchIndex:a.index,nodes:[],tracks:{},arrows:[],steps:[],cones:[],lines:[],annotations:[],duration:8,loopMode:'cut',caption:'Vzorová akcia; reálne dávky a striedanie určuje samostatný časovač a tréner.'};
    const p=(u,v)=>({x:pitch.x+u*pitch.w,y:pitch.y+v*pitch.h});
    const node=(i,u,v,team='A',extra={})=>{const id='child'+i;s.nodes.push({id,...p(u,v),kind:'player',label:labels[i],team,...extra});s.tracks[id]=[[0,...Object.values(p(u,v))],[8,...Object.values(p(u,v))]];return id;};
    const track=(id,frames)=>s.tracks[id]=frames.map(([time,u,v])=>[time,...Object.values(p(u,v))]);
    const ball=(id,u,v,frames)=>{s.nodes.push({id,kind:'ball',team:'A',label:'',...p(u,v)});track(id,frames||[[0,u,v],[8,u,v]]);};
    const cone=(u,v,k='corner')=>s.cones.push({...p(u,v),kind:k});
    const line=(u,v,x,y)=>s.lines.push({from:p(u,v),to:p(x,y)});
    const arrow=(k,points)=>s.arrows.push({kind:k,number:s.arrows.length+1,label:false,points:points.map(([u,v])=>p(u,v)),start:1,end:7});
    [[0,0],[1,0],[0,1],[1,1]].forEach(q=>cone(...q));
    if(kind==='speed'){
      const start=1/a.length,finish=start+Math.min(10,Math.max(3,Math.floor(a.length-8)))/a.length,slow=finish+6/a.length;s.duration=n*4;
      [start,finish,slow].forEach(u=>[.3,.55].forEach(v=>cone(u,v,'lane')));line(finish,.2,finish,.65);
      for(let i=0;i<n;i++){node(i,.04,.68+i*.26/Math.max(1,n-1),'N');const q=i*4;track('child'+i,[[0,.04,.68+i*.26/Math.max(1,n-1)],[q+.2,start,.42],[q+1.2,finish,.42],[q+2.2,slow,.42],[q+2.8,slow,.85],[q+3.8,start,.85],[s.duration,.04,.68+i*.26/Math.max(1,n-1)]]);}
      arrow('run',[[start,.42],[finish,.42]]);s.annotations.push({...p(finish,.12),text:`${Math.round((finish-start)*a.length)} m + 6 m dobeh`});return s;
    }
    if(kind==='pairs'&&!a.keeperPractice){
      const pods=this.pairPods(n,round);
      pods.forEach((members,j)=>{const size=members.length,cy=(j+.5)/pods.length,dx=Math.min(.2,2/a.length),dy=Math.min(.12,.5/pods.length),positions=size===2?[[.5-dx,cy],[.5+dx,cy]]:[[.5-dx,cy-dy],[.5+dx,cy-dy],[.5,cy+dy]];positions.forEach(([u,v],k)=>{const member=members[k];node(member,u,v);cone(u,v,'station');track('child'+member,[[0,u,v],[3,u+.025,v],[6,u+.035,v+.025],[8,u+.035,v+.025]]);});const route=positions.map((q,k)=>[8*k/size,q[0]+.015,q[1]+.025]);route.push([8,positions[0][0]+.015,positions[0][1]+.025]);ball('ball'+j,route[0][1],route[0][2],route);positions.forEach((q,k)=>arrow('pass',[q,positions[(k+1)%size]]));});return s;
    }
    if(kind==='pairs'&&a.keeperPractice){
      const positions=[[.5,.5],[.2,.25],[.8,.75]];for(let i=0;i<n;i++){const role=(i-receiver+n)%n;node(i,...positions[role],role===0?'A':role===1?'B':'N');cone(...positions[role],'station');}const source=positions[1],target=positions[0],exit=positions[2];ball('ball0',...source,[[0,...source],[2,...target],[4,...target],[6,...exit],[8,...exit]]);arrow('pass',[source,target]);arrow('pass',[target,exit]);return s;
    }
    if(kind==='duel'){
      const goal=1-3/a.length;cone(goal,.5-1/a.width,'gate');cone(goal,.5+1/a.width,'gate');cone(.45,.28,'station');
      for(let i=0;i<n;i++)node(i,i===0?.48:i===1?.43:.08,i===0?.28:i===1?.63:.7+(i-2)*.24/Math.max(1,n-2),i===0?'A':i===1?'B':'N',i>=2?{label:labels[i]+'R'}:{});
      track('child0',[[0,.48,.28],[2,.5,.28],[4,.63,.2],[6,goal-.1,.4],[8,goal-.1,.4]]);track('child1',[[0,.43,.63],[2,.47,.58],[4,.6,.48],[6,goal-.14,.48],[8,goal-.14,.48]]);
      ball('ball0',.43,.63,[[0,.43,.63],[2,.5,.29],[4,.64,.21],[6,goal-.08,.41],[7,goal,.5],[8,goal,.5]]);arrow('pass',[[.43,.63],[.5,.29]]);arrow('dribble',[[.5,.29],[.64,.21],[goal-.08,.41]]);arrow('shot',[[goal-.08,.41],[goal,.5]]);return s;
    }
    if(kind==='warm'&&mode!=='game'||kind==='finish'){
      for(let i=0;i<n;i++){const u=.15+(i%Math.ceil(Math.sqrt(n)))*.7/Math.max(1,Math.ceil(Math.sqrt(n))-1),v=.15+Math.floor(i/Math.ceil(Math.sqrt(n)))*.7/Math.max(1,Math.ceil(n/Math.ceil(Math.sqrt(n)))-1);node(i,u,v);track('child'+i,[[0,u,v],[3,u+.035,v+.02],[6,u-.025,v+.04],[8,u-.025,v+.04]]);if(kind==='warm'&&mode!=='mobility')ball('ball'+i,u+.02,v+.025,[[0,u+.02,v+.025],[3,u+.055,v+.045],[6,u-.005,v+.065],[8,u-.005,v+.065]]);}return s;
    }
    const gk=a.goalkeepers?2:0,field=n-gk,team=Math.floor(field/2),neutral=field%2;
    const neutralIndex=round%n,order=Array.from({length:field},(_,i)=>i).filter(i=>!((kind==='zones'||kind==='warm')&&neutral&&i===neutralIndex));if((kind==='zones'||kind==='warm')&&neutral)order.push(neutralIndex);
    for(let i=0;i<n;i++){
      if(i>=field){node(i,i===field?.025:.975,.5,'N',{goalkeeper:true});continue;}
      const rank=(kind==='zones'||kind==='warm')?order.indexOf(i):i,side=rank<team?0:rank<team*2?1:2,k=side===0?rank:rank-team;const u=side===2?.5:side===0?.17+(k%2)*.15:.7+(k%2)*.13,v=.15+(k%Math.max(1,team))*.7/Math.max(1,team-1);node(i,u,v,side===2?'N':side===0?'A':'B');track('child'+i,[[0,u,v],[3,Math.min(.94,u+.05),v],[6,Math.min(.94,u+.1),Math.min(.94,v+.03)],[8,Math.min(.94,u+.1),Math.min(.94,v+.03)]]);
    }
    if(kind==='zones'){pitch.zones=true;[2/a.length,1-2/a.length].forEach(u=>[0,1].forEach(v=>cone(u,v,'zone')));}
    if(kind==='large-game'&&!a.goalkeepers)for(const u of[0,1])for(const v of[.25,.75])for(const d of[-1,1])cone(u,v+d/a.width,'gate');
    if(kind==='large-game'&&a.goalkeepers){const d=2/a.length;for(const u of[0,1]){const back=u===0?-d:1+d;line(u,.4,back,.4);line(back,.4,back,.6);line(back,.6,u,.6);}s.annotations.push({...p(.5,.06),text:'4v4 + 2 GK · ukotvené brány'});}
    const initial=gk?[.025,.5]:[.2,.2],end=kind==='zones'?[.96,.35]:[.98,.5];ball('ball0',...initial,[[0,...initial],[2,.32,.2],[4,.48,.35],[6,.72,.3],[8,...end]]);arrow('pass',[initial,[.32,.2],[.48,.35]]);arrow(kind==='zones'?'dribble':'shot',[[.48,.35],end]);return s;
  },
  phases(t,b,index=0){
    const a=this.areas(t,b)[index],out=[],add=(name,seconds,kind='work',extra={})=>out.push({name,seconds,kind,...extra});
    if(b.programKind==='warm'){add('Privítanie a pripravenosť',60,'setup');add('Rozhýbanie',120,'work',{mode:'mobility'});add('Vedenie lopty',180);for(let j=0;j<3;j++)add(`Úvodná hra · minúta ${j+1}`,60,'work',{mode:'game',round:j});add('Voda a príprava',60,'water');}
    if(b.programKind==='speed'){add('Ukážka štartu a voľná dráha',60,'setup');for(let r=0;r<4;r++)add(`Séria ${r+1}/4 · jeden beh na dieťa`,100,'work',{gate:r>0,round:r});add('Voda a presun',20,'water');}
    if(b.programKind==='pairs'){add('Rozdelenie a ukážka',60,'setup');for(let r=0;r<3;r++){if(a.keeperPractice)for(let j=0;j<3;j++)add(`Séria ${r+1}/3 · prijíma G${j+1}`,60,'work',{round:r,receiver:j,gate:r>0&&j===0});else add(`Séria ${r+1}/3 · príjem a prihrávka`,180,'work',{round:r,gate:r>0});if(r<2)add('Oddych a výmena partnerov',30,'rest');}add('Voda a návrat do pôvodných skupín',60,'water');}
    if(b.programKind==='duel'){add('Ukážka a páry',60,'setup');add('Celá úloha 1 na 1 · vzorový útok',540);add('Voda a prestavba',60,'water');}
    if(b.programKind==='zones'){const parts=a.count%2?a.count:1;add('Ukážka koncových zón',60,'setup');for(let r=0;r<2;r++){for(let j=0;j<parts;j++)add(`Úsek ${r+1}/2${parts>1?' · N '+(j+1):' · hra'}`,Math.floor(300/parts)+(j<300%parts?1:0),'work',{round:j,gate:r>0&&j===0});if(r===0)add('Oddych medzi hrami',60,'rest');}add('Voda a prestavba',60,'water');}
    if(b.programKind==='large-game'){add('Prestavba a bezpečné brány',120,'setup');for(let r=0;r<5;r++){add(`Úsek ${r+1}/5 · GK ${this.keeperOrder[r].join('/')}`,180,'work',{round:r,gate:r>0});if(r<4)add('Oddych a rotácia brankárov',60,'rest',{round:r+1});}add('Voda a spätná väzba',120,'water');}
    if(b.programKind==='finish'){add('Pokojná chôdza',60);add('Voda',60,'water');add('Otázka a pochvala',60,'setup');}
    return out;
  },
  sequence(t,b,index,base){
    const a=this.areas(t,b)[index],out={...base,nodes:base.nodes.map(n=>({...n})),tracks:{},arrows:[],steps:[],phases:[],duration:0};let lastRoles={};
    for(const part of this.phases(t,b,index)){
      const scene=this.scene(b.diagram,{area:a,...part}),work=part.kind==='work',seconds=work?Math.min(18,Math.max(6,scene.duration)):1.2,start=out.duration,end=start+seconds;
      const cue=(a.keeperPractice&&work?['Postoj, pokojné podanie do rúk a vyrolovanie.','Pomalá lopta po zemi, krok za líniu a rozohrávka.','Prvý dotyk a presná prihrávka nohami.'][part.round||0]+' Prijíma G'+((part.receiver||0)+1)+'. ':b.programKind==='large-game'?this.rotation(t,b,index).split(' Brankári')[0]+' ':b.programKind==='speed'?this.task(t,b,a)+' ':this.task(t,b,a)+' ')+part.name;
      const roles={};for(const node of out.nodes){const current=scene.nodes.find(x=>x.id===node.id),frames=out.tracks[node.id]||(out.tracks[node.id]=[]);roles[node.id]=current?{label:current.label,team:current.team,visible:node.kind!=='ball'||work,goalkeeper:!!current.goalkeeper}:{label:node.label,team:node.team,visible:node.kind!=='ball'};if(work&&current){for(const f of scene.tracks[node.id]||[[0,current.x,current.y],[scene.duration,current.x,current.y]])frames.push([start+seconds*f[0]/scene.duration,f[1],f[2],...(f[0]===0?['cut']:[])]);}else{const last=frames.at(-1)||[0,node.x,node.y];frames.push([start,last[1],last[2]],[end,last[1],last[2]]);}}
      if(work)for(const arrow of scene.arrows||[])out.arrows.push({...arrow,start:start+(arrow.start||0)*seconds/scene.duration,end:Math.min(end,start+(arrow.end||scene.duration)*seconds/scene.duration)});
      out.phases.push({name:part.name,actualSeconds:part.seconds,start,ready:start,end,kind:part.kind,cue,roles,requiresStart:part.gate,november9:true});out.steps.push({time:start,text:cue});out.duration=end;lastRoles=roles;
    }
    const start=out.duration;for(const node of out.nodes){const frames=out.tracks[node.id],last=frames.at(-1);frames.push([start+1.2,last[1],last[2]]);}out.phases.push({name:'Cvičenie dokončené',actualSeconds:0,start,ready:start,end:start+1.2,kind:'end',cue:'Pokračuj na ďalšie cvičenie.',roles:lastRoles});out.duration+=1.2;return out;
  },
  intervals(t,b,index=0){
    const a=this.areas(t,b)[index],scope=`${a.label} · ${a.count} detí (${a.playerLabels.join(', ')})`;
    if(b.programKind==='duel')return{scope,participants:a.count,rotation:{protocol:'november9',count:a.count,labels:a.playerLabels,recovery:20,lanes:1,maxRounds:this.duelPairs(a.count).length,pairs:this.duelPairs(a.count)},parts:[{name:b.title,kind:'task',milliseconds:660000,cue:'Po dokončení akcie stlač Výmena; aspoň 20 s návrat a oddych. Medzi okruhmi 30 s navyše.'}]};
    const base=this.scene(b.diagram,{area:a}),sequence=this.sequence(t,b,index,base);
    return{scope,participants:a.count,speed:b.programKind==='speed',speedLanes:1,parts:sequence.phases.filter(p=>p.actualSeconds>0).map(p=>({name:p.name,kind:p.kind,milliseconds:Math.round(p.actualSeconds*1000),requiresStart:!!p.requiresStart,regroupBefore:!!p.requiresStart,cue:p.cue,roles:p.roles,november9:true}))};
  },
  rotationDescription(clock,snapshot){const r=clock.rotation,k=clock.rotationRound||0,pair=r.pairs[k],next=r.pairs[k+1];if(snapshot.finished||!pair)return 'Cvičia: nikto — plánované okruhy dokončené\nOddychujú: všetci\nĎalší: voda a ďalšie cvičenie';const names=p=>p?`${p[0]+1} (${r.labels[p[0]]}, útok) / ${p[1]+1} (${r.labels[p[1]]}, obrana)`:'okruhy dokončené';return `Cvičia: ${clock.taskRegroup?'nikto — preskupenie':names(pair)}\nOddychujú: ${clock.taskRegroup?'všetci':r.labels.filter((_,i)=>!pair.includes(i)).join(', ')}\nĎalší: ${names(clock.taskRegroup?pair:next)} · po akcii aspoň 20 s; medzi okruhmi 30 s navyše`;},
  participantsDescription(clock,snapshot){const part=snapshot.part;if(snapshot.finished)return 'Cvičia: nikto\nOddychujú: všetci\nĎalší: ďalšie cvičenie';const people=Object.entries(part.roles||{}).filter(([id,v])=>id.startsWith('child')&&v.visible),labels=people.map(([,v])=>v.label+(v.goalkeeper?' (brána)':v.team==='N'?' (podpora)':''));return `Cvičia: ${part.kind==='work'&&!clock.waiting?labels.join(', '):'nikto — príprava/oddych'}\nOddychujú: ${part.kind==='work'&&!clock.waiting?'podľa rolí; neutrál a brankár nie sú oddych':labels.join(', ')||'všetci'}\nĎalší: ${snapshot.next?.name||'ďalšie cvičenie'}`;},
  brief(t,b,index=0){
    const a=this.areas(t,b)[index],base=this.scene(b.diagram,{area:a}),v=this.variant(t,b,index),conesTotal=SessionPrograms.cones(t,b).length,seconds=(b.end-b.start)*60;
    const work=b.programKind==='duel'?'Do skončenia útoku':b.programKind==='speed'?'1 beh v 100 s okne':b.programKind==='pairs'?'3 × 3 min':b.programKind==='zones'?'2 × 5 min':b.programKind==='large-game'?'5 × 3 min':'Podľa rozpisu';
    const rest=b.programKind==='duel'?'aspoň 20 s; medzi okruhmi 30 s':b.programKind==='speed'?'približne 90 s zotavenia':b.programKind==='pairs'?'2 × 30 s':b.programKind==='zones'?'1 min':b.programKind==='large-game'?'4 × 1 min':'voda podľa rozpisu';
    const balls=b.programKind==='speed'||b.programKind==='finish'?0:base.nodes.filter(n=>n.kind==='ball').length,ballsTotal=this.areas(t,b).reduce((s,x)=>s+this.scene(b.diagram,{area:x}).nodes.filter(n=>n.kind==='ball').length,0),placement=this.placement(t,b,index);
    const repetitions={value:b.programKind==='speed'?'4':b.programKind==='pairs'?'3':b.programKind==='duel'?String(this.duelPairs(a.count).length/a.count):b.programKind==='zones'?'2':b.programKind==='large-game'?'5':'—',hint:b.programKind==='speed'?'najviac behov na dieťa':b.programKind==='duel'?'najviac úplných okruhov':'úseky podľa rozpisu'};
    return{title:b.title,selection:`${a.label} · ${a.count} z ${t.planConfig.players} detí`,shortInstruction:v.skillTask,description:v.skillTask,steps:[v.skillTask,b.dose,v.rotationText,`Obsadenie: ${a.playerLabels.join(', ')}.`,...t.organizationNotes],space:`${a.length} × ${a.width} m; celkom ${t.planConfig.width} × ${t.planConfig.height} m.`,grouping:`${a.label}: ${a.count} detí`,groups:this.areas(t,b).map(x=>x.label+' = '+x.playerLabels.join(', ')),labels:this.areas(t,b).map(x=>x.label),coaches:t.organizationNotes.filter(v=>v.startsWith("Tréner")),spacing:"Medzi plochami aspoň 3 m, obvod aspoň 2 m; pri bránach aj hĺbka siete.",work,rest,rotation:v.rotationText,notes:b.adjustments,kitNotes:[],round:null,glance:{work,rest,workHint:b.programKind==='duel'?'celá úloha má 11 min':'plánovaná práca',restHint:'oddych sa neskracuje'},timing:{total:`${b.end-b.start} min`,totalMinutes:b.end-b.start,totalSeconds:seconds,work,rest,workHint:b.programKind==="duel"?"prirodzene končiaca akcia":"práca podľa rozpisu",restHint:"plus voda a príprava podľa rozpisu",repetitions,schedule:b.dose,note:v.rotationText},kit:[`${balls} lôpt v tejto skupine; ${ballsTotal} spolu + rezervné.`,`${base.cones.length} mét tu; ${conesTotal} spolu.`,placement,'Rukavice pre brankárov; iba ukotvené brány.','Voda, signál a stopky.'],conePlacement:placement,ballsLocal:balls,ballsTotal,conesLocal:base.cones.length,conesTotal,slogan:b.cues[0],visualKit:[{kind:'ball',title:'Lopty',value:String(balls),detail:`${ballsTotal} pracovných spolu + 4 rezervné.`,local:balls,total:ballsTotal},{kind:'cone',title:'Méty',value:String(base.cones.length),detail:`${conesTotal} spolu. ${placement}`,local:base.cones.length,total:conesTotal},{kind:'bibs',title:'Rozlišovačky',value:String(a.count),detail:'Odlišuj tímy, podporu a brankárov.',local:a.count,total:t.planConfig.players},{kind:'gates',title:'Bránky',value:b.programKind==='large-game'&&a.goalkeepers?'2 ukotvené':String(base.cones.filter(x=>x.kind==='gate').length/2),detail:'Použi iba ukotvené brány; pri kužeľových hráme po zemi.'}]};
  }
};

// November 10 uses the existing presentation contract without changing earlier sessions.
const November10Program = {
  ...November9Program,
  id:'u11-duel-rondo-2026-11-10',
  definitions:[
    ['1','warm','football-warmup',10,'Rozohriatie s loptou a úvodná hra','Pozri, kde je voľno.','1 min privítanie + 2 min rozhýbanie + 3 min vedenie + 3 min hra + 1 min voda = 10 min.'],
    ['8','speed','football-speed',6,'Štarty 3 × 8 m','Svižné kroky a plynulé spomalenie.','1 min ukážka + 3 × 90 s štartovacie okno + 30 s voda = 6 min. Prvý beh nácvik, ďalšie dva svižne podľa pripravenosti.'],
    ['2','rondo','football-pass',12,'Rondo 4 na 1','Ukáž sa mimo tieňa obrancu.','1 min ukážka + 2 × (5 × 45 s hra + 4 × 15 s oddych) + 30 s medzi sériami + 1 min voda = 12 min.'],
    ['3','duel','football-rondo',12,'1 na 1 so zakončením','Prvý dotyk do voľna — obíď — zakonči.','1 min ukážka + 9 min rozpočet na celé okruhy a oddych + 2 min voda = 12 min. Najviac dva úplné okruhy, pri piatich každý 2 útoky a 2 obrany.'],
    ['4','zones','football-zones',14,'2 na 2 + jeden neutrálny','Voľná cesta alebo voľný spoluhráč?','1 min ukážka + 5 min hra + 1 min oddych + 5 min hra + 2 min voda/príprava = 14 min. V posledných 2 min: 30 s voda, 60 s príprava GK, 30 s presun.'],
    ['5','large-game','football-large-game',23,'Dve hry · striedanie brankárov','Rozhodni podľa obrancu.','2 min príprava + 6 × 2:30 hra + 5 × 1 min oddych + 1 min voda = 23 min. Všetci hrajú 15 min; GK podľa zvoleného variantu.'],
    ['6','finish','football-finish',3,'Pokojný záver','Kedy bolo lepšie viesť a kedy prihrať?','1 min chôdza + 1 min voda + 1 min otázka a pochvala = 3 min.']
  ],
  keeperLabels(n){return Array.from({length:n},(_,i)=>'G'+(i+1));},
  keeperRounds(n){return n===2?Array.from({length:6},(_,i)=>i%2?[2,1]:[1,2]):[[1,2,3],[3,1,2],[2,3,1],[1,2,3],[3,1,2],[2,3,1]];},
  distance(a){return Math.min(8,Math.max(3,Math.floor(a.length-8)));},
  grid(c,specs,kind){return November9Program.grid(c,specs,kind).map(a=>({...a,november9:false,november10:true,programKind:'nov10-'+kind,keeperCount:c.keepers}));},
  adapt(source,input={}){
    const c=TrainingPlanner.normalize({...source.defaultConfig,...input,keepers:Number(input.keepers??source.defaultConfig?.keepers??2)===3?3:2});
    const template=JSON.parse(JSON.stringify(source.nov10Template||source));delete template.programId;delete template.nov10Template;
    const t=TrainingPlanner.adapt(template,c),keepers=this.keeperLabels(c.keepers),fields=Array.from({length:c.players-c.keepers},(_,i)=>'P'+(i+1));let p=0;
    t.nov10Template=template;t.programId=this.id;t.duration=80;t.planConfig=c;
    t.defaultConfig={players:20,coaches:2,keepers:2,pitch:'half',width:50,height:35,groupMode:'auto',groupSizes:[5,5,5,5],levels:['base','base','standard','standard']};
    const bases=this.grid(c,c.groupSizes.map((n,i)=>{const g=keepers.filter((_,j)=>j%c.groupSizes.length===i);return{labels:[...fields.slice(p,p+=n-g.length),...g]};}),'warm');
    const gameCount=c.players>=25?3:2,counts=this.split(c.players,gameCount),gap=gameCount===2?4:3,gw=Math.min(20,(c.width-4-gap*(gameCount-1))/gameCount),gl=Math.min(26,c.height-8);p=0;
    const games=counts.map((n,i)=>{const g=i===0?keepers.slice(0,2):i===1?keepers.slice(2):[],labels=[...fields.slice(p,p+=n-g.length),...g];return{label:'Ihrisko '+(i+1),index:i,count:n,playerLabels:labels,skill:c.levels[Math.min(i*2,c.levels.length-1)]||'standard',x:2+i*(gw+gap),y:4,w:gw,h:gl,length:gl,width:gw,goalkeepers:i===0,november10:true,keeperCount:c.keepers,programKind:'nov10-large-game',phaseKind:'large-game'};});
    const stages={};let start=0;
    t.blocks=this.definitions.map(([id,kind,diagram,minutes,title,cue,dose])=>{const areas=kind==='large-game'?games:kind==='finish'?this.grid(c,[{labels:[...fields,...keepers],label:'Mužstvo'}],kind):bases.map(a=>({...a,phaseKind:kind,programKind:'nov10-'+kind}));stages[diagram]={areas,instructions:areas.map(a=>a.label+': '+a.playerLabels.join(', ')).join(' · ')};const b={id,title,programKind:kind,diagram,start,end:start+minutes,summary:cue,dose,cues:[cue],space:stages[diagram].instructions,steps:[cue,dose],stepTitles:['Úloha','Dávka'],tables:[],topics:[kind==='speed'?'coordination':kind==='duel'?'duels':'passing'],adjustments:['Pri únave vynechaj tretí štart alebo druhý okruh; zachovaj oddych. Pri bolesti ukonči záťaž.','Tlak a priestor prispôsob úspešnosti. Nenúť jednodotykovú hru ani povinnú prihrávku.']};start=b.end;return b;});
    stages['football-mini-games']=stages['football-large-game'];t.quarterPitch={...t.quarterPitch,width:c.width,height:c.height,corridor:{x:c.width/2-1.5,width:3},dynamic:true,stages};
    t.keepers=c.keepers;t.players=`${c.players} detí spolu · ${c.players-c.keepers} do poľa + ${c.keepers} brankári`;t.coaches=`${c.coaches} tréneri`;t.attendanceCases=t.attendanceCases.map(item=>({...item,keepers:c.keepers,outfield:item.total-c.keepers}));
    t.organizationNotes=['Tréner 1: A/B, v závere ihrisko I vrátane brankárov.','Tréner 2: C/D, v závere ihrisko II. Pri výmene skontrolujte oba počty.',`Skupiny: ${bases.map(a=>a.label+' = '+a.playerLabels.join(', ')).join(' · ')}. Miestne čísla podľa poradia; všetci vrátane GK nohami.`,`Zvolený variant: ${c.keepers} brankári. Pred začiatkom spočítaj všetky deti a vyber 2/3 GK v nastaveniach.`,'Pri súbojoch tréner uvoľní ďalšiu vlnu až po dokončení oboch svojich akcií a zotavení.'];
    if(c.coaches<2)t.organizationNotes.unshift('Pri jednom trénerovi nepouži štyri súbežné súbojové plochy; zjednoduš organizáciu pred začiatkom.');
    if(t.planning)t.planning={...t.planning,assumptions:`Približne 20 detí spolu, 2 tréneri, polovica ihriska. Aktuálny variant ${c.keepers} GK; vyber ich počet v nastaveniach. Pracovný rozmer 50 × 35 m treba zmerať.`};
    t.notes=t.notes.filter(n=>!['Zameranie tohto dňa','Organizácia podľa aktuálnych podmienok','Riadená záťaž','Odvaha v 1 na 1'].includes(n.title));t.notes.unshift({title:'Dnešné podmienky',text:t.players+'. Dve ukotvené brány; bez nich kužeľové a všetci GK nohami. Rozmery polovice over pred tréningom.'},{title:'Riadená záťaž',text:'80 min; 3 krátke štarty, krátke obranné úseky v ronde, najviac dva úplné okruhy 1 na 1. Herná kvalita rozhoduje; bez doplnkového kondičného okruhu.'},{title:'Organizácia podľa aktuálnych podmienok',text:t.organizationNotes.join(' ')});
    const maxima=t.blocks.map(b=>{const a=this.areas(t,b),counts=a.map(area=>this.scene(b.diagram,{area}).cones.length);b.coneSetup={counts,areas:a.length,perArea:counts[0],total:counts.reduce((x,y)=>x+y,0),placement:this.placement(t,b,0),extra:'Méty sú zo skutočných scén, bránkové sa nepripočítavajú druhýkrát. Presúvaj pri zastavenej hre.'};return b.coneSetup.total;});
    const maximum=Math.max(...maxima);t.equipment=[{name:'Lopty',quantity:`${c.players} + 4 rezervné = ${c.players+4} lôpt`,detail:'Na vedenie každý s loptou; potom jedna na každú plochu a pripravené rezervné.'},{name:'Méty a kužele',quantity:`${maximum} pracovných + 8 rezervných = ${maximum+8} mét`,detail:'Maximum naprieč cvikmi; bránkové méty už započítané.'},{name:'Brány',quantity:'2 ukotvené + kužeľové z uvedených mét',detail:'Bez ukotvených brán nehraj chytanie; oba zápasy na malé bránky nohami.'},{name:'Rozlišovačky',quantity:`${Math.ceil(c.players/2)} svetlých + ${Math.ceil(c.players/2)} tmavých + 4 neutrálne`,detail:'V každej päťke jeden N iba v malej hre; v ronde jeden obranca.'},{name:'Organizácia',quantity:`Stopky, signál, voda, lekárnička; rukavice pre ${c.keepers} GK`,detail:'Pred výmenou obe plochy zastaviť, skontrolovať počty a pripravenosť.'}];return t;
  },
  roster(a,round=0){if(a.phaseKind!=='large-game'||a.index>1)return [...a.playerLabels];const order=this.keeperRounds(a.keeperCount)[round%6],fields=a.playerLabels.filter(x=>!x.startsWith('G'));if(a.index===0)return [...fields,'G'+order[0],'G'+order[1]];if(a.keeperCount===2)return fields;const at=Math.max(0,Math.floor((fields.length+1)/2)-1);return [...fields.slice(0,at),'G'+order[2],...fields.slice(at)];},
  duelPairs(n){return Array.from({length:2},(_,r)=>Array.from({length:n},(_,i)=>[i,(i+1+r%(n-1))%n])).flat();},
  rotation(t,b,index=0){const a=this.areas(t,b)[index],n=a.count,k=b.programKind;
    if(k==='rondo')return `V oboch sériách obranca 1 → ${Array.from({length:n-1},(_,i)=>i+2).join(' → ')}. Pri piatich 45 s hry a 15 s oddych; medzi sériami 30 s. Obrancu nemeň za chybu. Každý pri piatich bráni 2 × 45 s.`;
    if(k==='speed')return `Poradie 1–${n}, jeden bežec v dráhe. Každý 3 × ${this.distance(a)} m, jeden beh v každom 90 s okne. Vlny približne po 10 s iba pri voľnej dráhe. Návrat mimo dráhy.`;
    if(k==='duel')return this.duelPairs(n).map(([x,y],i)=>`Okruh ${Math.floor(i/n)+1}, akcia ${i%n+1}: útok ${x+1} (${a.playerLabels[x]}), obrana ${y+1} (${a.playerLabels[y]}); ostatní oddych.`).join('\n')+' Po akcii aspoň 20 s, medzi okruhmi 60 s. Druhý okruh iba ak po oddychu zostávajú aspoň 4 minúty.';
    if(k==='large-game')return this.keeperRounds(t.keepers).map((g,i)=>`Úsek ${i+1}: ľavá G${g[0]}, pravá G${g[1]}${t.keepers===3?', nohami na II G'+g[2]:''}.`).join(' ')+` Presuny iba počas 1 min oddychu. ${t.keepers===2?'Každý GK 15 min v bráne.':'Každý GK 10 min v bráne + 5 min nohami.'} Poľové tímy zostávajú; obe hry až po kontrole počtov.`;
    return November9Program.rotation.call(this,t,b,index);
  },
  tables(t,b,a){const table=(headers,rows,caption)=>[{groupSize:a.count,headers,rows,caption}];if(b.programKind==='rondo')return table(['Séria','Obrancovia','Dávka pri 5'],[1,2].map(i=>[String(i),a.playerLabels.join(' → '),'5 × 45 s / 4 × 15 s oddych']),'Medzi sériami 30 s oddych; roly sa nemenia po chybe.');if(b.programKind==='duel')return table(['Okruh','Útok','Obrana','Oddych'],this.duelPairs(a.count).map(([x,y],i)=>[String(Math.floor(i/a.count)+1),a.playerLabels[x],a.playerLabels[y],a.playerLabels.filter((_,j)=>j!==x&&j!==y).join(', ')]),'Po akcii aspoň 20 s, medzi okruhmi 60 s; najviac dva úplné okruhy.');if(b.programKind==='speed')return table(['Okno','Poradie','Dávka'],[1,2,3].map(i=>[String(i),a.playerLabels.join(' → '),`Raz ${this.distance(a)} m, 90 s okno`]),'Prvý nácvik, dva svižné podľa kvality.');if(b.programKind==='large-game')return table(['Úsek','Ľavá I','Pravá I','Nohami II'],this.keeperRounds(t.keepers).map((g,i)=>[String(i+1),'G'+g[0],'G'+g[1],g[2]?'G'+g[2]:'bez GK']),'Výmena v minútovej prestávke; každý úsek 2:30.');return November9Program.tables.call(this,t,b,a);},
  task(t,b,a){const k=b.programKind;if(k==='rondo')return `${a.count-1} na 1: vytvor uhol mimo tieňa obrancu, pred príjmom sa pozri a natoč telo. Obranca má vlastný čas, po chybe sa nemení. Voľné dotyky, bez sklzov.`;if(k==='speed')return `Tri behy po ${this.distance(a)} m, prvý nácvik; po cieli aspoň 6 m na spomalenie. Medzi vlastnými štartmi asi 90 s. Ďalšieho uvoľní tréner pri voľnej dráhe.`;if(k==='zones')return 'Pri piatich 2 na 2 + presne jeden N, ktorý pomáha tímu s loptou. Bod za prízemný gól na kužeľovú bránku. Rozhodni podľa obrancu; prihrávka nie je povinná. Pri párnom vyššom počte sa jedna oddychová rola aj N pravidelne posúvajú.';if(k==='large-game')return a.goalkeepers?'Pri 20 deťoch 4 na 4 + dvaja GK. Voľná hra, prvý dotyk pripraví vedenie alebo prihrávku. Šesť úsekov po 2:30; brány musia byť ukotvené.':`Pri 20 deťoch 5 na 5 na štyri kužeľové bránky. ${t.keepers===3?'Tretí GK je piaty hráč tímu P9–P12, nie hráč navyše.':'Všetci desiati sú poľoví hráči.'} Šesť úsekov po 2:30, rovnaký oddych.`;return November9Program.task.call(this,t,b,a);},
  scene(key,opts={}){
    const a=opts.area,k=a.phaseKind,round=opts.round||0,mode=opts.mode||'';
    if(!['rondo','speed','zones'].includes(k)&&!(k==='warm'&&mode==='game')){const s=November9Program.scene.call(this,key,opts);if(k==='duel'){s.cones.push({...s.cones.at(-1),x:s.pitch.x+s.pitch.w*.15,y:s.pitch.y+s.pitch.h*.4,kind:'station'});for(const n of s.nodes.filter(n=>n.kind==='player'))n.role=n.label.endsWith('R')?'rest':n.team==='B'?'defender':'attacker';}if(k==='finish')s.cones=[];return s;}
    const labels=this.roster(a,round),n=labels.length,pitch={x:40,y:42,w:280,h:280*a.width/a.length,length:a.length,width:a.width};
    const s={key,pitch,total:n,size:n,localCount:n,pitchIndex:a.index,nodes:[],tracks:{},arrows:[],steps:[],cones:[],lines:[],annotations:[],duration:8,loopMode:'cut',caption:'Vzorová ukážka. Tréningové dávky a aktuálne roly ukazuje nezávislý časovač.'};
    const p=(u,v)=>[pitch.x+u*pitch.w,pitch.y+v*pitch.h],node=(i,u,v,team='A',role='field')=>{const [x,y]=p(u,v),id='child'+i;s.nodes.push({id,kind:'player',x,y,label:labels[i]+(role==='rest'?'R':role==='defender'?'D':''),team,role});s.tracks[id]=[[0,x,y],[8,x,y]];return id;},track=(id,frames)=>s.tracks[id]=frames.map(([at,u,v])=>[at,...p(u,v)]),cone=(u,v,kind='corner')=>{const[x,y]=p(u,v);s.cones.push({x,y,kind});},arrow=(kind,points)=>s.arrows.push({kind,number:s.arrows.length+1,label:false,points:points.map(([u,v])=>{const[x,y]=p(u,v);return{x,y};}),start:1,end:7}),ball=(frames)=>{const[x,y]=p(frames[0][1],frames[0][2]);s.nodes.push({id:'ball0',kind:'ball',team:'A',label:'',x,y});track('ball0',frames);};
    [[0,0],[1,0],[0,1],[1,1]].forEach(q=>cone(...q));
    if(k==='speed'){const start=1/a.length,finish=start+this.distance(a)/a.length,slow=finish+6/a.length;s.duration=n*4;for(const u of[start,finish,slow])for(const v of[.3,.55])cone(u,v,'lane');for(let i=0;i<n;i++){node(i,.04,.68+i*.26/Math.max(1,n-1),'N','runner');const q=i*4;track('child'+i,[[0,.04,.68+i*.26/Math.max(1,n-1)],[q+.2,start,.42],[q+1.2,finish,.42],[q+2.2,slow,.42],[q+2.8,slow,.85],[q+3.8,start,.85],[s.duration,.04,.68+i*.26/Math.max(1,n-1)]]);}arrow('run',[[start,.42],[finish,.42]]);const[x,y]=p(.55,.12);s.annotations.push({x,y,text:`${this.distance(a)} m + 6 m spomalenie`});return s;}
    if(k==='rondo'){const size=Math.min(8,a.length-2,a.width-2),dx=size/(2*a.length),dy=size/(2*a.width),def=round%n,passers=Array.from({length:n},(_,i)=>i).filter(i=>i!==def),pos=[];[[.5-dx,.5-dy],[.5+dx,.5-dy],[.5+dx,.5+dy],[.5-dx,.5+dy]].forEach(q=>cone(...q,'rondo'));node(def,.5,.5,'B','defender');track('child'+def,[[0,.5,.5],[3,.5+.07,.5-.05],[6,.5-.06,.5+.05],[8,.5-.06,.5+.05]]);passers.forEach((id,j)=>{const angle=2*Math.PI*j/passers.length-Math.PI/2,u=.5+dx*Math.cos(angle),v=.5+dy*Math.sin(angle);pos.push([u,v]);node(id,u,v,'A','passing');track('child'+id,[[0,u,v],[4,u+.015,v+.015],[8,u,v]]);});const frames=pos.map(([u,v],j)=>[8*j/pos.length,u,v]);frames.push([8,...pos[0]]);ball(frames);for(let j=0;j<pos.length;j++)arrow('pass',[pos[j],pos[(j+1)%pos.length]]);return s;}
    const hasNeutral=n>=3,neutral=hasNeutral?round%n:-1,rest=n>=4&&n%2===0?(round+1)%n:-1,fields=Array.from({length:n},(_,i)=>i).filter(i=>i!==neutral&&i!==rest),team=Math.floor(fields.length/2);
    for(let i=0;i<n;i++){if(i===neutral){node(i,.5,.5,'N','neutral');track('child'+i,[[0,.5,.5],[4,.55,.43],[8,.55,.43]]);}else if(i===rest)node(i,.06,.9,'N','rest');else{const rank=fields.indexOf(i),side=rank<team?'A':'B',at=rank<team?rank:rank-team,u=side==='A'?.2:.75,v=.2+at*.6/Math.max(1,team-1);node(i,u,v,side);track('child'+i,[[0,u,v],[4,u+.04,v],[8,u+.08,Math.min(.9,v+.03)]]);}}
    if(k==='zones')for(const u of[0,1])for(const d of[-1,1])cone(u,.5+d/a.width,'gate');
    ball([[0,.2,.2],[2,.5,.5],[4,.25,.75],[6,.65,.4],[8,.98,.5]]);arrow('pass',[[.2,.2],[.5,.5],[.25,.75]]);arrow(k==='zones'?'shot':'dribble',[[.25,.75],[.98,.5]]);return s;
  },
  phases(t,b,index=0){const a=this.areas(t,b)[index],n=a.count,out=[],add=(name,seconds,kind='work',extra={})=>out.push({name,seconds,kind,...extra}),k=b.programKind;
    if(['warm','finish'].includes(k))return November9Program.phases.call(this,t,b,index);
    if(k==='speed'){add('Ukážka a voľná dráha',60,'setup');for(let r=0;r<3;r++)add(`Séria ${r+1}/3 · jeden beh na dieťa`,90,'work',{round:r,gate:r>0});add('Voda a presun',30,'water');}
    if(k==='rondo'){add('Ukážka ronda a poradie',60,'setup');for(let r=0;r<2;r++){for(let j=0;j<n;j++){add(`Séria ${r+1}/2 · obranca ${j+1}`,Math.floor(225/n)+(j<225%n?1:0),'work',{round:j,gate:r>0&&j===0});if(j<n-1)add(`Oddych · nasleduje obranca ${j+2}`,Math.floor(60/(n-1))+(j<60%(n-1)?1:0),'rest',{round:j+1});}if(r===0)add('Oddych medzi sériami',30,'rest');}add('Voda',60,'water');}
    if(k==='duel'){add('Ukážka a roly',60,'setup');add('Celá úloha 1 na 1 · vzorový útok',540,'work');add('Voda a prestavba',120,'water');}
    if(k==='zones'){const turns=n>=3?n:1;add('Ukážka hry a jedného N',60,'setup');for(let r=0;r<2;r++){for(let j=0;j<turns;j++)add(`Úsek ${r+1}/2 · ${n>=3?'N '+(j+1):'hra'}`,Math.floor(300/turns)+(j<300%turns?1:0),'work',{round:j,gate:r>0&&j===0});if(r===0)add('Oddych medzi hrami',60,'rest');}add('Voda pre všetkých',30,'water');add('Príprava GK s trénerom 1; ostatní voda a tímy s trénerom 2',60,'setup',{keeperPrep:true,cue:'T1: po 2–4 jemné podania/chytenia pre 2/3 GK. T2 dohliada na ostatných. Bez prudkých striel a pádových sérií.'});add('Presun do záverečných hier',30,'setup');}
    if(k==='large-game'){add('Príprava a kontrola oboch ihrísk',120,'setup');for(let r=0;r<6;r++){add(`Úsek ${r+1}/6 · GK: ľavá G${this.keeperRounds(t.keepers)[r][0]}, pravá G${this.keeperRounds(t.keepers)[r][1]}${t.keepers===3?', nohami G'+this.keeperRounds(t.keepers)[r][2]:''}`,150,'work',{round:r,gate:r>0});if(r<5)add(`Oddych · potom GK: ľavá G${this.keeperRounds(t.keepers)[r+1][0]}, pravá G${this.keeperRounds(t.keepers)[r+1][1]}${t.keepers===3?', nohami G'+this.keeperRounds(t.keepers)[r+1][2]:''}`,60,'rest',{round:r+1});}add('Voda a spätná väzba',60,'water');}return out;
  },
  sequence(t,b,index,base){const a=this.areas(t,b)[index],out={...base,nodes:base.nodes.map(n=>({...n})),tracks:{},arrows:[],steps:[],phases:[],duration:0};let lastRoles={};for(const part of this.phases(t,b,index)){const scene=this.scene(b.diagram,{area:a,...part}),work=part.kind==='work',seconds=work?Math.min(18,Math.max(6,scene.duration)):1.2,start=out.duration,end=start+seconds,roles={},cue=part.cue||this.task(t,b,a)+' '+part.name;for(const node of out.nodes){const current=scene.nodes.find(x=>x.id===node.id),frames=out.tracks[node.id]||(out.tracks[node.id]=[]);roles[node.id]={label:current?.label||node.label,team:current?.team||node.team,role:part.keeperPrep?(node.label.startsWith('G')?'keeper-prep':'rest'):current?.role,visible:node.kind!=='ball'||work,goalkeeper:!!current?.goalkeeper};if(work&&current)for(const f of scene.tracks[node.id]||[[0,current.x,current.y],[scene.duration,current.x,current.y]])frames.push([start+seconds*f[0]/scene.duration,f[1],f[2],...(f[0]===0?['cut']:[])]);else{const last=frames.at(-1)||[0,node.x,node.y];frames.push([start,last[1],last[2]],[end,last[1],last[2]]);}}if(work)for(const arrow of scene.arrows||[])out.arrows.push({...arrow,start:start+(arrow.start||0)*seconds/scene.duration,end:Math.min(end,start+(arrow.end||scene.duration)*seconds/scene.duration)});out.phases.push({name:part.name,actualSeconds:part.seconds,start,ready:start,end,kind:part.kind,cue,roles,requiresStart:!!part.gate,keeperPrep:!!part.keeperPrep,november10:true});out.steps.push({time:start,text:cue});out.duration=end;lastRoles=roles;}const start=out.duration;for(const frames of Object.values(out.tracks)){const last=frames.at(-1);frames.push([start+1.2,last[1],last[2]]);}out.phases.push({name:'Cvičenie dokončené',actualSeconds:0,start,ready:start,end:start+1.2,kind:'end',cue:'Pokračuj na ďalšie cvičenie.',roles:lastRoles});out.duration+=1.2;return out;},
  intervals(t,b,index=0){const a=this.areas(t,b)[index],scope=`${a.label} · ${a.count} detí (${a.playerLabels.join(', ')})`;if(b.programKind==='duel')return{scope,participants:a.count,rotation:{protocol:'november10',count:a.count,labels:a.playerLabels,recovery:20,between:60,lanes:1,maxRounds:this.duelPairs(a.count).length,pairs:this.duelPairs(a.count)},parts:[{name:'Ukážka a roly',kind:'setup',milliseconds:60000,november10:true},{name:'1 na 1 · celé okruhy a oddych',kind:'task',milliseconds:540000,requiresStart:true,regroupBefore:true,november10:true},{name:'Voda a prestavba',kind:'water',milliseconds:120000,november10:true}]};const base=this.scene(b.diagram,{area:a}),sequence=this.sequence(t,b,index,base);return{scope,participants:a.count,speed:b.programKind==='speed',speedLanes:1,parts:sequence.phases.filter(p=>p.actualSeconds>0).map(p=>({name:p.name,kind:p.kind,milliseconds:Math.round(p.actualSeconds*1000),requiresStart:!!p.requiresStart,regroupBefore:!!p.requiresStart,cue:p.cue,roles:p.roles,keeperPrep:p.keeperPrep,november10:true}))};},
  syncDuel(clock,snapshot){if(snapshot.part.kind!=='task'){clock.taskRegroup=false;clock.recoveryUntil=0;}},
  advanceDuel(clock,now=Date.now()){const snap=clock.snapshot(now),r=clock.rotation;if(!clock.started||clock.deadline===null||clock.waiting||clock.taskRegroup||snap.part.kind!=='task'||clock.rotationRound>=r.maxRounds)return false;clock.rotationRound++;if(clock.rotationRound>=r.maxRounds)return true;const between=clock.rotationRound%r.count===0;if(between&&snap.remaining<300000){clock.rotationRound=r.maxRounds;clock.duelStopped=true;return true;}clock.taskRegroup=true;clock.recoveryUntil=now+(between?60:20)*1000;return true;},
  canConfirmDuel(clock,now=Date.now()){return !clock.taskRegroup||now>=(clock.recoveryUntil||0);},
  rotationDescription(clock,snapshot){if(snapshot.part.kind!=='task')return `Cvičia: nikto — ${snapshot.part.name}\nOddychujú: všetci\nĎalší: ${snapshot.next?.name||'ďalšie cvičenie'}`;const r=clock.rotation,k=clock.rotationRound||0,pair=r.pairs[k],names=p=>p?`${p[0]+1} (${r.labels[p[0]]}, útok) / ${p[1]+1} (${r.labels[p[1]]}, obrana)`:'okruhy dokončené';if(!pair)return `Cvičia: nikto — ${clock.duelStopped?'ďalší okruh vynechaný; čas na celý okruh nestačí':'plánované okruhy dokončené'}\nOddychujú: všetci\nĎalší: voda a ďalšie cvičenie`;const rest=Math.max(0,Math.ceil(((clock.recoveryUntil||0)-Date.now())/1000));return `Cvičia: ${clock.waiting||clock.taskRegroup?'nikto — príprava/oddych':names(pair)}\nOddychujú: ${clock.taskRegroup?'všetci · ešte najmenej '+rest+' s':r.labels.filter((_,i)=>!pair.includes(i)).join(', ')}\nĎalší: ${names(clock.taskRegroup||clock.waiting?pair:r.pairs[k+1])} · medzi okruhmi 60 s navyše`;},
  participantsDescription(clock,snapshot){const p=snapshot.part;if(snapshot.finished)return 'Cvičia: nikto\nOddychujú: všetci\nĎalší: ďalšie cvičenie';const roles=Object.entries(p.roles||{}).filter(([id])=>id.startsWith('child')).map(([,r])=>r),working=p.kind==='work'&&!clock.waiting,active=roles.filter(r=>(working&&r.role!=='rest')||(p.keeperPrep&&r.role==='keeper-prep')),label=r=>r.label+(r.goalkeeper?' (brána)':r.role==='defender'?' (obranca)':r.role==='neutral'?' (N)':r.role==='keeper-prep'?' (príprava GK)':'');return `Cvičia: ${active.map(label).join(', ')||'nikto — príprava/oddych'}\nOddychujú: ${roles.filter(r=>!active.includes(r)).map(r=>r.label).join(', ')||'nikto; N aj brankár sú aktívni'}\nĎalší: ${snapshot.next?.name||'ďalšie cvičenie'}`;},
  brief(t,b,index=0){const v=November9Program.brief.call(this,t,b,index),k=b.programKind,work=k==='rondo'?'2 × 5 × 45 s':k==='speed'?'3 krátke behy':k==='duel'?'Do skončenia útoku':k==='large-game'?'6 × 2:30':v.work,rest=k==='rondo'?'15 s medzi úsekmi; 30 s medzi sériami':k==='speed'?'asi 90 s medzi vlastnými štartmi':k==='duel'?'aspoň 20 s; medzi okruhmi 60 s':k==='large-game'?'5 × 1 min':v.rest;v.work=work;v.rest=rest;v.glance={...v.glance,work,rest,workHint:k==='duel'?'celá úloha má 12 min':'práca podľa rozpisu'};v.timing={...v.timing,work,rest,repetitions:{value:k==='rondo'?'2 × 5':k==='speed'?'3':k==='large-game'?'6':k==='duel'?'najviac 2':v.timing.repetitions.value,hint:k==='rondo'?'série × obranné roly pri piatich':'podľa rozpisu'}};return v;}
};
