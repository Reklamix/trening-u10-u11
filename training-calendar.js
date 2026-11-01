'use strict';

const TrainingCalendar = {
  templateId: 'u11-pass-move-v1',
  today(now = new Date()) {
    return new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  },
  validDate(value) {
    if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value+'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
  },
  shift(date, days) {
    if(!this.validDate(date) || !Number.isInteger(days)) throw Error('Invalid calendar range');
    const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10);
  },
  range(trainings, from, days=14) {
    if(!this.validDate(from) || ![7,14].includes(days)) throw Error('Invalid calendar range');
    const to=this.shift(from,days-1);
    return trainings.filter(t=>t.planning && t.date>=from && t.date<=to).sort((a,b)=>a.date.localeCompare(b.date));
  },
  initial(trainings, today=this.today()) {
    const ordered=[...trainings].sort((a,b)=>a.date.localeCompare(b.date));
    return ordered.find(t=>t.date>=today) || ordered[ordered.length-1];
  },
  expand(data, agenda) {
    if(agenda?.version!==1 || !Array.isArray(agenda.sessions) || !this.validDate(agenda.period?.from) || !this.validDate(agenda.period?.to) || agenda.period.to<agenda.period.from) throw Error('Invalid agenda');
    const source=data.trainings.find(t=>t.id==='2026-10-29');
    if(!source?.quarterPitch) throw Error('Missing approved training template');
    const ids=new Set(data.trainings.map(t=>t.id));
    const sessions=agenda.sessions.map(plan=>{
      if(!this.validDate(plan.date) || ids.has(plan.date) || plan.date<agenda.period.from || plan.date>agenda.period.to || plan.templateId!==this.templateId || plan.status!=='draft') throw Error('Invalid planned session');
      if(!['title','focus','cue','topic'].every(key=>typeof plan[key]==='string' && plan[key].trim())) throw Error('Missing session description');
      if(plan.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.startTime)) throw Error('Invalid planned time');
      ids.add(plan.date);
      const t=JSON.parse(JSON.stringify(source));
      t.id=t.date=plan.date;t.title=plan.title;t.focus=plan.focus;t.cue=plan.cue;t.templateId=plan.templateId;
      delete t.startTime; if(plan.startTime)t.startTime=plan.startTime;
      t.planning={status:'draft',topic:plan.topic,assumptions:agenda.assumptions,period:{...agenda.period}};
      t.defaultConfig={players:20,coaches:2,pitch:'quarter',width:35,height:25,levels:['base','base','standard','standard'],groupSizes:[5,5,5,5]};
      t.players='Návrh: 20 detí · počet možno upraviť 10–30';
      t.notes.push({title:'Zameranie tohto dňa',text:plan.focus+' '+plan.cue+' Zachovávame známy 75-minútový formát a dávky; mení sa hlavný trénerský podnet. Termín a podmienky sú pracovný návrh.'});
      for(const block of t.blocks)block.cues.unshift(plan.cue);
      return t;
    });
    return {...data,trainings:[...data.trainings,...sessions]};
  }
};
