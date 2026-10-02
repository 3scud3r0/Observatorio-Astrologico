/* Central, cancellable RPC boundary. Astronomy operations can be added without exposing mutable UI state. */
importScripts('./chart-core.js','./interpretation-engine.js','./forecast-core.js');
const cancelled=new Set();
let swissPromise=null;
async function swiss(){
  if(!swissPromise)swissPromise=(async()=>{const {SwissEphemeris}=await import('./swiss/swisseph-browser.js');const engine=new SwissEphemeris();await engine.init(new URL('./swiss/swisseph.wasm',self.location.href).href);await engine.loadEphemerisFiles(['sepl_18.se1','semo_18.se1','seas_18.se1'].map(name=>({name,url:new URL('./swiss/ephe/'+name,self.location.href).href})));return engine})().catch(error=>{swissPromise=null;throw error});
  return swissPromise;
}
async function calculatePositions(params,id){
  const jd=Number(params?.jd),bodies=params?.bodies;
  if(!Number.isFinite(jd)||!Array.isArray(bodies)||!bodies.length||bodies.length>32)throw Error('JD e lista de corpos são obrigatórios.');
  const engine=await swiss(),result=[];
  for(let index=0;index<bodies.length;index++){
    if(cancelled.has(id))throw Error('Operação cancelada.');
    const body=Number(bodies[index]);if(!Number.isInteger(body)||body<0||body>99)throw Error('Identificador de corpo inválido.');
    const value=engine.calculatePosition(jd,body,2|256);
    if(!Number.isFinite(value?.longitude))throw Error('Posição Swiss indisponível.');
    result.push({body,longitude:value.longitude,latitude:value.latitude??null,speed:value.longitudeSpeed??value.speed??null});
    self.postMessage({type:'progress',id,progress:(index+1)/bodies.length});
  }
  return {jd,flags:258,engine:'Swiss Ephemeris/WASM',positions:result};
}
async function scanTransits(params,id){
  const engine=await swiss();
  if(cancelled.has(id))throw Error('Operação cancelada.');
  return self.OAForecastCore.scanTransits({...params,calc:(jd,body)=>{if(cancelled.has(id))throw Error('Operação cancelada.');const value=engine.calculatePosition(jd,body,2|256);return {longitude:value.longitude}}});
}
async function buildTimeline(params,id){
  const engine=await swiss();
  if(cancelled.has(id))throw Error('Operação cancelada.');
  return self.OAForecastCore.buildTimeline({...params,calc:(jd,body)=>{if(cancelled.has(id))throw Error('Operação cancelada.');const value=engine.calculatePosition(jd,body,2|256);return {longitude:value.longitude}}});
}
self.onmessage=async event=>{
  const message=event.data||{},id=message.id;
  if(message.type==='cancel'){cancelled.add(id);return}
  if(message.type!=='request'||typeof id!=='string')return;
  try{
    self.postMessage({type:'progress',id,progress:0.1});
    if(cancelled.has(id))throw Error('Operação cancelada.');
    let result;
    if(message.method==='calculatePositions')result=await calculatePositions(message.params,id);
    else if(message.method==='scanTransits')result=await scanTransits(message.params,id);
    else if(message.method==='buildTimeline')result=await buildTimeline(message.params,id);
    else if(message.method==='createFacts')result=self.OAChartCore.createFacts(message.params);
    else if(message.method==='fingerprint')result=await self.OAChartCore.fingerprint(message.params);
    else if(message.method==='interpret')result=self.OAInterpretationEngine.interpret(message.params.facts,message.params.options);
    else throw Error('Método RPC não permitido: '+message.method);
    if(cancelled.has(id))throw Error('Operação cancelada.');
    self.postMessage({type:'progress',id,progress:1});self.postMessage({type:'result',id,result});
  }catch(error){self.postMessage({type:'error',id,error:{name:error.name||'Error',message:error.message||String(error)}})}finally{cancelled.delete(id)}
};
