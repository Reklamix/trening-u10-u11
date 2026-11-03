'use strict';
(() => {
  const install=document.getElementById('install-app'),push=document.getElementById('push-toggle'),status=document.getElementById('push-status');
  if(!install||!push||!status)return;
  const tokenKey='u11-push-owner-v1',standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  let promptEvent=null,registration=null,config=null,busy=false,subscribed=false,initialized=false;
  const message=text=>{status.textContent=text;};
  const storage={get:()=>localStorage.getItem(tokenKey),set:v=>localStorage.setItem(tokenKey,v),remove:()=>localStorage.removeItem(tokenKey)};
  const settings=document.getElementById('app-settings-dialog'),settingsOpen=document.getElementById('app-settings-open'),settingsClose=document.getElementById('app-settings-close');
  settingsOpen.addEventListener('click',()=>{settings.showModal();settingsOpen.setAttribute('aria-expanded','true');});
  settingsClose.addEventListener('click',()=>settings.close());
  settings.addEventListener('close',()=>settingsOpen.setAttribute('aria-expanded','false'));
  const api=async(path,body)=>{
    const response=await fetch('./api/push/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error('Server '+response.status);
    return response.json();
  };
  function render(){
    install.textContent=standalone()?'Aplikácia je pridaná':'Pridať do mobilu';
    push.disabled=busy||!config||!initialized||subscribed;
    const off=document.getElementById('push-disable');off.hidden=!subscribed;off.disabled=busy;
    push.textContent=busy?'Chvíľku…':subscribed?'Upozornenia zapnuté ✓':'Zapnúť upozornenia';
  }
  function instructions(){
    document.getElementById('install-instructions').textContent=standalone()?'Aplikáciu už máš otvorenú cez ikonu na ploche.':ios()?'V Safari otvor Zdieľať (prípadne najprv menu ⋯), potom Pridať na plochu a potvrď Pridať. Ak vidíš voľbu Otvárať ako webovú aplikáciu, nechaj ju zapnutú.':'V menu prehliadača otvor Inštalovať aplikáciu alebo Pridať na plochu a potvrď. Ak túto voľbu nevidíš, otvor stránku priamo v Chrome alebo inom podporovanom prehliadači.';
    document.getElementById('install-dialog').showModal();
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;render();});
  window.addEventListener('appinstalled',()=>{promptEvent=null;render();message('Aplikácia je pridaná na plochu.');});
  install.addEventListener('click',async()=>{
    if(!promptEvent||standalone()){instructions();return;}
    const event=promptEvent;promptEvent=null;
    try{await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')message('Pridanie aplikácie potvrď v prehliadači.');}catch{instructions();}
    render();
  });
  push.addEventListener('click',async()=>{
    if(busy||!config||!initialized||subscribed)return;
    if(ios()&&!standalone()){instructions();message('Na iPhone najprv pridaj aplikáciu na plochu a otvor ju cez ikonu.');return;}
    // Permission must be requested directly from the user's gesture, before any await.
    const permission=Notification.requestPermission();
    busy=true;render();
    let created=null;
    try{
        if(await permission!=='granted'){message(Notification.permission==='denied'?'Upozornenia sú zablokované. Povoľ ich v nastaveniach stránky alebo telefónu.':'Prehliadač neudelil povolenie. Pri otázke na upozornenia vyber Povoliť a skús znova.');return;}
        let token=storage.get();if(!token){const bytes=crypto.getRandomValues(new Uint8Array(32));token=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');storage.set(token);}
        let sub=await registration.pushManager.getSubscription();
        if(!sub){const key=Uint8Array.from(atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});created=sub;}
        await api('subscribe',{subscription:sub.toJSON(),token});
        subscribed=true;message('Zapnuté na tomto zariadení. Nový pripravený tréning sa ohlási aj po zatvorení aplikácie. Zvuk riadi telefón.');
    }catch{if(created){try{await created.unsubscribe();}catch{}}message('Zmenu sa nepodarilo dokončiť. Skontroluj pripojenie a skús znova.');}
    finally{busy=false;render();}
  });
  document.getElementById('push-disable').addEventListener('click',async()=>{
    if(busy||!initialized||!subscribed)return;
    if(!window.confirm('Naozaj vypnúť upozornenia na nové tréningy na tomto zariadení?'))return;
    busy=true;render();
    try{
      const sub=await registration.pushManager.getSubscription(),token=storage.get();
      if(sub&&token)await api('unsubscribe',{endpoint:sub.endpoint,token});
      if(sub&&!(await sub.unsubscribe()))throw Error('Odhlásenie zariadenia zlyhalo');
      storage.remove();subscribed=false;message('Upozornenia sú na tomto zariadení vypnuté.');
    }catch{message('Vypnutie sa nepodarilo dokončiť. Skús znova.');}
    finally{busy=false;render();}
  });
  async function init(){
    render();
    if(location.hostname==='reklamix.github.io'){
      message('Upozornenia zapneš na novej adrese BeGoal. Otvor ju aj pre pridanie aplikácie do mobilu.');
      document.getElementById('push-primary-link').hidden=false;return;
    }
    if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){
      message(ios()?'Na iPhone pridaj aplikáciu na plochu a otvor ju cez ikonu. Upozornenia vyžadujú podporovanú verziu iOS.':'Tento prehliadač nepodporuje upozornenia. Skús aktuálny Chrome, Safari alebo Firefox.');return;
    }
    try{
      registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      await navigator.serviceWorker.ready;
      const result=await api('config');if(!result.enabled||typeof result.publicKey!=='string')throw Error('Unavailable');config=result;
      const sub=await registration.pushManager.getSubscription(),token=storage.get();
      if(sub&&token&&Notification.permission==='granted'){
        await api('subscribe',{subscription:sub.toJSON(),token});subscribed=true;
      }else if(sub&&!token){await sub.unsubscribe();}
      message(subscribed?'Upozornenia sú zapnuté na tomto zariadení. Zvuk riadi telefón.':Notification.permission==='denied'?'Upozornenia sú zablokované. Povoliť ich môžeš v nastaveniach telefónu.':'Zapni si oznámenie, keď pribudne nový pripravený tréning.');
    }catch{
      config=null;message(location.hostname==='reklamix.github.io'?'Upozornenia sú dostupné na novej adrese BeGoal.':'Upozornenia sa teraz nedajú načítať. Skontroluj pripojenie a obnov stránku.');
      document.getElementById('push-primary-link').hidden=location.hostname!=='reklamix.github.io';
    }
    initialized=true;render();
  }
  init();
})();
