(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAChartCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='oa-chart-facts/v1',ENGINE='oa-core/1.0.0';
  const TIME_QUALITIES=new Set(['exact','documented','approximate','unknown']);
  const timed=new Set(['Ascendente','MC']);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const finite=(value,label)=>{if(value===null||value===undefined||String(value).trim()==='')throw Error(label+' não pode ficar em branco.');const n=Number(value);if(!Number.isFinite(n))throw Error(label+' deve ser numérico.');return n};
  const longitude=value=>((finite(value,'Longitude')%360)+360)%360;
  function canonical(value){
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  function timePolicy(quality,uncertaintyMinutes=0){
    if(!TIME_QUALITIES.has(quality))throw Error('Qualidade de horário inválida.');
    const minutes=quality==='unknown'?null:Math.max(0,finite(uncertaintyMinutes,'Incerteza'));
    if(quality==='approximate'&&!minutes)throw Error('Horário aproximado exige incerteza maior que zero.');
    return {quality,uncertaintyMinutes:minutes,allowsAngles:quality!=='unknown',allowsHouses:quality!=='unknown',warning:
      quality==='unknown'?'Hora desconhecida: ângulos, casas e fatores derivados foram suprimidos.':
      quality==='approximate'?'Hora aproximada: ângulos e casas podem variar dentro da margem informada.':null};
  }
  function zoneParts(date,timeZone){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
    return Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
  }
  function resolveCivilTime({date,time,timeZone}){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!/^\d{2}:\d{2}(?::\d{2})?$/.test(time||''))throw Error('Data e hora civil inválidas.');
    if(typeof timeZone!=='string'||!timeZone)throw Error('Fuso IANA obrigatório.');
    const [year,month,day]=date.split('-').map(Number),[hour,minute,second=0]=time.split(':').map(Number);
    const wall=Date.UTC(year,month-1,day,hour,minute,second);let instant=wall;
    for(let i=0;i<4;i++){const p=zoneParts(new Date(instant),timeZone),shown=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second),next=instant+(wall-shown);if(next===instant)break;instant=next}
    const actual=zoneParts(new Date(instant),timeZone);
    if(actual.year!==year||actual.month!==month||actual.day!==day||actual.hour!==hour||actual.minute!==minute||actual.second!==second)throw Error('Horário civil inexistente ou ambíguo na transição do fuso; informe o deslocamento documentado.');
    return {utc:new Date(instant).toISOString(),timeZone,offsetMinutes:(wall-instant)/60000,source:'IANA/Intl',warning:'Confirme mudanças históricas do fuso em fonte documental.'};
  }
  function sensitivity(samples,toleranceDegrees=0.25){
    if(!Array.isArray(samples)||!samples.length)throw Error('Amostras de incerteza obrigatórias.');
    const keys=new Set(samples.flatMap(x=>Object.keys(x||{}))),stable=[],variable=[];
    for(const key of keys){const values=samples.map(x=>x?.[key]).filter(Number.isFinite);if(values.length!==samples.length){variable.push(key);continue}const span=Math.max(...values)-Math.min(...values);(span<=toleranceDegrees?stable:variable).push(key)}
    return {sampleCount:samples.length,toleranceDegrees,stable,variable};
  }
  function createFacts(input={}){
    if(!input.subject||typeof input.subject!=='object')throw Error('Dados do sujeito são obrigatórios.');
    const policy=timePolicy(input.subject.timeQuality||'unknown',input.subject.uncertaintyMinutes||0);
    const bodies=(input.bodies||[]).map((body,index)=>{
      if(!body||typeof body.name!=='string'||!body.name.trim())throw Error('Corpo '+index+' sem nome.');
      return {name:body.name.trim(),longitude:longitude(body.longitude),latitude:body.latitude==null?null:finite(body.latitude,'Latitude'),speed:body.speed==null?null:finite(body.speed,'Velocidade'),house:policy.allowsHouses&&body.house!=null?finite(body.house,'Casa'):null};
    });
    const angles=policy.allowsAngles?(input.angles||[]).map(x=>({name:String(x.name),longitude:longitude(x.longitude)})).filter(x=>timed.has(x.name)):[];
    const facts={schema:SCHEMA,engineVersion:ENGINE,subject:{label:String(input.subject.label||'Mapa sem nome'),utc:input.subject.utc||null,timeQuality:policy.quality,uncertaintyMinutes:policy.uncertaintyMinutes,location:input.subject.location?clone(input.subject.location):null},referenceFrame:{zodiac:input.referenceFrame?.zodiac||'tropical',ayanamsha:input.referenceFrame?.ayanamsha||null,houseSystem:input.referenceFrame?.houseSystem||null},bodies,angles,warnings:policy.warning?[policy.warning]:[],provenance:{calculator:input.provenance?.calculator||'Swiss Ephemeris/WASM',ephemeris:input.provenance?.ephemeris||null,rulesVersion:input.provenance?.rulesVersion||'oa-interpretation/1.0.0'}};
    return deepFreeze(facts);
  }
  function deepFreeze(value){Object.freeze(value);Object.values(value).forEach(x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x))deepFreeze(x)});return value}
  async function fingerprint(facts){
    const bytes=new TextEncoder().encode(canonical(facts));
    if(globalThis.crypto?.subtle){const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('')}
    let h=2166136261;for(const byte of bytes)h=Math.imul(h^byte,16777619);return 'fnv1a-'+(h>>>0).toString(16).padStart(8,'0');
  }
  return {SCHEMA,ENGINE,canonical,timePolicy,resolveCivilTime,sensitivity,createFacts,fingerprint};
});
