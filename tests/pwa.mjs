import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {inflateSync} from 'node:zlib';
const manifest=JSON.parse(fs.readFileSync('app.webmanifest','utf8'));
assert.equal(manifest.scope,'./');assert.equal(manifest.id,'./');assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./#sekcia=overview');
assert.equal(manifest.short_name,'Tréningy U11');assert.equal(manifest.name,'Tréningy U11');assert.ok(manifest.icons.every(icon=>icon.src.includes('icon-training-')));
for(const icon of manifest.icons){const data=fs.readFileSync(icon.src.split('?')[0]);assert.equal(data.subarray(1,4).toString(),'PNG');const[n]=icon.sizes.split('x').map(Number);assert.equal(data.readUInt32BE(16),n);assert.equal(data.readUInt32BE(20),n);}
const source=fs.readFileSync('sw.js','utf8');assert.ok(!/caches\./.test(source));
const listeners={},notifications=[],opened=[],scope='https://treningy.begoal.sk/';
const self={registration:{scope,showNotification:(title,data)=>{notifications.push({title,...data});return Promise.resolve();}},skipWaiting:()=>Promise.resolve(),clients:{claim:()=>Promise.resolve(),matchAll:()=>Promise.resolve([]),openWindow:url=>{opened.push(url);return Promise.resolve();}},addEventListener:(name,fn)=>listeners[name]=fn};
const network=[];vm.runInNewContext(source,{self,URL,Date,fetch:(request,options)=>{network.push({request,options});return Promise.resolve('network-only');}});
let response;listeners.fetch({request:{method:'GET',mode:'navigate',url:scope+'#sekcia=overview'},respondWith:p=>response=p});assert.equal(await response,'network-only');assert.equal(network.length,1);assert.equal(network[0].options.cache,'no-store');
for(const request of [{method:'GET',mode:'cors',url:scope+'personal-plan.enc.json'},{method:'POST',mode:'cors',url:scope+'api/push/subscribe'},{method:'GET',mode:'navigate',url:'https://evil.invalid/'}])listeners.fetch({request,respondWith:()=>assert.fail('Must not intercept private/API/cross-origin requests')});assert.equal(network.length,1);
async function push(data){let promise;listeners.push({data:{json:()=>data},waitUntil:p=>promise=p});await promise;return notifications.at(-1);}
async function click(url){let promise;listeners.notificationclick({notification:{data:{url},close(){}},waitUntil:p=>promise=p});await promise;return opened.at(-1);}
const n=await push({date:'2026-11-03',title:'Súboje',url:'https://evil.invalid/'});assert.equal(n.data.url,scope+'#trening=2026-11-03&sekcia=overview');assert.ok(n.body.includes('03.11.2026'));assert.equal(n.tag,'u11-training-2026-11-03');
assert.equal(n.badge,scope+'assets/app/badge-u11-96.png');assert.notEqual(n.badge,n.icon,'Android silhouette must use a separate transparent badge');
const badge=fs.readFileSync(new URL(n.badge).pathname.slice(1)),w=badge.readUInt32BE(16),h=badge.readUInt32BE(20);
assert.equal(w,96);assert.equal(h,96);assert.equal(badge[24],8);assert.equal(badge[25],6,'Badge needs RGBA, not an opaque RGB tile');assert.equal(badge[28],0);
const chunks=[];for(let offset=8;offset<badge.length;){const length=badge.readUInt32BE(offset);if(badge.toString('ascii',offset+4,offset+8)==='IDAT')chunks.push(badge.subarray(offset+8,offset+8+length));offset+=12+length;}
const pixels=inflateSync(Buffer.concat(chunks)),alpha=[];let offset=0,previous=Buffer.alloc(w*4);
const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
for(let y=0;y<h;y++){
 const filter=pixels[offset++],row=Buffer.alloc(w*4);assert.ok(filter>=0&&filter<=4);
 for(let x=0;x<row.length;x++){const left=x>=4?row[x-4]:0,up=previous[x],upperLeft=x>=4?previous[x-4]:0;const prediction=[0,left,up,Math.floor((left+up)/2),paeth(left,up,upperLeft)][filter];row[x]=(pixels[offset++]+prediction)&255;}
 for(let x=0;x<w;x++){const a=row[x*4+3];alpha.push(a);if(a)assert.deepEqual([...row.subarray(x*4,x*4+3)],[255,255,255],'Only monochrome white glyph pixels belong in the badge');}
 previous=row;
}
for(const index of [0,w-1,(h-1)*w,w*h-1])assert.equal(alpha[index],0,'Corners must be fully transparent');
assert.ok(alpha.some(a=>a===255),'U11 glyphs must be visible');assert.ok(alpha.filter(a=>a===0).length>w*h/4,'Opaque background would become a square in Android status bar');
const invalid=await push({date:'2026-02-30',title:'<script>ignored as plain text</script>'});assert.equal(invalid.data.url,scope+'#sekcia=overview');
assert.equal(await click('https://evil.invalid/'),scope);assert.equal(await click(scope+'api/push/config'),scope);assert.equal(await click(n.data.url),n.data.url);
const html=fs.readFileSync('index.html','utf8');assert.ok(html.includes('rel="manifest"'));assert.ok(html.includes('id="push-toggle"'));assert.ok(html.includes('id="install-dialog"'));
assert.ok(html.indexOf('id="app-settings-dialog"')<html.indexOf('id="push-toggle"'),'Push controls live inside settings dialog');assert.equal((html.match(/id="push-toggle"/g)||[]).length,1);assert.ok(html.includes('aria-label="Nastavenia aplikácie"'));
async function ui({ios=false,denied=false,dismissed=false,fail=false,confirmRemoval=false,host='treningy.begoal.sk'}={}){
 const elements=new Map(),events={},calls=[],values=new Map();let permissionCalls=0,removed=0,current=null;
 const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:true,disabled:false,handlers:{},attributes:{},addEventListener(name,fn){this.handlers[name]=fn;},setAttribute(name,value){this.attributes[name]=value;},showModal(){this.open=true;},close(){this.open=false;this.handlers.close?.();}});return elements.get(id);};
 const sub={endpoint:'https://fcm.googleapis.com/fcm/send/'+ 'a'.repeat(40),toJSON(){return{endpoint:this.endpoint,keys:{p256dh:'key',auth:'auth'}};},async unsubscribe(){current=null;removed++;return true;}};
 const registration={pushManager:{async getSubscription(){return current;},async subscribe(){current=sub;return sub;}}};
 const navigator={userAgent:ios?'iPhone':'Android',platform:ios?'iPhone':'Linux',maxTouchPoints:1,serviceWorker:{register:async()=>registration,ready:Promise.resolve(registration)}};
 const Notification={permission:denied?'denied':'default',async requestPermission(){permissionCalls++;this.permission=denied?'denied':dismissed?'default':'granted';return this.permission;}};
 const window={confirm:()=>confirmRemoval,PushManager:function(){},Notification,addEventListener:(name,fn)=>events[name]=fn};
 const fetch=async(url,options)=>{calls.push({url,options});return{ok:!fail||url.endsWith('/config'),status:503,json:async()=>url.endsWith('/config')?{enabled:true,publicKey:Buffer.alloc(65).toString('base64url')}:{subscribed:true}};};
 vm.runInNewContext(fs.readFileSync('pwa.js','utf8'),{window,navigator,Notification,document:{getElementById:element},location:{hostname:host},localStorage:{getItem:key=>values.get(key)||null,setItem:(key,v)=>values.set(key,v),removeItem:key=>values.delete(key)},matchMedia:()=>({matches:false}),fetch,AbortSignal,crypto:{getRandomValues:bytes=>bytes.fill(7)},Uint8Array,atob,btoa});
 await new Promise(r=>setImmediate(r));
 return{element,events,calls,get permissionCalls(){return permissionCalls;},get removed(){return removed;},click:id=>element(id).handlers.click(),values};
}
const normal=await ui();assert.equal(normal.permissionCalls,0,'Never prompt for permission on page load');assert.equal(normal.element('push-toggle').disabled,false);
await normal.click('app-settings-open');assert.equal(normal.element('app-settings-dialog').open,true);assert.equal(normal.element('app-settings-open').attributes['aria-expanded'],'true');await normal.click('app-settings-close');assert.equal(normal.element('app-settings-dialog').open,false);assert.equal(normal.element('app-settings-open').attributes['aria-expanded'],'false');
await normal.click('push-toggle');assert.equal(normal.permissionCalls,1);assert.equal(normal.element('push-toggle').textContent,'Upozornenia zapnuté ✓');assert.equal(normal.element('push-toggle').disabled,true);
const subscribeCall=normal.calls.find(c=>c.url.endsWith('/subscribe'));assert.equal(subscribeCall.options.credentials,'omit');assert.equal(JSON.parse(subscribeCall.options.body).token,normal.values.get('u11-push-owner-v1'));
await normal.click('push-toggle');assert.equal(normal.removed,0,'Repeated enable cannot unsubscribe');await normal.click('push-disable');assert.equal(normal.removed,0,'Cancel preserves notifications');assert.equal(normal.calls.filter(c=>c.url.endsWith('/unsubscribe')).length,0);
const disabling=await ui({confirmRemoval:true});await disabling.click('push-toggle');await disabling.click('push-disable');assert.equal(disabling.removed,1);assert.equal(disabling.values.size,0);assert.equal(disabling.element('push-toggle').textContent,'Zapnúť upozornenia');
const rapid=await ui();await Promise.all([rapid.click('push-toggle'),rapid.click('push-toggle')]);assert.equal(rapid.removed,0,'Rapid taps never remove the new subscription');assert.equal(rapid.calls.filter(c=>c.url.endsWith('/subscribe')).length,1);assert.ok(!rapid.element('push-status').textContent.includes('vypnuté'));
const dismissed=await ui({dismissed:true});await dismissed.click('push-toggle');assert.ok(dismissed.element('push-status').textContent.includes('Prehliadač neudelil povolenie'));assert.equal(dismissed.calls.filter(c=>c.url.endsWith('/subscribe')).length,0);
const deny=await ui({denied:true});await deny.click('push-toggle');assert.ok(deny.element('push-status').textContent.includes('zablokované'));assert.equal(deny.calls.filter(c=>c.url.endsWith('/subscribe')).length,0);
const fail=await ui({fail:true});await fail.click('push-toggle');assert.equal(fail.removed,1);assert.ok(fail.element('push-status').textContent.includes('nepodarilo'));assert.equal(fail.element('push-toggle').textContent,'Zapnúť upozornenia');
const iphone=await ui({ios:true});await iphone.click('push-toggle');assert.equal(iphone.permissionCalls,0);assert.ok(iphone.element('install-dialog').open);assert.ok(iphone.element('install-instructions').textContent.includes('V Safari'));
const github=await ui({ios:true,host:'reklamix.github.io'});assert.equal(github.element('push-primary-link').hidden,false);assert.equal(github.calls.length,0);assert.equal(github.permissionCalls,0);
let prompted=0;normal.events.beforeinstallprompt({preventDefault(){},async prompt(){prompted++;},userChoice:Promise.resolve({outcome:'accepted'})});await normal.click('install-app');assert.equal(prompted,1);await normal.click('install-app');assert.ok(normal.element('install-dialog').open);assert.equal(prompted,1,'Installation prompt consumed once');
console.log('PWA manifest/icons, push lifecycle/security and consent/install UI states: PASS');
