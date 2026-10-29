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
  function open(training){
    close();window.FootballBoard?.pause();
    const {layout,steps}=PitchSetupPlan.build(training),returnFocus=document.activeElement;
    const dialog=el('dialog','pitch-setup');dialog.setAttribute('aria-labelledby','setup-title');
    const header=el('header','setup-header'),title=el('h2','','Príprava ihriska');title.id='setup-title';
    const dismiss=el('button','setup-close','×');dismiss.type='button';dismiss.setAttribute('aria-label','Zavrieť prípravu');dismiss.addEventListener('click',close);
    header.append(title,dismiss);
    const nav=el('div','setup-nav'),label=el('label','','Vyber krok prípravy'),select=el('select');select.setAttribute('aria-label','Vyber krok prípravy');
    steps.forEach((step,index)=>{const option=el('option','',`${index+1}. ${step.title}`);option.value=index;select.append(option);});
    label.append(select);nav.append(label);
    const body=el('div','setup-body'),footer=el('footer','setup-footer');
    let index=0,rate=.5,repeat=true,clock=null,animationFrame=null,updateMotion=null;
    function pauseMotion(){
      if(animationFrame!==null)cancelAnimationFrame(animationFrame);animationFrame=null;
      if(clock)clock.pause();updateMotion?.();
    }
    function disposeMotion(){pauseMotion();updateMotion=null;clock=null;}
    function render(){
      disposeMotion();
      const step=steps[index];select.value=String(index);body.replaceChildren();footer.replaceChildren();body.scrollTop=0;
      const progress=el('p','setup-progress',`Krok ${index+1} z ${steps.length} · ${step.when}`);progress.setAttribute('role','status');
      body.append(progress,el('h3','setup-step-title',step.title));
      const facts=el('div','setup-facts');
      for(const[name,value]of[['Po kroku',step.total],['Pridaj',step.added.length],['Presuň',step.moves.length],['Bokom',step.stored]]){
        const item=el('div');item.append(el('span','',name),el('strong','',String(value)));facts.append(item);
      }
      body.append(facts);
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
      const motion=PitchSetupMotion.create(step);clock=new FootballTimeline(motion.duration);clock.setRate(rate);clock.setLoop(repeat);
      let animated=false;
      const controls=el('div','setup-motion-controls'),play=el('button','button'),restart=el('button','secondary-button','Od začiatku'),drawing=el('button','secondary-button','Nákres');
      for(const button of[play,restart,drawing])button.type='button';controls.append(play,restart,drawing);
      const settings=el('div','setup-motion-settings'),speedLabel=el('label','','Rýchlosť ukážky'),speed=el('select');speed.setAttribute('aria-label','Rýchlosť presunu kužeľov');
      for(const[value,label]of[[.25,'0,25× · veľmi pomaly'],[.5,'0,5× · pomaly'],[1,'1× · normálne']]){const option=el('option','',label);option.value=value;speed.append(option);}speed.value=String(rate);speedLabel.append(speed);
      const repeatLabel=el('label','setup-motion-repeat'),loop=el('input');loop.type='checkbox';loop.checked=repeat;repeatLabel.append(loop,document.createTextNode('Opakovať dokola'));settings.append(speedLabel,repeatLabel);
      const status=el('p','setup-motion-status');status.setAttribute('role','status');
      const timeline=el('details','setup-motion-timeline');timeline.append(el('summary','','Prejsť na čas ukážky'));
      const output=el('output','setup-motion-time');output.setAttribute('aria-live','off');
      const seek=el('input');seek.type='range';seek.min='0';seek.max=motion.duration;seek.step='.01';seek.setAttribute('aria-label','Priebeh presunu kužeľov');timeline.append(output,seek);
      updateMotion=()=>{
        const time=animated?clock.time():motion.duration,frame=PitchSetupMotion.sample(motion,time);
        if(animated&&frame.complete&&clock.origin!==null&&!clock.loop)clock.pause();
        moved.forEach((element,i)=>{const point=frame.moves[i],to=step.moves[i].to;element.setAttribute('transform',`translate(${point.x-to.x} ${point.y-to.y})`);});
        added.forEach((element,i)=>element.setAttribute('opacity',String(frame.added[i])));
        map.querySelectorAll('[data-setup-route]').forEach(route=>route.setAttribute('opacity',!animated||frame.complete||route.getAttribute('data-setup-route')===frame.area?'1':'.2'));
        map.querySelectorAll('[data-setup-area]').forEach(area=>area.setAttribute('fill',animated&&!frame.complete&&area.getAttribute('data-setup-area')===frame.area?'#e8edb5':'#f6f8f1'));
        const playing=clock.origin!==null;
        play.textContent=playing?'Pauza':animated?(frame.complete?'Prehrať znova':'Pokračovať'):(step.moves.length?'Prehrať presun':'Ukázať pridanie');
        drawing.setAttribute('aria-pressed',String(!animated));
        const message=!animated?'Najprv nákres. Ukážku spustíš tlačidlom.':frame.complete?'Ukážka dokončená. Kužele sú na nových miestach.':`${playing?'':'Pozastavené · '}${frame.area}: ${frame.phase==='presun'?'presun z pôvodných miest':frame.phase==='pridanie'?'pridanie nových mét':'kontrola nových miest'}.`;
        if(status.textContent!==message)status.textContent=message;
        seek.value=String(time);output.textContent=`${time.toFixed(1)} / ${motion.duration.toFixed(1)} s`;
      };
      const tick=()=>{updateMotion();if(clock.origin!==null)animationFrame=requestAnimationFrame(tick);else animationFrame=null;};
      play.addEventListener('click',()=>{if(clock.origin!==null)pauseMotion();else{animated=true;clock.play();updateMotion();animationFrame=requestAnimationFrame(tick);}});
      restart.addEventListener('click',()=>{pauseMotion();animated=true;clock.seek(0);updateMotion();});
      drawing.addEventListener('click',()=>{pauseMotion();animated=false;clock.seek(0);updateMotion();});
      speed.addEventListener('change',()=>{rate=Number(speed.value);clock.setRate(rate);updateMotion();});
      loop.addEventListener('change',()=>{repeat=loop.checked;clock.setLoop(repeat);updateMotion();});
      seek.addEventListener('input',()=>{const value=Number(seek.value);pauseMotion();animated=true;clock.seek(value);updateMotion();});
      body.append(controls,settings,status,timeline);updateMotion();
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)body.append(el('p','setup-motion-note','Pri obmedzenom pohybe môžeš použiť posuvník času alebo tlačidlo Nákres.'));
      const legend=el('p','setup-legend','Oranžové = pridaj · modré = presuň sem · zelené = nechaj. Prázdny krúžok a šípka ukazujú presun z pôvodného miesta.');body.append(legend);
      body.append(el('p','setup-action',step.action));
      if(step.kit)body.append(el('p','setup-kit',step.kit));
      const extra=el('details','setup-details');extra.append(el('summary','','Rozdelenie práce a ďalšie pokyny'),el('p','',step.coach),el('p','',step.extra));body.append(extra);
      const previous=el('button','secondary-button','← Späť');previous.type='button';previous.disabled=index===0;
      previous.addEventListener('click',()=>{index--;render();(index?footer.firstElementChild:footer.lastElementChild).focus();});
      const last=index===steps.length-1,next=el('button','button',last?'Zavrieť prípravu':'Ďalší krok →');next.type='button';next.addEventListener('click',()=>{if(last)close();else{index++;render();footer.lastElementChild.focus();}});footer.append(previous,next);
    }
    select.addEventListener('change',()=>{index=Number(select.value);render();});
    dialog.append(header,nav,body,footer);document.body.append(dialog);active=dialog;
    const onVisibility=()=>{if(document.hidden)pauseMotion();};document.addEventListener('visibilitychange',onVisibility);window.addEventListener('pagehide',pauseMotion);
    dialog.addEventListener('close',()=>{disposeMotion();document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',pauseMotion);dialog.remove();if(active===dialog)active=null;if(returnFocus?.isConnected)returnFocus.focus();},{once:true});render();dialog.showModal();
  }
  window.PitchSetup={supports:training=>PitchSetupPlan.supports(training),open,close};
})();
