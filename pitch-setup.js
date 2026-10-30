'use strict';

const PitchSetupPlan = {
  supports(training) {
    return training?.id === '2026-10-29' && ['football-warmup','football-pass','football-zones','football-mini-games'].every(key => training.quarterPitch?.stages?.[key]?.areas?.length);
  },
  build(training) {
    if (!this.supports(training)) throw Error('No setup plan for this training');
    const layout = training.quarterPitch;
    const snapshot = (key, cornersOnly = false) => {
      const areas = layout.stages[key].areas;
      const cones = areas.flatMap((area, index) => {
        const scene = FootballScenes.build(key, { total:20, size:5, pitchIndex:index, area });
        return scene.cones.filter(cone => !cornersOnly || cone.kind === 'corner').map(cone => ({
          ...FootballScenes.mapPoint(area, scene.pitch, cone), area:area.label, kind:cone.kind
        }));
      });
      return { key, areas, cones, cornersOnly };
    };
    const instructions = [
      {
        when:'Pred 18:00', title:'Rozlož 8 rohových kužeľov',
        action:'Vyznač dve zóny 21 × 14 m. Do každého rohu polož jednu métu. Medzi zónami nechaj 3 m a po obvode 2 m voľna.',
        kit:'Bokom priprav 4 balíčky po 6 mét pre A1, A2, B1 a B2. V každom sú 2 budúce rohové + 4 zónové méty. Spolu potrebuješ 32: 8 rozložených + 24 v balíčkoch.',
        extra:'Balíčky a rezervné lopty nechaj mimo pracovných plôch a voľných priechodov. Na rozohriatie nerozkladaj ďalšie méty do vnútra zón.',
        coach:'Tréner 1 pripraví ľavú zónu A, tréner 2 pravú B. Každé dieťa začína s vlastnou loptou.',
        map:snapshot('football-warmup')
      },
      {
        when:'18:09–18:10 · voda', title:'Rozdeľ zóny na štyri plochy',
        action:'Presuň pôvodných 8 rohov o 1 m dovnútra: ľavé rohy doprava, pravé doľava. Z každého balíčka pridaj 2 rohové méty. Vzniknú A1, A2, B1 a B2, každá 12 × 9 m.',
        extra:'Medzi hornou a dolnou dvojicou zostáva 3 m voľna. Prihrávky aj rondo využijú toto isté rozloženie; medzi nimi sa nič nepresúva.',
        coach:'Každý tréner presunie 4 pôvodné rohy a pridá 4 nové na svojej polovici. Deti počas prípravy pijú a potom prejdú do skupín.',
        map:snapshot('football-pass')
      },
      {
        when:'18:34–18:36 · voda a presun', title:'Rozšír každú plochu na 14 × 9 m',
        action:'Na všetkých štyroch plochách presuň ľavé rohy o 1 m doľava a pravé o 1 m doprava. Presúva sa spolu 16 rohových mét; ďalšie zatiaľ nepridávaj.',
        extra:'Výška 9 m zostáva. Zachovaj 3 m priechody medzi plochami aj 2 m voľný obvod.',
        coach:'Tréner 1 upraví A1 a A2, tréner 2 B1 a B2. Tento krok aj nasledujúci urobte počas tej istej dvojminútovej prestávky.',
        map:snapshot('football-zones', true)
      },
      {
        when:'Tá istá prestávka · do 18:36', title:'Pridaj hranice koncových zón',
        action:'Z každého balíčka vezmi zostávajúce 4 méty. Na každej ploche vyznač zónu 2 m od ľavého a 2 m od pravého konca: vždy dve méty na protiľahlých bočných čiarach.',
        extra:'Každá plocha má 4 rohové + 4 zónové méty. Koncové zóny sú hlboké 2 m, stredná časť má 10 × 9 m.',
        coach:'Každý tréner pridá 8 mét na svojich dvoch plochách. Všetkých 32 mét je teraz rozložených.',
        map:snapshot('football-zones')
      },
      {
        when:'18:52–18:53 · organizácia minihier', title:'Zo zónových mét sprav bránky',
        action:'Rohové méty nechaj na mieste. Štyri zónové méty na každej ploche presuň do stredu oboch koncových čiar: dve na ľavú a dve na pravú. Každá bránka má šírku 2 m.',
        extra:'Na každom ihrisku zostáva 8 mét: 4 rohové + 4 bránkové. Osem kužeľových bránok je už súčasťou rozložených 32 mét; ďalšie netreba.',
        coach:'Každý tréner presunie 8 zónových mét na svojich dvoch ihriskách. Skupiny zostávajú na rovnakých plochách 14 × 9 m.',
        map:snapshot('football-mini-games')
      }
    ];
    if(layout.dynamic){
      const warm=layout.stages['football-warmup'].areas[0],pass=layout.stages['football-pass'].areas[0],game=layout.stages['football-zones'].areas[0];
      instructions[0].action=`Vyznač dve zóny ${warm.length} × ${warm.width} m podľa nákresu. Do každého rohu polož jednu métu. Priechody nechaj aspoň 3 m a obvod aspoň 2 m voľný.`;
      instructions[1].action=`Pôvodných 8 rohov presuň podľa šípok do rohov nových plôch a pridaj ďalších 8 rohových mét. Vzniknú štyri plochy ${pass.length} × ${pass.width} m.`;
      instructions[2].title=`Rozšír plochy na ${game.length} × ${game.width} m`;
      instructions[2].action=`Na každej ploche presuň ľavé rohy o 1 m doľava a pravé o 1 m doprava. Nový rozmer je ${game.length} × ${game.width} m, spolu presuň 16 mét.`;
      instructions[2].extra=`Šírka ${game.width} m zostáva. Zachovaj voľné priechody aspoň 3 m a obvod aspoň 2 m.`;
      instructions[3].extra=`Každá plocha má 4 rohové + 4 zónové méty. Zóny sú hlboké 2 m; stredná časť má ${game.length-4} × ${game.width} m.`;
      instructions[4].coach=`Skupiny zostávajú na plochách ${game.length} × ${game.width} m; 16 zónových mét sa použije na bránky.`;
    }
    if(training.planConfig&&training.planConfig.coaches!==2){
      for(const step of instructions)step.coach=training.organizationNotes.join(' ')+' Presuny robte počas uvedených prestávok na vodu.';
      instructions[0].coach=training.planConfig.coaches===1?'Jeden tréner vedie obe zóny rovnakou úlohou a spoločným signálom. Balíčky priprav vopred; A sa neskôr rozdelí na A1/A2 a B na B1/B2.':training.planConfig.coaches===3?'Tréner 1 vedie zónu A, tréner 2 zónu B, tréner 3 pripraví pomôcky a pomáha s organizáciou. Po rozdelení plôch platí rozdelenie z Prehľadu.':'Tréneri 1 a 2 vedú A, tréneri 3 a 4 vedú B. Neskôr má každý svoju skupinu A1/A2/B1/B2.';
    }
    let previous = [];
    for (const step of instructions) {
      const remaining = new Set(step.map.cones);
      const kept = [], moves = [];
      const compatible = (from, to) => to.area === from.area || (from.area.length === 1 && to.area.startsWith(from.area));
      // Reserve unchanged positions first; then pair moved cones inside their own group.
      const pending = previous.filter(from => {
        const same = [...remaining].find(to => compatible(from,to) && Math.hypot(to.x-from.x,to.y-from.y)<1e-8);
        if (!same) return true;
        remaining.delete(same); kept.push(same); return false;
      });
      for (const from of pending) {
        const to = [...remaining].filter(candidate => compatible(from,candidate)).sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y))[0];
        if (!to) throw Error('Setup loses an existing cone');
        remaining.delete(to); moves.push({ from, to });
      }
      step.kept=kept; step.moves=moves; step.added=[...remaining]; step.total=step.map.cones.length; step.stored=32-step.total;
      previous=step.map.cones;
    }
    return { layout, steps:instructions };
  },
  forExercises(training){
    const {layout,steps}=this.build(training),[warm,pass,expand,zones,games]=steps;
    const unchanged=(step,action)=>({...step,moves:[],added:[],kept:step.map.cones,action,coach:training.organizationNotes.join(' '),extra:'Rozloženie z predchádzajúceho cvičenia zostáva. Méty nepridávaj ani nepresúvaj.'});
    const views=[warm,pass,unchanged(pass,'Nechaj štyri plochy z prihrávok. Na rondo netreba presunúť žiadne kužele.'),{...zones,moves:expand.moves,kept:expand.kept,action:expand.action+' '+zones.action,coach:expand.coach.replace('Tento krok aj nasledujúci urobte','Úpravu rohov aj pridanie zónových mét urobte')},games,{...unchanged(games,'Zastav hru. Deti prejdú k trénerovi na pokojný záver. Pomôcky zbierajte až na pokyn, mimo prebiehajúcej hry.'),coach:'Celé mužstvo prejde k trénerovi. Pred zberom pomôcok zastavte všetky hry.'}];
    const names=['Rozohriatie','Prihrávky','Rondo','Koncové zóny','Minihry','Záver'];
    const start=training.startTime.split(':').map(Number),at=offset=>{const minutes=start[0]*60+start[1]+offset;return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;};
    return{layout,steps:views.map((step,index)=>({...step,blockId:training.blocks[index].id,title:names[index],when:`${at(training.blocks[index].start)}–${at(training.blocks[index].end)}`,shortAction:index===0?`Vyznač dve zóny ${warm.map.areas[0].length} × ${warm.map.areas[0].width} m. Rozlož 8 rohových kužeľov; priechod 3 m a obvod 2 m nechaj voľný.`:index===1?`Presuň ${pass.moves.length} pôvodných rohov podľa šípok a pridaj ${pass.added.length} mét. Štyri plochy ${pass.map.areas[0].length} × ${pass.map.areas[0].width} m.`:index===3?`Presuň ${expand.moves.length} rohov podľa šípok a pridaj ${zones.added.length} zónových mét: vždy 2 m od oboch koncov. Štyri plochy ${zones.map.areas[0].length} × ${zones.map.areas[0].width} m.`:index===4?`Rohy nechaj. Presuň ${games.moves.length} zónových mét na osem bránok širokých 2 m.`:step.action}))};
  }
};

const PitchSetupMotion = {
  create(step) {
    const groups=step.map.areas.map(area=>area.label).filter(area=>step.moves.some(move=>move.to.area===area)||step.added.some(point=>point.area===area));
    return {
      groups,duration:groups.length*4+2,
      moves:step.moves.map(move=>({...move,start:groups.indexOf(move.to.area)*4+.4,end:groups.indexOf(move.to.area)*4+2.6})),
      added:step.added.map(point=>{const start=groups.indexOf(point.area)*4+(step.moves.some(move=>move.to.area===point.area)?2.8:.5);return{point,start,end:start+.7};})
    };
  },
  sample(plan,time) {
    const t=Math.max(0,Math.min(plan.duration,time)),unit=(start,end)=>Math.max(0,Math.min(1,(t-start)/(end-start)));
    const area=plan.groups[Math.min(plan.groups.length-1,Math.floor(t/4))];
    return {
      area,complete:t>=plan.duration,
      phase:plan.moves.some(move=>move.to.area===area&&t<move.end)?'presun':plan.added.some(item=>item.point.area===area&&t<item.end)?'pridanie':'kontrola',
      moves:plan.moves.map(move=>{const u=unit(move.start,move.end);return{x:move.from.x+(move.to.x-move.from.x)*u,y:move.from.y+(move.to.y-move.from.y)*u};}),
      added:plan.added.map(item=>unit(item.start,item.end))
    };
  }
};

// PITCH_SETUP_BROWSER
(() => {
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const svg=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
  let active=null;
  function close(){if(active?.open)active.close();}
  function open(training,blockId){
    close();window.FootballBoard?.pause();
    const {layout,steps}=PitchSetupPlan.forExercises(training),returnFocus=document.activeElement;
    const dialog=el('dialog','pitch-setup');dialog.setAttribute('aria-labelledby','setup-title');
    const header=el('header','setup-header'),title=el('h2','','Príprava ihriska');title.id='setup-title';
    const dismiss=el('button','setup-close','← Späť');dismiss.type='button';dismiss.setAttribute('aria-label','Zavrieť prípravu');dismiss.addEventListener('click',close);
    header.append(title,dismiss);
    const nav=el('nav','setup-exercise-tabs');nav.setAttribute('aria-label','Príprava pre cvičenie');
    steps.forEach((step,value)=>{const button=el('button','',`${value+1} · ${step.title}`);button.type='button';button.dataset.setupExercise=value;button.addEventListener('click',()=>{index=value;render();});nav.append(button);});
    const body=el('div','setup-body'),footer=el('footer','setup-footer');
    let index=Math.max(0,steps.findIndex(step=>step.blockId===blockId));
    function render(){
      const step=steps[index],scrollTop=body.scrollTop,detailsOpen=Boolean(body.querySelector('.setup-details')?.open),actionHeight=body.querySelector('.setup-action')?.getBoundingClientRect().height||0,detailsHeight=body.querySelector('.setup-details')?.getBoundingClientRect().height||0;body.replaceChildren();footer.replaceChildren();
      for(const button of nav.children)button.setAttribute('aria-pressed',String(Number(button.dataset.setupExercise)===index));
      const progress=el('p','setup-progress',`${index+1} / ${steps.length} · ${step.when}`);progress.setAttribute('role','status');
      body.append(progress,el('h3','setup-step-title',step.title));
      const facts=el('div','setup-facts');
      for(const[name,value]of[['Po kroku',step.total],['Pridaj',step.added.length],['Presuň',step.moves.length],['Bokom',step.stored]]){
        const item=el('div');item.append(el('span','',name),el('strong','',String(value)));facts.append(item);
      }
      const scale=Math.max(1,layout.width/35),map=svg('svg',{viewBox:`${-3*scale} ${-4*scale} ${layout.width+6*scale} ${layout.height+7*scale}`,role:'img','aria-label':`Príprava krok ${index+1}: ${step.title}`,class:'setup-map'});
      map.append(svg('rect',{x:0,y:0,width:layout.width,height:layout.height,fill:'#e5eddd',stroke:'#173b31','stroke-width':.25}),svg('rect',{x:layout.corridor.x,y:0,width:layout.corridor.width,height:layout.height,fill:'#e7d5b7'}));
      const text=(x,y,value,size=1.4)=>svg('text',{x,y,'text-anchor':'middle','font-size':size*scale,fill:'#173b31','font-weight':650,'paint-order':'stroke',stroke:'white','stroke-width':.35},value);
      map.append(text(layout.width/2,-1.7*scale,`${layout.width} m`),text(-1.4*scale,layout.height/2,`${layout.height} m`,1.2),text(layout.corridor.x+layout.corridor.width/2,layout.height/2,'3 m',1.2/scale));
      for(const area of step.map.areas){
        map.append(svg('rect',{'data-setup-area':area.label,x:area.x,y:area.y,width:area.w,height:area.h,fill:'#f6f8f1',stroke:'#638268','stroke-width':.22}));
        if(step.map.key==='football-zones'&&!step.map.cornersOnly)for(const x of[area.x,area.x+area.w-2])map.append(svg('rect',{x,y:area.y,width:2,height:area.h,fill:'#d8eea4'}));
        map.append(text(area.x+area.w/2,area.y+area.h/2-.4*scale,area.label,1.8),text(area.x+area.w/2,area.y+area.h/2+1.5*scale,`${area.length} × ${area.width} m`,1.3));
      }
      for(const move of step.moves){
        const {from,to}=move,angle=Math.atan2(to.y-from.y,to.x-from.x);
        const route=svg('g',{'data-setup-route':to.area});
        route.append(svg('circle',{cx:from.x,cy:from.y,r:.38,fill:'white',stroke:'#6d7880','stroke-width':.16,'data-setup-old':''}),svg('path',{d:`M${from.x} ${from.y}L${to.x} ${to.y}`,fill:'none',stroke:'#16729c','stroke-width':.18,'stroke-dasharray':'.35 .2'}),svg('path',{d:`M${to.x} ${to.y}l${-.7*Math.cos(angle-.45)} ${-.7*Math.sin(angle-.45)}M${to.x} ${to.y}l${-.7*Math.cos(angle+.45)} ${-.7*Math.sin(angle+.45)}`,stroke:'#16729c','stroke-width':.18,fill:'none'}));map.append(route);
      }
      const cone=(p,kind,color)=>{const g=svg('g',{'data-setup-cone':kind});g.append(svg('path',{d:`M${p.x} ${p.y-.65}l-.55 1h1.1Z`,fill:color,stroke:'#173b31','stroke-width':.11}),svg('path',{d:`M${p.x-.22} ${p.y-.12}h.44`,stroke:'white','stroke-width':.12}));map.append(g);return g;};
      step.kept.forEach(p=>cone(p,'kept','#216a4b'));
      const added=step.added.map(p=>cone(p,'added','#f47700')),moved=step.moves.map(({to})=>cone(to,'moved','#16729c'));
      body.append(map);
      const action=el('p','setup-action',step.shortAction);action.style.minHeight=actionHeight+'px';body.append(action);
      const extra=el('details','setup-details');extra.open=detailsOpen;if(detailsOpen)extra.style.minHeight=detailsHeight+'px';extra.addEventListener('toggle',()=>{if(!extra.open)extra.style.minHeight='';});extra.append(el('summary','','Podrobnosti rozloženia'),facts);
      const legend=el('p','setup-legend','Oranžové = pridaj · modré = presuň · zelené = nechaj. Krúžok a šípka ukazujú pôvodné miesto.');extra.append(legend,el('p','',step.action));
      if(step.kit)extra.append(el('p','setup-kit',step.kit));
      extra.append(el('p','',step.coach),el('p','',step.extra));body.append(extra);
      const previous=el('button','secondary-button','← Späť');previous.type='button';previous.disabled=index===0;
      previous.addEventListener('click',()=>{index--;render();(index?footer.firstElementChild:footer.lastElementChild).focus({preventScroll:true});});
      const last=index===steps.length-1,next=el('button','button',last?'Príprava hotová':'Hotovo → ďalej');next.type='button';next.addEventListener('click',()=>{if(last)close();else{index++;render();footer.lastElementChild.focus({preventScroll:true});}});footer.append(previous,next);body.scrollTop=scrollTop;
    }
    dialog.append(header,nav,body,footer);document.body.append(dialog);active=dialog;
    dialog.addEventListener('close',()=>{dialog.remove();if(active===dialog)active=null;if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});},{once:true});render();dialog.showModal();
  }
  window.PitchSetup={supports:training=>PitchSetupPlan.supports(training),open,close};
})();
