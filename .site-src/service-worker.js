/* Observatório offline shell: all cached data remains on this origin/device.
 * Ephemerides are cached only through an explicit user gesture; never intercept auth.
 */
'use strict';
const VERSION='oa-offline-v4-legacy-code-20260922';
const CACHE='oa-pages-'+VERSION;
const STATIC=[
  './','./index.html','./app.html','./atlas.html','./entrada.html','./catalog-data.json',
  './base-data.js','./city-data.js','./pdf-font.js','./payload-manifest.json',
  './legacy-code-manifest.json',
  './swiss/swisseph-browser.js','./swiss/swisseph.js','./swiss/swisseph.wasm',
  './swiss/ephe/sepl_18.se1','./swiss/ephe/semo_18.se1','./swiss/ephe/seas_18.se1',
  './zodiac-mode.js','./traditional-engine.js','./research-core.js','./research-lab.js',
  './research-vault.js','./research-vault-ui.js',
  './swiss-scan-ui.js','./swiss-scan-worker.js',
  './rectification-core.js','./rectification-ui.js',
  './biwheel-core.js','./biwheel-ui.js',
  './timeline-core.js','./timeline-ui.js','./didactic-boundary.js','./guided-study.js','./study-missions.js',
  './reference-maps.js','./reference-maps-ui.js',
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
  const appPath=new URL('./app.html',self.registration.scope).pathname;
  const entryPath=new URL('./entrada.html',self.registration.scope).pathname;
  const atlasPath=new URL('./atlas.html',self.registration.scope).pathname;
  if(request.mode==='navigate'&&url.pathname!==rootPath&&url.pathname!==indexPath&&url.pathname!==appPath&&url.pathname!==entryPath&&url.pathname!==atlasPath)return;
  // Preserve the distinct cache keys for /, /index.html and /app.html.
  // In particular, the iframe must never receive the entry shell while offline.
  const path=url.pathname;
  const dynamicLegacy=path.startsWith(rootPath)&&
    /^legacy-(?:inline|json)-\d{3,}\.(?:js|mjs)$/.test(path.slice(rootPath.length));
  if(!allowed.has(path)&&!dynamicLegacy)return;
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
    const provenancePath=new URL('./ephemeris-provenance.json',self.registration.scope).pathname;
    // The optional Vite entry has a distinct URL. Never substitute its HTML
    // for the original application at the root or /index.html.
    try{
      const shellResponse=await fetch(new URL('./entrada.html',self.registration.scope),{cache:'reload'});
      if(shellResponse.ok){
        const shellText=await shellResponse.clone().text();
        for(const match of shellText.matchAll(/(?:src|href)=["'](\.\/assets\/[^"'?#]+)["']/g))
          allowed.add(new URL(match[1],self.registration.scope).pathname);
        await cache.put(new URL('./entrada.html',self.registration.scope).pathname,shellResponse);
      }
    }catch{}
    // Reload the manifest before considering a previously cached astronomical file valid.
    let manifestResponse;
    try{
      manifestResponse=await fetch(new URL(provenancePath,self.location.origin),{cache:'reload'});
    }catch{
      manifestResponse=await cache.match(provenancePath);
    }
    if(!manifestResponse?.ok)throw Error('Não foi possível validar as efemérides sem o manifesto.');
    const manifest=await manifestResponse.clone().json();
    if(manifest.schema!=='oa-asset-provenance/v1'||!manifest.assets)
      throw Error('Manifesto de efemérides inválido.');
    await cache.put(provenancePath,manifestResponse);
    const payloadPath=new URL('./payload-manifest.json',self.registration.scope).pathname;
    let payloadResponse;
    try{
      payloadResponse=await fetch(new URL(payloadPath,self.location.origin),{cache:'reload'});
    }catch{
      payloadResponse=await cache.match(payloadPath);
    }
    if(!payloadResponse?.ok)throw Error('Manifesto dos arquivos externos indisponível.');
    const payloadManifest=await payloadResponse.clone().json();
    if(payloadManifest.schema!=='oa-data-payload/v1'||!payloadManifest.files||
       !['base-data.js','city-data.js','pdf-font.js'].every(name=>
         typeof payloadManifest.files[name]?.sha256==='string'&&
         Number.isFinite(payloadManifest.files[name]?.bytes)))
      throw Error('Manifesto dos arquivos externos inválido.');
    await cache.put(payloadPath,payloadResponse);
    const codeManifestPath=new URL('./legacy-code-manifest.json',self.registration.scope).pathname;
    let codeResponse;
    try{
      codeResponse=await fetch(new URL(codeManifestPath,self.location.origin),{cache:'reload'});
    }catch{
      codeResponse=await cache.match(codeManifestPath);
    }
    if(!codeResponse?.ok)throw Error('Manifesto dos módulos legados indisponível.');
    const codeManifest=await codeResponse.clone().json();
    if(codeManifest.schema!=='oa-legacy-code/v1'||!codeManifest.files||
       Object.keys(codeManifest.files).length<10)
      throw Error('Manifesto dos módulos legados inválido.');
    for(const [name,details] of Object.entries(codeManifest.files)){
      if(!/^legacy-(?:inline|json)-\d{3,}\.(?:js|mjs)$/.test(name)||
         !/^[0-9a-f]{64}$/.test(details?.sha256)||
         !Number.isFinite(details?.bytes))
        throw Error('Arquivo legado sem integridade: '+name);
      allowed.add(new URL('./'+name,self.registration.scope).pathname);
    }
    await cache.put(codeManifestPath,codeResponse);
    const checksum=async response=>{
      const sum=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());
      return [...new Uint8Array(sum)].map(v=>v.toString(16).padStart(2,'0')).join('');
    };
    for(const path of allowed){
      try{
        const assetName=path.slice(rootPath.length);
        const asset=manifest.assets[assetName]||payloadManifest.files[assetName]||codeManifest.files[assetName];
        let existing=await cache.match(path);
        if(asset&&existing&&(await checksum(existing.clone()))!==asset.sha256){
          await cache.delete(path);
          existing=null;
        }
        if(!existing){
          const response=await fetch(new URL(path,self.registration.scope),{cache:'reload'});
          if(!response.ok||response.type!=='basic')
            throw Error('HTTP '+response.status);
          if(asset&&(await checksum(response.clone()))!==asset.sha256)
            throw Error('SHA-256 divergiu do manifesto de origem; arquivo recusado.');
          await cache.put(path,response);
        }
        count++;
      }catch(error){errors.push(path+': '+error.message)}
      target?.postMessage({type:'OA_OFFLINE_PROGRESS',id:message.id,count,total:allowed.size,errors});
    }
    target?.postMessage({type:'OA_OFFLINE_DONE',id:message.id,count,total:allowed.size,errors});
  })().catch(error=>{
    target?.postMessage({type:'OA_OFFLINE_DONE',id:message.id,count:0,total:allowed.size,errors:[error.message]});
  }));
});
