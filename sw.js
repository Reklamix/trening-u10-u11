'use strict';
// Network-only navigation supports Chromium install prompts without caching training/private data.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),root=new URL('./',self.registration.scope);
  if(request.method==='GET'&&request.mode==='navigate'&&url.origin===root.origin&&url.pathname===root.pathname){
    event.respondWith(fetch(request,{cache:'no-store'}));
  }
});
self.addEventListener('push',event=>{
  let data={};try{data=event.data?.json()||{};}catch{}
  const date=typeof data.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(data.date)&&Number.isFinite(Date.parse(data.date))&&new Date(data.date).toISOString().slice(0,10)===data.date?data.date:null;
  const url=new URL('./',self.registration.scope);url.hash=date?'trening='+date+'&sekcia=overview':'sekcia=overview';
  const title=typeof data.title==='string'?data.title.slice(0,140):'Otvor si pripravený tréning.';
  event.waitUntil(self.registration.showNotification('Nový tréning U11',{
    body:date?date.split('-').reverse().join('.')+' · '+title:title,
    icon:new URL('assets/app/icon-training-centered-192.png',self.registration.scope).href,
    badge:new URL('assets/app/badge-u11-96.png',self.registration.scope).href,
    tag:'u11-training-'+(date||'new'),data:{url:url.href}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const root=new URL('./',self.registration.scope);let target=root;
  try{const candidate=new URL(event.notification.data?.url);if(candidate.origin===root.origin&&candidate.pathname===root.pathname)target=candidate;}catch{}
  event.waitUntil((async()=>{
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clients){if(new URL(client.url).origin===root.origin&&new URL(client.url).pathname===root.pathname){await client.navigate(target.href);return client.focus();}}
    return self.clients.openWindow(target.href);
  })());
});
