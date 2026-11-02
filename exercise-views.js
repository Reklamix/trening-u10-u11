'use strict';

const ExerciseVisualViews = (()=>{
  const saved=new Map();
  const coneCount=count=>`${count} ${count===1?'kužeľ':count>=2&&count<=4?'kužele':'kužeľov'}`;
  function swipeTarget(index,{dx,dy,startX,width,duration}){
    if(startX<24||startX>width-24||duration>900||Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)*1.4)return index;
    return Math.max(0,Math.min(2,index+(dx<0?1:-1)));
  }
  function describe({scene,layout,areas,index,total}){
    const area=areas[index];
    return {selectedPlayers:area?.count??scene.localCount,totalPlayers:areas.reduce((sum,a)=>sum+a.count,0)||total,
      cones:scene.cones?.length||0,areaLabel:area?.label||'Skupina',length:scene.pitch?.length,width:scene.pitch?.width,
      pitchWidth:layout?.width,pitchHeight:layout?.height,
      groups:areas.map((a,i)=>({index:i,label:`${a.label} · ${a.count} ${a.count>=2&&a.count<=4?'deti':'detí'}`,selected:i===index}))};
  }
  function mount({root,figure,primarySvg,phaseBar,map,state,pause,key,onAreaChange}){
    const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    const svg=(tag,attrs,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
    const nav=el('div','exercise-visual-tabs');nav.setAttribute('role','group');nav.setAttribute('aria-label','Pohľady na cvičenie');
    const labels=['Animácia','Kužele','Celá plocha'],keys=['animation','cones','pitch'],buttons=[];
    const arrow=(direction,label)=>{const b=el('button','exercise-view-arrow');b.type='button';b.setAttribute('aria-label',label);b.title=label;const icon=el('img');icon.src=`./assets/bootstrap-icons/arrow-${direction}.svg`;icon.alt='';b.append(icon);return b;};
    const previous=arrow('left','Predchádzajúci pohľad'),next=arrow('right','Ďalší pohľad');previous.addEventListener('click',()=>select(current-1));next.addEventListener('click',()=>select(current+1));nav.append(previous);
    const groupTools=el('label','exercise-view-group'),groupSelect=el('select');groupTools.append(el('span','','Skupina'),groupSelect);groupSelect.setAttribute('aria-label','Skupina v nákrese');groupSelect.addEventListener('change',()=>onAreaChange?.(Number(groupSelect.value)));
    const descriptionOpen=el('button','exercise-description-open','Popis a postup');descriptionOpen.type='button';descriptionOpen.setAttribute('aria-haspopup','dialog');descriptionOpen.addEventListener('click',()=>openDescription(descriptionOpen));
    const panes=[null,el('div','exercise-visual-pane'),el('div','exercise-visual-pane')],meta=el('span','exercise-view-meta');
    const trail=[];let current=saved.get(key)||0,start=null,destroyed=false,descriptionDialog=null;
    panes[1].setAttribute('aria-label','Rozloženie kužeľov vybranej skupiny');panes[2].setAttribute('aria-label','Celá plocha a všetky skupiny');
    for(let i=0;i<3;i++){const button=el('button','',labels[i]);button.type='button';button.setAttribute('aria-label',`${i+1} z 3 · ${labels[i]}`);button.addEventListener('click',()=>select(i));buttons.push(button);nav.append(button);}
    nav.append(next);root.insertBefore(nav,phaseBar);phaseBar.append(meta,groupTools);figure.append(panes[1],panes[2]);
    figure.setAttribute('aria-roledescription','karusel');
    function drawCones(s,info){
      const p=s.scene.pitch;if(!p)return el('p','exercise-view-note','Toto cvičenie nemá samostatné rozloženie kužeľov.');
      const drawing=svg('svg',{viewBox:primarySvg.getAttribute('viewBox'),role:'img','aria-label':`${info.areaLabel}: ${coneCount(info.cones)} · ${p.length} × ${p.width} m`});
      drawing.append(svg('rect',{x:p.x,y:p.y,width:p.w,height:p.h,fill:'none',stroke:'white','stroke-width':1.4}));
      for(const line of s.scene.lines||[])drawing.append(svg('line',{x1:line.from.x,y1:line.from.y,x2:line.to.x,y2:line.to.y,stroke:'#ffffffaa','stroke-width':1,'stroke-dasharray':'4 4'}));
      for(const[c,cone]of (s.scene.cones||[]).entries()){
        const group=svg('g',{'data-view-cone':cone.kind,transform:`translate(${cone.x} ${cone.y})`});
        group.append(svg('image',{href:'./assets/card-cone.webp',x:-12,y:-18,width:24,height:24}),svg('text',{x:12,y:-9,fill:'white','font-size':10,'font-weight':700},c+1));drawing.append(group);
      }
      drawing.append(svg('text',{x:p.x+p.w/2,y:p.y+p.h+25,'text-anchor':'middle','font-size':13,fill:'white'},`${p.length} × ${p.width} m`));
      return drawing;
    }
    function refresh(){
      if(destroyed)return;const s=state();if(!s.scene)return;
      const info=describe(s),coneNote=el('p','exercise-view-note',`${info.areaLabel} · ${info.selectedPlayers} detí · ${coneCount(info.cones)}`);
      groupSelect.replaceChildren(...info.groups.map(group=>{const option=el('option','',group.label);option.value=String(group.index);option.selected=group.selected;return option;}));groupSelect.disabled=info.groups.length<2||!onAreaChange;
      panes[1].replaceChildren(drawCones(s,info),coneNote);
      if(map){
        const whole=map.cloneNode(true);whole.removeAttribute('id');whole.setAttribute('aria-label',`Celá plocha ${info.pitchWidth} × ${info.pitchHeight} m · ${info.totalPlayers} detí`);
        const radius=Math.max(.42,(info.pitchWidth||35)/90);
        whole.querySelectorAll('[data-map-player]').forEach(node=>node.setAttribute('r',radius));
        panes[2].replaceChildren(whole,el('p','exercise-view-note',`${info.totalPlayers} detí spolu · ${info.pitchWidth} × ${info.pitchHeight} m · ${coneCount(whole.querySelectorAll('[data-map-cone]').length)}`));
      }else panes[2].replaceChildren(el('p','exercise-view-note','Celkové rozmiestnenie nie je v tomto staršom pláne uložené.'));
      meta.textContent=current===1?`${info.areaLabel} · rozlož ${coneCount(info.cones)}`:`Celá plocha · zvýraznená skupina ${info.areaLabel} · ${info.selectedPlayers} detí`;
      const summary=root.querySelector('.exercise-summary');if(summary&&s.brief)summary.append(descriptionOpen);
      paint();
    }
    function paint(){
      root.dataset.visualView=keys[current];figure.dataset.visualSlide=String(current+1);
      primarySvg.classList.toggle('exercise-animation-hidden',current!==0);primarySvg.setAttribute('aria-hidden',String(current!==0));
      for(const child of figure.children){if(child===primarySvg||panes.includes(child))continue;child.classList.toggle('exercise-animation-hidden',current!==0);}
      panes[1].hidden=current!==1;panes[2].hidden=current!==2;
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));
      previous.disabled=current===0;next.disabled=current===2;
      figure.setAttribute('aria-label',`${current+1} z 3 · ${labels[current]}`);
    }
    function openDescription(trigger=descriptionOpen){
      if(descriptionDialog?.open)return;const s=state(),data=s.brief;if(!data)return;pause();
      const dialog=el('dialog','exercise-description-dialog'),head=el('header','exercise-description-head'),close=el('button','exercise-description-close','← Späť k cvičeniu');close.type='button';close.addEventListener('click',()=>dialog.close());
      dialog.setAttribute('aria-label','Popis a postup cvičenia');head.append(close,el('h2','',data.title||s.block?.title),el('p','',data.selection?.replace(/^Ukážka /,'')||''));
      const tabs=el('div','exercise-description-tabs'),body=el('div','exercise-description-body');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Časti popisu cvičenia');
      const section=(title)=>{const n=el('section','exercise-description-section');n.append(el('h3','',title));return n;};
      const paragraph=(parent,text)=>{if(text)parent.append(el('p','',text));};
      const list=(parent,tag,texts)=>{const items=[...new Set((texts||[]).filter(Boolean))];if(!items.length)return;const n=el(tag);items.forEach(text=>n.append(el('li','',text)));parent.append(n);};
      const steps=section('Ako cvičenie prebieha');paragraph(steps,data.steps?.includes(data.description)?data.shortInstruction:data.description||data.shortInstruction);steps.append(el('h4','','Postup krok za krokom'));list(steps,'ol',data.steps);
      const space=section('Rozloženie a deti');paragraph(space,data.space);paragraph(space,data.grouping);paragraph(space,data.spacing);space.append(el('h4','','Kužele a pomôcky'));paragraph(space,data.conePlacement);list(space,'ul',data.kit);
      const time=section(`Celé cvičenie · ${data.timing?.total||''}`);for(const[title,text]of[['Práca',data.work],['Oddych',data.rest],['Striedanie',data.rotation]]){time.append(el('h4','',title));paragraph(time,text);}paragraph(time,data.timing?.schedule);paragraph(time,data.timing?.note);
      const coach=section('Povedz deťom');if(data.slogan)coach.append(el('blockquote','',data.slogan));coach.append(el('h4','','Čo sleduje tréner'));list(coach,'ul',data.notes);list(coach,'ul',data.coaches);
      const sections=[steps,space,time,coach],tabButtons=[];
      const showTab=index=>{sections.forEach((n,i)=>n.hidden=i!==index);tabButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));body.scrollTop=0;};
      ['Postup','Plocha','Časy','Tréner'].forEach((label,index)=>{const b=el('button','',label);b.type='button';b.addEventListener('click',()=>showTab(index));tabButtons.push(b);tabs.append(b);});
      body.append(...sections);dialog.append(head,tabs,body);document.body.append(dialog);descriptionDialog=dialog;showTab(0);
      dialog.addEventListener('close',()=>{dialog.remove();if(descriptionDialog===dialog)descriptionDialog=null;if(!destroyed&&trigger.isConnected)trigger.focus({preventScroll:true});},{once:true});
      dialog.addEventListener('keydown',event=>{if(event.altKey&&event.key==='ArrowLeft'){event.preventDefault();dialog.close();}});dialog.showModal();
    }
    function select(index,record=true){
      if(!Number.isInteger(index)||index<0||index>2||index===current)return;
      if(record)trail.push(current);if(index!==0)pause();current=index;saved.set(key,current);
      if(saved.size>128)saved.delete(saved.keys().next().value);refresh();
    }
    const down=event=>{if(event.isPrimary===false||event.button>0||event.target.closest('button,select,input,a,summary'))return;start={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};figure.setPointerCapture(event.pointerId);};
    const up=event=>{if(!start||start.id!==event.pointerId)return;const gesture={dx:event.clientX-start.x,dy:event.clientY-start.y,startX:start.x,width:innerWidth,duration:performance.now()-start.time};start=null;const next=swipeTarget(current,gesture);if(next!==current){event.preventDefault();select(next);}};
    const cancel=()=>{start=null;};
    const keyboard=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:Math.max(0,Math.min(2,current+(event.key==='ArrowRight'?1:-1)));select(next);buttons[next].focus({preventScroll:true});};
    figure.addEventListener('pointerdown',down);figure.addEventListener('pointerup',up);figure.addEventListener('pointercancel',cancel);nav.addEventListener('keydown',keyboard);
    paint();
    return{refresh,openDescription,back(){if(descriptionDialog?.open){descriptionDialog.close();return true;}if(trail.length){select(trail.pop(),false);return true;}if(current!==0){select(0,false);return true;}return false;},destroy(){destroyed=true;descriptionDialog?.close();nav.remove();meta.remove();groupTools.remove();descriptionOpen.remove();panes[1].remove();panes[2].remove();figure.removeEventListener('pointerdown',down);figure.removeEventListener('pointerup',up);figure.removeEventListener('pointercancel',cancel);nav.removeEventListener('keydown',keyboard);}};
  }
  function installDialogNavigation(){
    const attach=dialog=>{
      if(!dialog.open||dialog.querySelector('.dialog-app-nav'))return;
      const source=document.getElementById('bottom-nav');if(!source||source.hidden)return;
      const nav=document.createElement('nav');nav.className='dialog-app-nav';nav.setAttribute('aria-label','Hlavná navigácia v okne');
      for(const original of source.querySelectorAll('a')){
        const link=original.cloneNode(true);link.removeAttribute('id');link.removeAttribute('data-view');
        link.addEventListener('click',event=>{event.preventDefault();for(const opened of document.querySelectorAll('dialog[open]'))opened.close();original.click();});nav.append(link);
      }
      dialog.append(nav);
    };
    const observer=new MutationObserver(records=>{for(const record of records)if(record.target.tagName==='DIALOG')attach(record.target);});
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  }
  return{swipeTarget,describe,mount,installDialogNavigation};
})();
if(typeof window!=='undefined'){window.ExerciseVisualViews=ExerciseVisualViews;ExerciseVisualViews.installDialogNavigation();}
