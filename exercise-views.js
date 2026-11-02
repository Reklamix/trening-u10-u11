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
      pitchWidth:layout?.width,pitchHeight:layout?.height};
  }
  function mount({root,figure,primarySvg,phaseBar,map,state,pause,key}){
    const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    const svg=(tag,attrs,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
    const nav=el('div','exercise-visual-tabs');nav.setAttribute('role','group');nav.setAttribute('aria-label','Pohľady na cvičenie');
    const labels=['Animácia','Kužele','Celá plocha'],keys=['animation','cones','pitch'],buttons=[];
    const panes=[null,el('div','exercise-visual-pane'),el('div','exercise-visual-pane')],meta=el('span','exercise-view-meta');
    const trail=[];let current=saved.get(key)||0,start=null,destroyed=false;
    panes[1].setAttribute('aria-label','Rozloženie kužeľov vybranej skupiny');panes[2].setAttribute('aria-label','Celá plocha a všetky skupiny');
    for(let i=0;i<3;i++){const button=el('button','',labels[i]);button.type='button';button.setAttribute('aria-label',`${i+1} z 3 · ${labels[i]}`);button.addEventListener('click',()=>select(i));buttons.push(button);nav.append(button);}
    root.insertBefore(nav,phaseBar);phaseBar.append(meta);figure.append(panes[1],panes[2]);
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
      panes[1].replaceChildren(drawCones(s,info),coneNote);
      if(map){
        const whole=map.cloneNode(true);whole.removeAttribute('id');whole.setAttribute('aria-label',`Celá plocha ${info.pitchWidth} × ${info.pitchHeight} m · ${info.totalPlayers} detí`);
        const radius=Math.max(.42,(info.pitchWidth||35)/90);
        whole.querySelectorAll('[data-map-player]').forEach(node=>node.setAttribute('r',radius));
        panes[2].replaceChildren(whole,el('p','exercise-view-note',`${info.totalPlayers} detí spolu · ${info.pitchWidth} × ${info.pitchHeight} m · ${coneCount(whole.querySelectorAll('[data-map-cone]').length)}`));
      }else panes[2].replaceChildren(el('p','exercise-view-note','Celkové rozmiestnenie nie je v tomto staršom pláne uložené.'));
      meta.textContent=current===1?`${info.areaLabel} · rozlož ${coneCount(info.cones)}`:`Celá plocha · ${info.totalPlayers} detí`;
      paint();
    }
    function paint(){
      root.dataset.visualView=keys[current];figure.dataset.visualSlide=String(current+1);
      primarySvg.classList.toggle('exercise-animation-hidden',current!==0);primarySvg.setAttribute('aria-hidden',String(current!==0));
      for(const child of figure.children){if(child===primarySvg||panes.includes(child))continue;child.classList.toggle('exercise-animation-hidden',current!==0);}
      panes[1].hidden=current!==1;panes[2].hidden=current!==2;
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));
      figure.setAttribute('aria-label',`${current+1} z 3 · ${labels[current]}`);
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
    return{refresh,back(){if(trail.length){select(trail.pop(),false);return true;}if(current!==0){select(0,false);return true;}return false;},destroy(){destroyed=true;nav.remove();meta.remove();panes[1].remove();panes[2].remove();figure.removeEventListener('pointerdown',down);figure.removeEventListener('pointerup',up);figure.removeEventListener('pointercancel',cancel);nav.removeEventListener('keydown',keyboard);}};
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
