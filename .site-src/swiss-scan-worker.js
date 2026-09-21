/* Swiss Ephemeris runs in a dedicated module worker; no fallbacks to Moshier. */
'use strict';
let enginePromise=null,job=null;
const FLAGS=2|256; // SwissEphemeris | Speed in @swisseph/browser@1.3.1
const DAY=86400000;
const send=(type,id,detail={})=>self.postMessage({type,id,...detail});
function number(value,label,min,max){
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)
    throw Error(label+': valor inválido.');
  return value;
}
function instant(value,label){
  if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{3})?)?Z$/.test(value))
    throw Error(label+': use UTC ISO-8601.');
  const ms=Date.parse(value);
  if(!Number.isFinite(ms))throw Error(label+': data inválida.');
  return ms;
}
const mod=x=>((x%360)+360)%360;
const sep=(a,b)=>{const n=Math.abs(mod(a)-mod(b));return Math.min(n,360-n)};
async function initialize(){
  if(enginePromise)return enginePromise;
  enginePromise=(async()=>{
    const {SwissEphemeris}=await import('./swiss/swisseph-browser.js');
    if(typeof SwissEphemeris!=='function')throw Error('Pacote Swiss inválido.');
    const swe=new SwissEphemeris();
    await swe.init(new URL('./swiss/swisseph.wasm',import.meta.url).href);
    const names=['sepl_18.se1','semo_18.se1','seas_18.se1'];
    await swe.loadEphemerisFiles(names.map(name=>({
      name,url:new URL('./swiss/ephe/'+name,import.meta.url).href
    })));
    return swe;
  })().catch(error=>{enginePromise=null;throw error});
  return enginePromise;
}
function position(swe,ms,body){
  const pos=swe.calculatePosition(ms/DAY+2440587.5,body,FLAGS);
  if(!pos||!Number.isFinite(pos.longitude))
    throw Error('Longitude Swiss indisponível para esta data.');
  return pos;
}
function boundary(swe,a,b,body,target,aspect,orb,fa){
  // Called only when sampling detects an actual crossing.
  for(let k=0;k<35&&b-a>1000;k++){
    const mid=Math.floor((a+b)/2);
    const p=position(swe,mid,body);
    const fm=Math.abs(sep(p.longitude,target)-aspect)-orb;
    if((fa<=0)===(fm<=0)){a=mid;fa=fm}else b=mid;
  }
  return new Date(Math.floor((a+b)/2)).toISOString();
}
async function scan(request,active){
  const body=number(request.body,'Corpo',0,9),
    target=number(request.target,'Alvo natal',0,360),
    aspect=number(request.aspect,'Aspecto',0,180),
    orb=number(request.orb,'Orbe',0.01,15),
    hours=number(request.stepHours,'Amostragem',1,24);
  const start=instant(request.start,'Início'),end=instant(request.end,'Fim');
  if(end<=start||end-start>366*5*DAY)throw Error('Período: maior que zero e até cinco anos.');
  const step=hours*3600000,total=Math.ceil((end-start)/step);
  if(total>40000)throw Error('Consulta muito extensa para esta amostragem.');
  send('status',active.id,{message:'Carregando Swiss WASM e arquivos locais…'});
  const swe=await initialize();
  if(active.cancelled){send('cancelled',active.id);return}
  let previous=start,pp=position(swe,start,body);
  let pf=Math.abs(sep(pp.longitude,target)-aspect)-orb;
  let current=pf<=0?{start:new Date(start).toISOString(),clippedStart:true,
    closest:new Date(start).toISOString(),deviation:pf+orb}:null;
  const windows=[];
  for(let i=1;i<=total;i++){
    if(active.cancelled){send('cancelled',active.id,{completed:i-1,total});return}
    const ms=Math.min(end,start+i*step),pos=position(swe,ms,body);
    const f=Math.abs(sep(pos.longitude,target)-aspect)-orb;
    if(current&&f+orb<current.deviation){
      current.closest=new Date(ms).toISOString();
      current.deviation=f+orb;
    }
    if(!current&&pf>0&&f<=0){
      current={start:boundary(swe,previous,ms,body,target,aspect,orb,pf),
        clippedStart:false,closest:new Date(ms).toISOString(),deviation:f+orb};
    }else if(current&&pf<=0&&f>0){
      current.end=boundary(swe,previous,ms,body,target,aspect,orb,pf);
      current.clippedEnd=false;
      windows.push(current);current=null;
      if(windows.length>1000)throw Error('Mais de 1.000 janelas; reduza o intervalo.');
    }
    previous=ms;pf=f;
    if(i%64===0||i===total){
      send('progress',active.id,{completed:i,total,windows:windows.length});
      // Yield so CANCEL is processed; worker remains responsive to new messages.
      await new Promise(resolve=>setTimeout(resolve,0));
    }
  }
  if(current){
    current.end=new Date(end).toISOString();current.clippedEnd=true;
    windows.push(current);
  }
  send('done',active.id,{windows,total,body,target,aspect,orb,
    source:'SwissEphemeris@1.3.1; SWIEPH|SPEED; sepl_18/semo_18/seas_18',
    limitation:'Entradas/saídas são refinadas apenas quando a amostragem detecta a transição; janelas menores que o passo podem ser omitidas.'});
}
self.onmessage=event=>{
  const request=event.data;
  if(!request||typeof request.id!=='string')return;
  if(request.type==='cancel'){
    if(job&&job.id===request.id)job.cancelled=true;
    return;
  }
  if(request.type!=='scan')return;
  if(job){send('error',request.id,{message:'Outra consulta está em execução.'});return}
  const active={id:request.id,cancelled:false};
  job=active;
  scan(request,active).catch(error=>send('error',active.id,{message:error.message||String(error)}))
    .finally(()=>{if(job===active)job=null});
};
