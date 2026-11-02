import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const manifest=JSON.parse(fs.readFileSync('app.webmanifest','utf8'));
assert.equal(manifest.scope,'./');assert.equal(manifest.id,'./');assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./#sekcia=overview');
for(const icon of manifest.icons){const data=fs.readFileSync(icon.src);assert.equal(data.subarray(1,4).toString(),'PNG');const[n]=icon.sizes.split('x').map(Number);assert.equal(data.readUInt32BE(16),n);assert.equal(data.readUInt32BE(20),n);}
const source=fs.readFileSync('sw.js','utf8');assert.ok(!/addEventListener\(['"]fetch|caches\./.test(source));
const listeners={},notifications=[],opened=[],scope='https://treningy.begoal.sk/';
const self={registration:{scope,showNotification:(title,data)=>{notifications.push({title,...data});return Promise.resolve();}},skipWaiting:()=>Promise.resolve(),clients:{claim:()=>Promise.resolve(),matchAll:()=>Promise.resolve([]),openWindow:url=>{opened.push(url);return Promise.resolve();}},addEventListener:(name,fn)=>listeners[name]=fn};
vm.runInNewContext(source,{self,URL,Date});
async function push(data){let promise;listeners.push({data:{json:()=>data},waitUntil:p=>promise=p});await promise;return notifications.at(-1);}
async function click(url){let promise;listeners.notificationclick({notification:{data:{url},close(){}},waitUntil:p=>promise=p});await promise;return opened.at(-1);}
const n=await push({date:'2026-11-03',title:'Súboje',url:'https://evil.invalid/'});assert.equal(n.data.url,scope+'#trening=2026-11-03&sekcia=overview');assert.ok(n.body.includes('03.11.2026'));assert.equal(n.tag,'u11-training-2026-11-03');
const invalid=await push({date:'2026-02-30',title:'<script>ignored as plain text</script>'});assert.equal(invalid.data.url,scope+'#sekcia=overview');
assert.equal(await click('https://evil.invalid/'),scope);assert.equal(await click(scope+'api/push/config'),scope);assert.equal(await click(n.data.url),n.data.url);
const html=fs.readFileSync('index.html','utf8');assert.ok(html.includes('rel="manifest"'));assert.ok(html.includes('id="push-toggle"'));assert.ok(html.includes('id="install-dialog"'));
async function ui({ios=false,denied=false,fail=false,host='treningy.begoal.sk'}={}){
 const elements=new Map(),events={},calls=[],values=new Map();let permissionCalls=0,removed=0,current=null;
 const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:true,disabled:false,handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},showModal(){this.open=true;}});return elements.get(id);};
 const sub={endpoint:'https://fcm.googleapis.com/fcm/send/'+ 'a'.repeat(40),toJSON(){return{endpoint:this.endpoint,keys:{p256dh:'key',auth:'auth'}};},async unsubscribe(){current=null;removed++;return true;}};
 const registration={pushManager:{async getSubscription(){return current;},async subscribe(){current=sub;return sub;}}};
 const navigator={userAgent:ios?'iPhone':'Android',platform:ios?'iPhone':'Linux',maxTouchPoints:1,serviceWorker:{register:async()=>registration,ready:Promise.resolve(registration)}};
 const Notification={permission:denied?'denied':'default',async requestPermission(){permissionCalls++;this.permission=denied?'denied':'granted';return this.permission;}};
 const window={PushManager:function(){},Notification,addEventListener:(name,fn)=>events[name]=fn};
 const fetch=async(url,options)=>{calls.push({url,options});return{ok:!fail||url.endsWith('/config'),status:503,json:async()=>url.endsWith('/config')?{enabled:true,publicKey:Buffer.alloc(65).toString('base64url')}:{subscribed:true}};};
 vm.runInNewContext(fs.readFileSync('pwa.js','utf8'),{window,navigator,Notification,document:{getElementById:element},location:{hostname:host},localStorage:{getItem:key=>values.get(key)||null,setItem:(key,v)=>values.set(key,v),removeItem:key=>values.delete(key)},matchMedia:()=>({matches:false}),fetch,AbortSignal,crypto:{getRandomValues:bytes=>bytes.fill(7)},Uint8Array,atob,btoa});
 await new Promise(r=>setImmediate(r));
 return{element,events,calls,get permissionCalls(){return permissionCalls;},get removed(){return removed;},click:id=>element(id).handlers.click(),values};
}
const normal=await ui();assert.equal(normal.permissionCalls,0,'Never prompt for permission on page load');assert.equal(normal.element('push-toggle').disabled,false);
await normal.click('push-toggle');assert.equal(normal.permissionCalls,1);assert.equal(normal.element('push-toggle').textContent,'Vypnúť upozornenia');
const subscribeCall=normal.calls.find(c=>c.url.endsWith('/subscribe'));assert.equal(subscribeCall.options.credentials,'omit');assert.equal(JSON.parse(subscribeCall.options.body).token,normal.values.get('u11-push-owner-v1'));
await normal.click('push-toggle');assert.equal(normal.removed,1);assert.equal(normal.values.size,0);assert.equal(normal.element('push-toggle').textContent,'Zapnúť upozornenia');
const deny=await ui({denied:true});await deny.click('push-toggle');assert.ok(deny.element('push-status').textContent.includes('zablokované'));assert.equal(deny.calls.filter(c=>c.url.endsWith('/subscribe')).length,0);
const fail=await ui({fail:true});await fail.click('push-toggle');assert.equal(fail.removed,1);assert.ok(fail.element('push-status').textContent.includes('nepodarilo'));assert.equal(fail.element('push-toggle').textContent,'Zapnúť upozornenia');
const iphone=await ui({ios:true});await iphone.click('push-toggle');assert.equal(iphone.permissionCalls,0);assert.ok(iphone.element('install-dialog').open);assert.ok(iphone.element('install-instructions').textContent.includes('V Safari'));
const github=await ui({ios:true,host:'reklamix.github.io'});assert.equal(github.element('push-primary-link').hidden,false);assert.equal(github.calls.length,0);assert.equal(github.permissionCalls,0);
let prompted=0;normal.events.beforeinstallprompt({preventDefault(){},async prompt(){prompted++;},userChoice:Promise.resolve({outcome:'accepted'})});await normal.click('install-app');assert.equal(prompted,1);await normal.click('install-app');assert.ok(normal.element('install-dialog').open);assert.equal(prompted,1,'Installation prompt consumed once');
console.log('PWA manifest/icons, push lifecycle/security and consent/install UI states: PASS');
