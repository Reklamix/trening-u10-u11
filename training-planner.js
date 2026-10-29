'use strict';

const TrainingPlanner = {
  levels:{base:'Základy',standard:'Upevnenie',challenge:'Výzva'},
  pitches:{quarter:{label:'1/4 ihriska',width:35,height:25},half:{label:'1/2 ihriska',width:50,height:35},full:{label:'Celé ihrisko',width:70,height:50}},
  supports(training){return training?.id==='2026-10-29'&&Boolean(training.quarterPitch);},
  normalize(input={}){
    const pitch=Object.hasOwn(this.pitches,input.pitch)?input.pitch:'quarter',preset=this.pitches[pitch];
    const integer=(value,fallback,min,max)=>Number.isFinite(Number(value))&&value!==''?Math.max(min,Math.min(max,Math.round(Number(value)))):fallback;
    const players=integer(input.players,20,14,30),sizes=Array.isArray(input.groupSizes)?input.groupSizes.map(Number):[],levels=Array.isArray(input.levels)?input.levels:[];
    return{players,coaches:integer(input.coaches,2,1,4),pitch,width:integer(input.width,preset.width,35,120),height:integer(input.height,preset.height,25,90),groupSizes:sizes.length===4&&sizes.every(n=>Number.isInteger(n)&&n>=3&&n<=8)&&sizes.reduce((a,b)=>a+b,0)===players?sizes:this.groups(players),levels:Array.from({length:4},(_,i)=>Object.hasOwn(this.levels,levels[i])?levels[i]:'standard')};
  },
  groups(total){return Array.from({length:4},(_,index)=>Math.floor(total/4)+(index<total%4?1:0));},
  resize(input,space){
    if(!space||!Object.hasOwn(this.pitches,space.pitch)||!Number.isInteger(space.width)||space.width<35||space.width>120||!Number.isInteger(space.height)||space.height<25||space.height>90)return null;
    return this.normalize({...input,pitch:space.pitch,width:space.width,height:space.height});
  },
  regroup(input,sizes){
    if(!Array.isArray(sizes)||sizes.length!==4||!sizes.every(n=>Number.isInteger(n)&&n>=3&&n<=8))return null;
    const players=sizes.reduce((sum,n)=>sum+n,0);if(players<14||players>30)return null;
    return this.normalize({...input,players,groupSizes:sizes});
  },
  halfBasics(total){const a=Math.ceil(total/2),b=Math.floor(total/2);return{groupSizes:[Math.ceil(a/2),Math.floor(a/2),Math.ceil(b/2),Math.floor(b/2)],levels:['base','base','standard','standard']};},
  form(size){const team=size===3?1:size>=7?3:2;return{team,neutral:size-2*team,label:`${team} na ${team}${size-2*team?' + '+(size-2*team)+' N':''}`};},
  organization(config,groups){
    const labels=['A1','A2','B1','B2'];
    const assignments=config.coaches===1?['Tréner 1: všetky štyri skupiny, vždy rovnaká činnosť a spoločný signál. Ukážku urob celému mužstvu.']:config.coaches===2?['Tréner 1: A1 a A2.','Tréner 2: B1 a B2.']:config.coaches===3?['Tréner 1: A1.','Tréner 2: A2.','Tréner 3: B1 a B2.']:labels.map((label,index)=>`Tréner ${index+1}: ${label}.`);
    const notes=[...assignments,`Skupiny: ${labels.map((label,index)=>label+' = '+groups[index]).join(', ')}. Čísla hráčov prideľ v každej skupine samostatne.`];
    if(config.coaches===1)notes.push('Pri jednom trénerovi nerob rôzne stanovištia naraz. Počas vody priprav ďalšiu činnosť, dávaj najviac jeden krátky podnet celej skupine.');
    if(config.players>24&&config.width*config.height<=1000)notes.push('25–30 detí na tejto ploche: tesnejšie technické hry 3 na 3 s neutrálnymi. Odporúčame aspoň 2 trénerov; pre voľnejšiu hru zvoľ väčší priestor. Hrajte po zemi, bez silových striel.');
    return notes;
  },
  forGroup(training,block,index=0){
    if(!training?.planConfig)return block;
    const config=training.planConfig,key=block.diagram;
    if(key==='football-warmup'){
      const first=index*2,labels=['A1','A2','B1','B2'];
      return{...block,skillLabel:[first,first+1].map(i=>labels[i]+' · '+this.levels[config.levels[i]]).join(' / '),skillTask:'Vedenie začína každý s vlastnou loptou. Na prihrávky vytvor dvojice/trojicu v rámci A1/A2 alebo B1/B2 podľa zvolenej náročnosti; skupiny nemiešaj.',steps:block.steps.map((text,i)=>i===2?text+' Dvojice skladaj v rámci budúcich skupín. Základy: 3–4 m, prijmi a prihraj bez tlaku. Upevnenie: prvý dotyk do voľna. Výzva: rozhľad a prihrávka po pohybe.':text)};
    }
    if(key==='football-finish')return block;
    const level=config.levels[index]||'standard',b={...block,steps:[...block.steps],cues:[...block.cues],adjustments:[...block.adjustments],skillLabel:this.levels[level]};
    const tasks={
      'football-pass':{
        base:'Dvojice/trojica na 3–4 m, každá s loptou. Prijmi, upokoj loptu a prihraj vnútornou stranou po zemi. Bez obrancu a bez povinného presunu po prihrávke.',
        standard:'Pred prijatím sa pozri. Prvým dotykom priprav ďalšiu prihrávku a po prihrávke vytvor nový uhol.',
        challenge:'Pred prijatím sa dvakrát rozhliadni, prijmi otvoreným postavením a po prihrávke sa rýchlo ponúkni. Až pri úspešnom obehu skús 2–3 dotyky; pri stratách limit zruš.'},
      'football-rondo':{
        base:'Obranca najprv iba kráča a zachytáva prihrávky; loptu pri nohe neodoberá. Hráč môže loptu zastaviť a pripraviť si prihrávku. Tlak pridaj až po viacerých zvládnutých prihrávkach.',
        standard:'Aktívny, primeraný tlak. Dotyky neobmedzuj; sleduj rozhľad a ponuku v rôznych uhloch.',
        challenge:'Obrancovia aktívne zatvárajú prihrávkové línie. Hľadaj novú ponuku hneď po prihrávke. Limit 2–3 dotykov zaveď len pri opakovane úspešnej hre.'},
      'football-zones':{
        base:'Prijímajúci dostane približne 2 s na spracovanie bez odoberania lopty. Dotyky neobmedzuj; do zóny možno viesť aj prihrať. Nevynucuj počet prihrávok.',
        standard:'Voľné dotyky a aktívna obrana. Bod za kontrolované vedenie alebo príjem prihrávky v zóne.',
        challenge:'Aktívna obrana bez ochrany príjmu. Hľadaj prihrávku do nábehu; bod po prihrávke a opätovnej ponuke môže byť za 2. Bez povinného počtu prihrávok.'},
      'football-mini-games':{
        base:'Vyrovnané tímy iba v tejto skupine. Pri príjme približne 2 s bez odoberania; potom normálna hra. Gól za 1, voľné dotyky, žiadna povinná kombinácia.',
        standard:'Vyrovnané tímy v rámci skupiny, voľná hra a pôvodné bodovanie. Sleduj ponuku po prihrávke.',
        challenge:'Tímy zostávajú v tejto skupine, obrana naplno primerane úlohe. Prvé dva úseky odmeň gól po prihrávke a novej ponuke za 2; posledné dva voľná hra.'}
    };
    b.skillTask=tasks[key]?.[level]||'';
    b.summary=b.skillTask;
    if(level==='challenge'&&key==='football-pass')b.steps[1]+=' '+b.skillTask;
    if(level==='base'&&key==='football-pass'){
      b.stepTitles=['Dvojice a trojica','Prijmi a prihraj','Práca bez presunu','Série a prestávky','Voda'];
      b.steps[0]='V rovnakej ploche vytvor dvojice; pri nepárnom počte jednu trojicu. Každá má vlastnú loptu, prihrávka na 3–4 m, žiadne rady ani presun do susednej skupiny.';
      b.steps[1]='Prijmi vnútornou stranou, priprav loptu pred seba a pošli ju po zemi spoluhráčovi. Dotyky neobmedzuj.';
      b.steps[2]='Hráči zostávajú vo svojich dvojiciach/trojici. V trojici ide lopta 1 → 2 → 3 → 1; pravidelne otoč smer. Nový uhol pridaj až po zvládnutí prihrávky.';
      const size=config.groupSizes[index],pairs=(size-3)/2;
      b.tables=[{groupSize:size,caption:'Dvojice a prípadná trojica; každý aktívny, každá podskupina s loptou',headers:['Počet v skupine','Rozdelenie'],rows:[[String(size),size===3?'1 trojica':size%2?`${pairs} ${pairs===1?'dvojica':'dvojice'} + 1 trojica`:`${size/2} dvojice`]]}];
    }
    if(key==='football-rondo')b.steps[3]=b.skillTask+' Bod za 3 prihrávky; roly a časy zostávajú podľa tabuľky.';
    if(key==='football-zones')b.steps[1]=b.skillTask+' Neutrálny sám neboduje; v zóne sa nečaká natrvalo.';
    if(key==='football-mini-games'){b.steps[2]+=' '+b.skillTask;if(level==='base')b.steps[4]='Všetky štyri úseky gól za 1. Žiadna povinná kombinácia ani počet dotykov. Podpor snahu prijať a presne prihrať.';}
    b.adjustments.unshift(b.skillTask,'Ak je úloha príliš ťažká, uber najprv tlak alebo počet pravidiel. Ak je ľahká, pridaj iba jednu výzvu. Presun medzi skupinami rieš individuálne počas vody, bez verejného porovnávania detí.');
    if(level==='base')b.cues=['Priprav si loptu pred seba.','Pozri na spoluhráča a prihraj po zemi.'];
    else if(level==='challenge')b.cues=['Pozri sa pred prijatím.','Prihraj a hneď vytvor nový uhol.'];
    return b;
  },
  adapt(source,input){
    if(!this.supports(source))return source;
    const config=this.normalize(input),t=JSON.parse(JSON.stringify(source)),groups=config.groupSizes,labels=['A1','A2','B1','B2'];
    t.planConfig=config;t.organizationNotes=this.organization(config,groups);t.coaches=config.coaches+' '+(config.coaches===1?'tréner':'tréneri');t.players=config.players+' detí · bez brankárov';
    t.attendanceCases=Array.from({length:17},(_,i)=>({total:i+14,groups:i+14===config.players?groups:this.groups(i+14)}));
    t.organizationNotes.push('Deti rozdeľ podľa aktuálneho zvládnutia tejto úlohy, nie iba podľa počtu alebo fyzickej sily. Skupiny zostávajú oddelené aj v minihre; vnútri vytvor vyrovnané družstvá. Názvy Základy/Upevnenie/Výzva sú voľby trénera, nie trvalé nálepky detí.');
    t.organizationNotes.push(labels.map((label,i)=>`${label}: ${groups[i]} · ${this.levels[config.levels[i]]}`).join('; ')+'.');
    const w=config.width,h=config.height,workW=Math.min(w,47),workH=Math.min(h,39),ox=(w-workW)/2,oy=(h-workH)/2,cw=(workW-7)/2,ch=(workH-7)/2,round=value=>Math.round(value*10)/10,gameLength=Math.min(cw,20),gameWidth=round(Math.min(ch,16,gameLength*.8)),passLength=gameLength-2;
    const gameAreas=labels.map((label,i)=>({label,x:ox+2+Math.floor(i/2)*(cw+3)+(cw-gameLength)/2,y:oy+2+(i%2)*(ch+3)+(ch-gameWidth)/2,w:gameLength,h:gameWidth,length:gameLength,width:gameWidth}));
    const passAreas=gameAreas.map(area=>({...area,x:area.x+1,w:passLength,length:passLength}));
    const warmLength=Math.min(workH-4,30),warmWidth=round(Math.min(cw,22,warmLength*.8)),warmAreas=['A','B'].map((label,i)=>({label,x:ox+2+i*(cw+3)+(cw-warmWidth)/2,y:oy+2+(workH-4-warmLength)/2,w:warmWidth,h:warmLength,length:warmLength,width:warmWidth}));
    const layout=t.quarterPitch;layout.width=w;layout.height=h;layout.label=this.pitches[config.pitch].label;layout.assumed=config.pitch!=='quarter'||w!==35||h!==25;layout.working={x:ox,y:oy,width:workW,height:workH};layout.corridor={x:ox+2+cw,width:3};layout.dynamic=w!==35||h!==25;
    layout.warmupCounts=[groups[0]+groups[1],groups[2]+groups[3]];
    t.organizationNotes.push(`Dostupných ${w} × ${h} m; pracovná zóna ${workW} × ${workH} m v strede. Plochy držíme blízko seba kvôli presunom a prehľadu trénerov.`);
    layout.assumption=`${this.pitches[config.pitch].label}: dostupná plocha ${w} × ${h} m. Cvičenia sú sústredené v zóne ${workW} × ${workH} m. Štvrť 35 × 25 m je pôvodne potvrdená; ostatné rozmery si over podľa prideleného priestoru. Priechody aspoň 3 m, obvod aspoň 2 m.`;
    for(const[key,areas]of Object.entries({'football-warmup':warmAreas,'football-pass':passAreas,'football-rondo':passAreas,'football-zones':gameAreas,'football-mini-games':gameAreas})){
      layout.stages[key].areas=areas.map((area,i)=>({...area,count:key==='football-warmup'?layout.warmupCounts[i]:groups[i],skill:key==='football-warmup'?null:config.levels[i]}));
      layout.stages[key].instructions=key==='football-warmup'?`Dve zóny ${warmLength} × ${warmWidth} m; A má ${layout.warmupCounts[0]} a B ${layout.warmupCounts[1]} detí. A neskôr vytvorí A1/A2, B vytvorí B1/B2. Každý vlastnú loptu. Voľný stredný priechod 3 m.`:`Štyri plochy ${areas[0].length} × ${areas[0].width} m: ${labels.map((label,i)=>label+' '+groups[i]).join(', ')} hráčov. Medzi pracovnými plochami aspoň 3 m, po obvode aspoň 2 m. ${key==='football-zones'?'Koncové zóny sú hlboké 2 m.':key==='football-mini-games'?'Dve kužeľové bránky široké 2 m na každej ploche.':''}`;
    }
    for(const block of t.blocks){
      const areas=layout.stages[block.diagram]?.areas;
      if(areas)block.space=layout.stages[block.diagram].instructions;
      if(block.coneSetup&&areas){const area=areas[0];block.coneSetup.placement=block.id==='1'?`Do štyroch rohov každej z dvoch zón ${area.length} × ${area.width} m polož jednu métu, spolu 8.`:block.id==='4'?`Na každej ploche ${area.length} × ${area.width} m 4 rohové méty a 4 méty na hranice zón, 2 m od koncov; spolu 32.`:block.id==='5'?`Na každej ploche ${area.length} × ${area.width} m nechaj 4 rohové méty. Ďalšie 4 vytvoria dve bránky široké 2 m v strede koncových čiar; spolu 32.`:`Každú zo štyroch plôch ${area.length} × ${area.width} m označ 4 rohovými métami, spolu 16.`;}
      if(['2','3'].includes(block.id))block.coneSetup.extra=`Skupiny majú ${groups.join(' + ')} hráčov. Méty označujú hranice, nie povinné miesta hráčov. Priechody zostávajú voľné; rozdelenie trénerov nájdeš v Prehľade.`;
    }
    const pass=t.blocks[1],rondo=t.blocks[2],zones=t.blocks[3],games=t.blocks[4];
    pass.tables=Array.from({length:6},(_,i)=>{const size=i+3;return{groupSize:size,caption:`Skupina ${size}: každý prihrá a vytvorí nový uhol`,headers:['Poradie','Po prihrávke'],rows:[[Array.from({length:size+1},(_,j)=>String(j%size+1)).join(' → '),'Posuň sa do voľného uhla, nestoj za príjemcom.']]};});
    rondo.steps=[
      '18:22–18:24 ukážka. Série 18:24–18:28:30 a 18:29:30–18:34; medzi nimi 1 min voda.',
      'V skupine 3–6 bráni jeden, v skupine 7–8 dvaja. Poradie a dávku otvor v Striedaní pre svoju skupinu; obranca sa mení až na signál.',
      'Po zisku obrancov obnov hru s tými istými rolami. Strata automaticky neposiela hráča do stredu.',
      'Bod za 3 prihrávky. Ponuka v rôznych uhloch, rozhľad pred prijatím; dotyky zatiaľ neobmedzuj.',
      'Uprav tlak obrancu a čas na prijatie. 18:34–18:36 voda a príprava koncových zón.'
    ];
    rondo.tables=[];rondo.rotation=[];
    rondo.adjustments[0]='V skupine 3–6 bráni každý 35 s v každej sérii. V skupine 7–8 má každý dve obranné roly po 20 s v sérii. Výmena podľa čísel na signál, nie po chybe.';
    for(let size=3;size<=8;size++){
      const defenders=size>=7?2:1,play=defenders===2?20:35,rest=size===3?35:size===4?25:size===5?15:10,buffer=270-size*(play+rest);
      const rows=Array.from({length:size},(_,i)=>{const ds=[i+1,...(defenders===2?[(i+1)%size+1]:[])];return[String(i+1),ds.join(', '),Array.from({length:size},(_,j)=>j+1).filter(p=>!ds.includes(p)).join(', '),`${play} s / ${rest} s`];});
      rondo.tables.push({groupSize:size,caption:`${size-defenders} na ${defenders} · séria 4:30, po poradí ešte ${buffer} s oddych. Obe série rovnako.`,headers:['Kolo',defenders===1?'Obranca':'Obrancovia','Prihrávajú','Práca / oddych'],rows});
      rondo.rotation.push({size,rounds:size,playSeconds:play,restSeconds:rest,bufferSeconds:buffer,defenders});
    }
    zones.dose='90 s ukážka + 6 dvojminútových kôl + 5 × 30 s medzi kolami = 16 min. Skupina 3: 60 s hra / 60 s oddych; 4: 80 / 40 s; 5–8: 90 / 30 s.';
    zones.steps=[
      '18:36–18:37:30 ukážka. Kolá: 18:37:30–18:39:30; 18:40–18:42; 18:42:30–18:44:30; 18:45–18:47; 18:47:30–18:49:30; 18:50–18:52. Medzi kolami 30 s prestávka.',
      'Bod za kontrolované vedenie do súperovej zóny alebo prihrávku spoluhráčovi do nábehu. V zóne sa nečaká natrvalo.',
      'Neutrálny pomáha tímu s loptou a sám neboduje. Skupina 3 hrá 1 na 1 + N; 4–6 hrá 2 na 2 s prípadnými N; 7–8 hrá 3 na 3 + 1 alebo 2 N.',
      'Neutrálne roly meň podľa tabuľky. Pri 7 hráčoch sa N mení aj po 45 s hry, aby sa vystriedali všetci. Ostatní vytvoria dve rovnako veľké družstvá.',
      'V skupine 3 je 60 s hra + 60 s oddych, v skupine 4 je 80 + 40 s, v skupinách 5–8 je 90 + 30 s. Neutrálny počas hry pracuje; jeho rola nie je oddych.'
    ];
    zones.tables=[];zones.variantNotes={};games.variantNotes={};
    for(let size=3;size<=8;size++){
      const form=this.form(size),neutralAt=round=>Array.from({length:form.neutral},(_,j)=>(round*form.neutral+j)%size+1);
      zones.tables.push({groupSize:size,caption:`Skupina ${size}: ${form.label}`,headers:['Kolo','Neutrálni','Ostatní'],rows:Array.from({length:6},(_,i)=>[String(i+1),size===7?`0–45 s: ${neutralAt(2*i).join(', ')}; 45–90 s: ${neutralAt(2*i+1).join(', ')}`:form.neutral?neutralAt(i).join(', '):'Bez N',`Dve družstvá po ${form.team}; ${size===3?'60 / 60':size===4?'80 / 40':'90 / 30'} s hra / oddych.`])});
      zones.variantNotes[size]=`Skupina ${size}: ${form.label}. Každý absolvuje ${size===3?6:size===4?8:9} min hry. Pri N rozdávaj neutrálne roly podľa poradia, aby sa vystriedali všetci.`;
      games.variantNotes[size]=size===3?'1 na 1 + N. V každom 4-minútovom úseku 2 min hry a 2 min oddychu; N meň po 1 min hry. Spolu každý 8 min hry.':`${form.label}. Štyri úseky po 4 min hry; spolu 16 min. ${form.neutral?'N meň po 2 min hry, postupne po '+form.neutral+'.':'Bez neutrálnych.'}`;
    }
    games.steps=[
      `18:52–18:53 organizácia. Úseky 18:53–18:57, 18:58–19:02, 19:03–19:07 a 19:08–19:12; medzi nimi 1 min voda. Skupiny zostávajú na plochách ${gameLength} × ${gameWidth} m.`,
      'Ponechaj 4 rohové méty na každej ploche. Štyri zónové méty presuň na dve 2 m široké kužeľové bránky v strede koncových čiar.',
      'Hernú formu vyberá veľkosť skupiny: 3 = 1 na 1 + N; 4–6 = 2 na 2 s prípadnými N; 7–8 = 3 na 3 + 1 alebo 2 N. Gól po presnej prízemnej prihrávke cez súperovu bránku, N sám neboduje.',
      'Skupina 3: v každom úseku 2 min hry a 2 min oddychu, N meň každú minútu hry. Ostatné skupiny: 4 min hry, N meň každé 2 min hry podľa poradia. Pri dvoch N sa mení dvojica.',
      'Prvé dva úseky môže byť gól po prihrávke a opätovnej ponuke za 2 body. Posledné dva úseky bežné skórovanie, minimum pokynov.',
      'Po lopte mimo začni prihrávkou alebo vedením, súper približne 2 m od lopty. Cudziu loptu v priechode zastaví tréner. V prestávke voda a jeden krátky podnet.'
    ];
    games.dose='1 min organizácia + 4 úseky po 4 min + 3 × 1 min voda = 20 min. Skupina 3: v úseku 2 min hra / 2 min oddych; ostatní 4 min hra.';
    games.summary='Herná forma podľa skupiny: 1 na 1, 2 na 2 alebo 3 na 3 s neutrálnou podporou podľa počtu. Prihrávka, nový uhol a presné zakončenie po zemi.';
    games.adjustments[0]=`Všetky štyri plochy majú ${gameLength} × ${gameWidth} m. Skupiny zostávajú na svojich plochách; používaj formu podľa ich skutočného počtu.`;
    games.adjustments[1]='Neutrálni zostávajú aktívni a nebodujú. Pri 3 hráčoch sa N mení po 1 min hry a v úseku sú 2 min hry/2 min oddychu; pri väčších skupinách výmena N po 2 min hry.';
    games.tables=[{caption:'Štyri súčasné hry podľa dochádzky; N pomáha tímu s loptou',headers:['Detí spolu',...labels],rows:t.attendanceCases.map(c=>[String(c.total),...c.groups.map(size=>`${this.form(size).label} = ${size}`)])}];
    const teamTotal=groups.reduce((sum,size)=>sum+this.form(size).team,0),neutralTotal=config.players-2*teamTotal;
    t.equipment[0].quantity=`${config.players} + 4 rezervné = ${config.players+4} lôpt`;
    t.equipment[1].quantity='32 pracovných + 8 rezervných = 40 mét';
    t.equipment[3].quantity=`${teamTotal} svetlých + ${teamTotal} tmavých${neutralTotal?' + '+neutralTotal+' odlišných pre N':''}`;
    t.equipment[3].detail='Družstvá a neutrálni majú odlišné farby; pri zmene roly si hráči odovzdajú rozlišovačku.';
    t.notes[0].text=`Vybraných ${config.players} detí bez brankárov. Štyri skupiny ${groups.join(' + ')}; jednotlivé formy, dávky a rotácie sa prispôsobujú veľkosti skupiny. Počet možno meniť od 14 do 30.`;
    t.notes[1].text=layout.assumption+' '+layout.stages['football-pass'].instructions+' '+layout.stages['football-zones'].instructions;
    t.notes[3].text='Ukážka je jedna možnosť riešenia. Vyber konkrétnu skupinu A1/A2/B1/B2; nákres, počet aj návod sa zosúladia. Animácia nemení tréningový časovač.';
    t.notes.unshift({title:'Organizácia podľa aktuálnych podmienok',text:t.organizationNotes.join(' ')});
    t.sources.push({label:'FIFA Training Centre: zmena počtu hráčov a priestoru',url:'https://www.fifatrainingcentre.com/en/practice/grassroots/8-to-12/different-pitches.php'});
    t.sources.push({label:'The FA: primerané výzvy podľa aktuálnych zručností',url:'https://www.thefa.com/bootroom/resources/coaching/how-to-challenge-all-the-players-in-your-coaching-session'});
    return t;
  }
};

const TrainingLibrary = {
  topics:{passing:'Prihrávky',touch:'Prvý dotyk',movement:'Pohyb bez lopty',dribbling:'Vedenie lopty a kľučky',duels:'Súboje 1 na 1',decisions:'Rozhodovanie a prečíslenie',buildout:'Rozohrávka',coordination:'Koordinácia a rýchlosť',games:'Malé hry',finish:'Záver a reflexia'},
  tags:{'football-warmup':['dribbling','passing','movement'],'football-pass':['passing','touch','movement'],'football-rondo':['passing','touch','decisions'],'football-zones':['passing','movement','decisions'],'football-mini-games':['games','passing','movement'],'football-finish':['finish'],warmup:['dribbling','passing'],'duel-no-keeper':['duels','dribbling'],'two-one-no-keeper':['decisions','passing'],'two-two-no-keeper':['games','decisions'],'two-matches-no-keeper':['games'],finish:['finish'],coordination:['coordination','dribbling'],'sprint-jump':['coordination'],target:['buildout','passing','movement'],buildout:['buildout','passing','decisions'],match:['games','buildout']},
  items(trainings){return trainings.flatMap(training=>training.blocks.map(block=>({training,block,topics:this.tags[block.diagram]||[]})));},
  text(value){return value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('sk');},
  filter(trainings,{topic='',query='',mode='trainings'}={}){
    const match=item=>(!topic||item.topics.includes(topic))&&(!query||this.text(`${item.training.title} ${item.block.title} ${item.training.date} ${item.training.date.split('-').reverse().join('.')} ${item.topics.map(key=>this.topics[key]).join(' ')}`).includes(this.text(query)));
    const items=this.items(trainings).filter(match);
    return mode==='drills'?items:trainings.filter(training=>items.some(item=>item.training.id===training.id)).sort((a,b)=>b.date.localeCompare(a.date));
  }
};
