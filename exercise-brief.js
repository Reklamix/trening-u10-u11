'use strict';

// Presentation of the approved exercise variants; no changes to the saved session.
const ExerciseBrief = {
  slogans:{'football-warmup':'Malé dotyky, hlava hore.','football-pass':'Prihraj a ukáž sa znova.','football-rondo':'Ukáž sa vedľa obrancu.','football-zones':'Prihraj do pohybu.','football-mini-games':'Prihraj, ponúkni sa, zakonči.','football-finish':'Čo sa ti dnes podarilo?'},
  build(training,block,index=0){
    if(!training?.planConfig||!this.slogans[block.diagram])return null;
    const config=training.planConfig,key=block.diagram,warm=key==='football-warmup',finish=key==='football-finish',labels=['A1','A2','B1','B2'];
    const areas=FootballScenes.groups(key,config.players,training.quarterPitch),area=areas[index]||areas[0],n=area?.count||config.players,groupIndex=area?.index||0;
    const variant=TrainingPlanner.forGroup(training,block,groupIndex),level=config.levels[groupIndex],form=TrainingPlanner.form(n),round=key==='football-rondo'?block.rotation.find(r=>r.size===n):null;
    const pairs=size=>size===2?'1 dvojica':size===3?'1 trojica':size%2?`${(size-3)/2} ${size===5?'dvojica':'dvojice'} a 1 trojica`:`${size/2} dvojice`;
    const steps={
      'football-warmup':['2 min rozhýbanie: ľahký pohyb, členky, bedrá a zmeny smeru.','3 min vedenie: každý vlastnú loptu, krátke dotyky, zmena smeru a zrýchlenie do voľna.','Potom 3 × 60 s prihrávky v dvojiciach/trojici v rámci svojej skupiny. Žiadne čakajúce rady.'],
      'football-pass':level==='base'?[`Rozdelenie ${n} detí: ${pairs(n)}. Každá podskupina má vlastnú loptu.`,'Prihrávka na 3–4 m. Prijmi vnútornou stranou a priprav loptu pred seba.',n%2?'V trojici poradie 1 → 2 → 3 → 1. Bez povinného behu po prihrávke.':'Dvojice zostávajú na svojich miestach. Prihraj naspäť po pripravení lopty.']:[`Očísluj ${n} hráčov. Lopta ide 1 → 2 → … → ${n} → 1.`,'Pred prijatím sa pozri. Prvým dotykom si priprav ďalšiu prihrávku.','Po prihrávke vytvor nový voľný uhol; nestoj za príjemcom.'],
      'football-rondo':[`${round?.defenders===2?'Dvaja obrancovia':'Jeden obranca'} vnútri, ostatní prihrávajú okolo nich.`,'Hľadaj voľného spoluhráča. Bod za 3 prihrávky.','Po zisku obnov hru s rovnakými rolami. Obrancovia sa menia až na signál podľa čísel.'],
      'football-zones':[`Dve družstvá po ${form.team}${form.neutral?` + ${form.neutral} N. Neutrálni pomáhajú tímu s loptou.`:'.'}`,'Bod za kontrolované vedenie do súperovej zóny alebo príjem prihrávky do nábehu.','V zóne sa nečaká natrvalo. N sám neboduje; roly meň podľa tabuľky.'],
      'football-mini-games':[`Dve družstvá po ${form.team}${form.neutral?` + ${form.neutral} N, ktorí pomáhajú tímu s loptou.`:'.'}`,'Gól prízemnou prihrávkou cez súperovu 2 m širokú kužeľovú bránku. N sám neboduje.','Po lopte mimo začni prihrávkou alebo vedením; súper približne 2 m od lopty.',variant.steps[4]],
      'football-finish':block.steps
    }[key];
    if(n===2&&key==='football-rondo')steps.splice(0,steps.length,'Obaja sú spoluhráči. Pri dvoch hráčoch pracujte bez obrancu.','Prihraj po zemi, priprav si prvý dotyk a vytvor nový uhol.','2 kolá po 60 s práce / 60 s oddychu a potom 30 s oddych. Obe série rovnako.');
    if(n===2&&key==='football-zones')steps.splice(0,steps.length,'Hrajte 1 na 1 bez neutrálneho. Bod za kontrolované vedenie do súperovej zóny.','Po zisku sa mení smer útoku; v zóne sa nečaká natrvalo.','6 kôl po 60 s hry a 60 s oddychu. Medzi kolami navyše 30 s.');
    if(n===2&&key==='football-mini-games')steps.splice(0,steps.length,'Hrajte 1 na 1 bez neutrálneho. Bod za kontrolované prevedenie cez súperovu bránku.','Po lopte mimo začni vedením; súper približne 2 m od lopty.','4 úseky po 2 min hry a 2 min oddychu; medzi úsekmi 1 min voda.','Gól za 1, bez povinnej prihrávky alebo kombinácie.');
    const shortInstruction={
      'football-warmup':'Každý vedie svoju loptu, mení smer a sleduje voľný priestor.',
      'football-pass':level==='base'?'Prijmi loptu, priprav si ju a prihraj po zemi.':'Pozri sa pred prijatím. Prihraj a hneď sa znovu ponúkni.',
      'football-rondo':n===2?'Prihraj spoluhráčovi a ukáž sa v inom uhle.':'Ponúkni sa vedľa obrancu a prihraj voľnému spoluhráčovi.',
      'football-zones':n===2?'Veď loptu do súperovej zóny. Po zisku zmeň smer.':'Prihraj do nábehu alebo veď loptu do súperovej zóny.',
      'football-mini-games':n===2?'Preveď loptu cez súperovu kužeľovú bránku.':'Prihraj, znovu sa ponúkni a zakonči po zemi.',
      'football-finish':'Pokojná chôdza, voda a jedna otázka deťom.'
    }[key];
    let work='',rest='',rotation='';
    if(warm){work='2 min rozhýbanie + 3 min vedenie + 3 × 60 s prihrávky.';rest='Medzi prihrávkami 2 × 30 s oddych; na konci 1 min voda.';rotation='Dvojice a prípadná trojica zostávajú v rámci budúcich skupín A1/A2/B1/B2.';}
    if(key==='football-pass'){work='1 min ukážka + 3 × 3 min práce.';rest='Medzi sériami 2 × 30 s; na konci 1 min voda.';rotation=level==='base'?'Každá dvojica/trojica pracuje súčasne s vlastnou loptou.':`Celý obeh cez všetkých ${n} hráčov; v tretej sérii môže ísť poradie opačne.`;}
    if(round){work=`2 série po 4:30. V každom kole ${round.playSeconds} s práce.`;rest=`Po kole ${round.restSeconds} s oddych.${round.bufferSeconds?' Po celom poradí ešte '+round.bufferSeconds+' s v každej sérii.':''} Medzi sériami 1 min voda, na konci 2 min voda/presun.`;rotation=`${round.rounds} kôl v sérii, ${round.defenders===1?'jeden obranca':'dvaja obrancovia'} naraz. Meň na signál, nie po chybe.`;}
    if(key==='football-zones'){const play=n<=3?60:n===4?80:90;work=`90 s ukážka, potom 6 dvojminútových kôl; v každom ${play} s hry.`;rest=`V každom kole ${120-play} s oddych; medzi kolami navyše 5 × 30 s.`;rotation=n===7?'N sa mení aj po 45 s hry; postupuj podľa tabuľky.':form.neutral?'Neutrálnych meň podľa poradia v tabuľke. Neutrálna rola je práca.':'Bez neutrálnych; dve rovnako veľké družstvá.';}
    if(key==='football-mini-games'){work=`1 min organizácia + 4 úseky po 4 min.${n<=3?' V úseku 2 min hry a 2 min oddychu; spolu 8 min hry.':' Spolu 16 min hry.'}`;rest=`Medzi úsekmi 3 × 1 min voda.${n<=3?' Dvojminútový oddych vnútri úseku platí pre celú túto skupinu.':''}`;rotation=form.neutral?`N meň po ${n<=3?1:2} min hry${form.neutral===2?' po dvojiciach':''}. Neutrálna rola nie je oddych.`:'Bez neutrálnych; tímy zostávajú na svojej ploche.';}
    if(round&&n===2)rotation='Dvojica bez obrancu a bez čakajúcich; obaja prihrávajú, obaja oddychujú. 2 kolá v každej sérii.';
    if(finish){work='3 min pokojný záver.';rest='Chôdza a voda; bez ďalšej povinnej záťaže.';rotation='Celé mužstvo pri trénerovi.';}
    const glance={work:'',rest:'',workHint:'',restHint:''};
    if(warm)Object.assign(glance,{work:'8 min',rest:'2 × 30 s',restHint:'+ 1 min voda'});
    if(key==='football-pass')Object.assign(glance,{work:'3 × 3 min',rest:'2 × 30 s',restHint:'+ 1 min voda'});
    if(round)Object.assign(glance,{work:`${round.playSeconds} s`,rest:`${round.restSeconds} s`,workHint:'v jednom kole',restHint:'po kole'});
    if(key==='football-zones')Object.assign(glance,{work:`6 × ${n<=3?60:n===4?80:90} s`,rest:`${n<=3?60:n===4?40:30} s`,restHint:'+ 5 × 30 s medzi kolami'});
    if(key==='football-mini-games')Object.assign(glance,{work:`4 × ${n<=3?2:4} min`,rest:n<=3?'2 min / úsek':'3 × 1 min',restHint:n<=3?'+ 3 × 1 min voda':'voda medzi úsekmi'});
    if(finish)Object.assign(glance,{work:'3 min',rest:'Voda',restHint:'pokojná chôdza'});
    const ballsFor=(size,i)=>warm?size:key==='football-pass'&&config.levels[i]==='base'?Math.floor(size/2):finish?0:1;
    const ballsLocal=ballsFor(n,groupIndex),ballsTotal=warm?config.players:config.groupSizes.reduce((sum,size,i)=>sum+ballsFor(size,i),0),conesLocal=block.coneSetup?.perArea||0,conesTotal=conesLocal*(block.coneSetup?.areas||0);
    const kit=finish?['Vlastná voda pre každé dieťa.','Použité pomôcky pozbierajte až po zastavení činnosti a na pokyn trénera.']:[`Lopty: ${ballsLocal} v zobrazenej ${warm?'zóne':'skupine'}, ${ballsTotal} spolu + 4 rezervné.`,`Méty/kužele: ${conesLocal} na plochu, ${conesTotal} spolu.`];
    if(key==='football-rondo')kit.push(`Rozlišovačky pre obrancov: ${round.defenders} v tejto skupine, ${config.groupSizes.reduce((sum,size)=>sum+(size===2?0:size>=7?2:1),0)} spolu.`);
    if(['football-zones','football-mini-games'].includes(key)){const teamTotal=config.groupSizes.reduce((sum,size)=>sum+TrainingPlanner.form(size).team,0),neutralTotal=config.players-2*teamTotal;kit.push(`Rozlišovačky tu: ${form.team} svetlých + ${form.team} tmavých${form.neutral?' + '+form.neutral+' odlišných pre N':''}. Spolu ${teamTotal} + ${teamTotal}${neutralTotal?' + '+neutralTotal+' pre N':''}.`);}
    if(key==='football-mini-games')kit.push('2 kužeľové bránky na plochu, 8 spolu. Ich 16 kužeľov je už súčasťou uvedených 32.');
    if(!finish)kit.push('Stopky, píšťalka/signál a vlastná voda pre každého.');
    const visualKit=finish?[]:[{kind:'ball',title:'Lopty',value:`${ballsTotal} + 4 rezervné`,detail:`${ballsLocal} v zobrazenej ${warm?'zóne':'skupine'}.`,local:ballsLocal,total:ballsTotal,reserve:4},{kind:'cone',title:'Méty a kužele',value:`${conesTotal} spolu`,detail:`${conesLocal} na jednu plochu.`,local:conesLocal,total:conesTotal}];
    if(round){const total=config.groupSizes.reduce((sum,size)=>sum+(size===2?0:size>=7?2:1),0);visualKit.push({kind:'bibs',title:'Rozlišovačky pre obrancov',value:`${total} spolu`,detail:`${round.defenders} v tejto skupine.`,local:round.defenders,total});}
    if(['football-zones','football-mini-games'].includes(key)){const teams=config.groupSizes.reduce((sum,size)=>sum+TrainingPlanner.form(size).team,0),neutrals=config.players-2*teams;visualKit.push({kind:'bibs',title:'Rozlišovačky',value:`${config.players} spolu`,detail:`Tu: ${form.team} svetlé + ${form.team} tmavé${form.neutral?' + '+form.neutral+' pre N':''}. Spolu: ${teams} svetlých + ${teams} tmavých${neutrals?' + '+neutrals+' pre N':''}.`,local:n,total:config.players});}
    if(key==='football-mini-games')visualKit.push({kind:'gates',title:'Kužeľové bránky',value:`${areas.length*2} spolu`,detail:'2 na plochu, široké 2 m. Vytvor ich zo 16 kužeľov, ktoré sú už v uvedených 32 métach.',local:2,total:areas.length*2,conesIncluded:16});
    if(!finish)visualKit.push({kind:'timer',title:'Stopky / časovač',value:'Pre trénera',detail:'Meranie práce a oddychu.'},{kind:'signal',title:'Píšťalka / signál',value:'Pre trénera',detail:'Dohodnutý signál na zmenu rolí.'});
    visualKit.push({kind:'water',title:'Voda',value:`Pre ${config.players} detí`,detail:'Každý vlastnú vodu.'});
    let notes=[...new Set(variant.adjustments.filter(text=>text!==variant.skillTask))].filter(text=>form.neutral||!text.startsWith('Neutrálni')).slice(0,3);
    if(warm){const tasks={base:'Prihrávky na 3–4 m, prijmi a priprav loptu bez tlaku.',standard:'Prvý dotyk do voľna a ponuka po prihrávke.',challenge:'Rozhľad pred prijatím a prihrávka po pohybe.'};notes=[groupIndex*2,groupIndex*2+1].map(i=>`${labels[i]} · ${TrainingPlanner.levels[config.levels[i]]}: ${tasks[config.levels[i]]}`);}
    if(finish)notes=['Jedna konkrétna pochvala za pozorovanú snahu alebo dobré rozhodnutie. Žiadne dodatočné opakovania.'];
    const coaches=warm?(config.coaches===1?['Jeden tréner vedie obe zóny rovnakou úlohou a spoločným signálom.']:config.coaches===2?['Tréner 1: zóna A (A1/A2).','Tréner 2: zóna B (B1/B2).']:config.coaches===3?['Tréner 1: zóna A; tréner 2: zóna B.','Tréner 3: pomôcky a pomoc s organizáciou.']:['Tréneri 1 a 2: zóna A.','Tréneri 3 a 4: zóna B.']):finish?[]:training.organizationNotes.filter(text=>text.startsWith('Tréner'));
    const groups=config.groupSizes.map((size,i)=>`${labels[i]} · ${size} detí · ${TrainingPlanner.levels[config.levels[i]]}`);
    return{title:block.title,shortInstruction,selection:finish?`Celé mužstvo · ${config.players} detí`:`Ukážka ${area.label} · ${n} z ${config.players} detí${warm?'':' · '+variant.skillLabel}`,description:variant.skillTask||block.summary,steps,space:finish?'Pokojné miesto pri ihrisku mimo prebiehajúcej hry.':`${areas.length} ${warm?'zóny':'plochy'} po ${area.length} × ${area.width} m. Dostupný priestor ${config.width} × ${config.height} m.`,grouping:finish?'Všetci pri trénerovi.':warm?areas.map(a=>`${a.label}: ${a.count} detí`).join(' · '):`${area.label}: ${n} detí${['football-zones','football-mini-games'].includes(key)?' · '+form.label:round?n===2?' · dvojica bez obrancu':' · '+(n-round.defenders)+' na '+round.defenders:''}.`,groups:finish?[]:groups,coaches,spacing:finish?'': 'Medzi plochami aspoň 3 m voľna, po obvode aspoň 2 m.',work,rest,rotation,glance,notes,kit,visualKit,kitNotes:finish?[kit[1]]:[],conePlacement:block.coneSetup?.placement||'',slogan:n===2&&key==='football-rondo'?'Prijmi, prihraj a ukáž sa.':n===2&&['football-zones','football-mini-games'].includes(key)?'Nájdi voľnú cestu.':key==='football-pass'&&level==='base'?'Prijmi a prihraj po zemi.':this.slogans[key],ballsLocal,ballsTotal,conesLocal,conesTotal,round};
  }
};
