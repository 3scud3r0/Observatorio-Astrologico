/* Observatório offline shell: all cached data remains on this origin/device.
 * Ephemerides are cached only through an explicit user gesture; never intercept auth.
 */
'use strict';
const VERSION='oa-offline-v1-20260921';
const CACHE='oa-pages-'+VERSION;
const STATIC=[
  './','./index.html',
  './swiss/swisseph-browser.js','./swiss/swisseph.js','./swiss/swisseph.wasm',
  './swiss/ephe/sepl_18.se1','./swiss/ephe/semo_18.se1','./swiss/ephe/seas_18.se1',
  './traditional-engine.js','./research-core.js','./research-lab.js',
  './research-vault.js','./research-vault-ui.js',
  './swiss-scan-ui.js','./swiss-scan-worker.js',
  './timeline-core.js','./timeline-ui.js','./guided-study.js',
  './manifest.webmanifest','./app-icon.svg','./offline-client.js',
  './ephemeris-provenance.json'
];
const allowed=new Set(STATIC.map(x=>new URL(x,self.registration.scope).pathname));
const rootPath=new URL('./',self.registration.scope).pathname;
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();
  for(const name of names)
    if(name.startsWith('oa-pages-')&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(/\batlas-auth\.json$/.test(url.pathname))return;
  // Navigation fallback only covers the actual application root, not arbitrary URLs.
  const indexPath=new URL('./index.html',self.registration.scope).pathname;
  if(request.mode==='navigate'&&url.pathname!==rootPath&&url.pathname!==indexPath)return;
  const path=request.mode==='navigate'?rootPath:url.pathname;
  if(!allowed.has(path))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(path);
    const ephemeris=path.includes('/swiss/ephe/');
    if(ephemeris&&cached)return cached;
    try{
      const result=await fetch(request);
      if(result.ok&&result.type==='basic'&&!url.search){
        try{await cache.put(path,result.clone())}catch(error){
          // A storage quota failure must not block the online calculation.
          console.warn('Observatório offline cache:',error);
        }
      }
      return result;
    }catch(error){
      if(cached)return cached;
      throw error;
    }
  })());
});
self.addEventListener('message',event=>{
  const message=event.data;
  if(!message||message.type!=='OA_OFFLINE_PREPARE'||typeof message.id!=='string')return;
  const target=event.source;
  event.waitUntil((async()=>{
    let count=0,errors=[];
    const cache=await caches.open(CACHE);
    for(const path of allowed){
      try{
        const existing=await cache.match(path);
        if(!existing){
          const response=await fetch(new URL(path,self.registration.scope),{cache:'reload'});
          if(!response.ok||response.type!=='basic')
            throw Error('HTTP '+response.status);
          await cache.put(path,response);
        }
        count++;
      }catch(error){errors.push(path+': '+error.message)}
      target?.postMessage({type:'OA_OFFLINE_PROGRESS',id:message.id,count,total:allowed.size,errors});
    }
    target?.postMessage({type:'OA_OFFLINE_DONE',id:message.id,count,total:allowed.size,errors});
  })());
});
