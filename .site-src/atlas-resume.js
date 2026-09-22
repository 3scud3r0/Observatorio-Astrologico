/* Resume Atlas volumes only when the entire calculation contract matches.
 * No natal data is persisted in the resume index; only its SHA-256 fingerprint.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAAtlasResume=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='oa-atlas-resume/v1';
  async function fingerprint(input,{subtle}={}){
    if(!input||typeof input!=='object')throw Error('Contrato de consulta inválido.');
    const hash=subtle||globalThis.crypto?.subtle;
    if(!hash)throw Error('SHA-256 indisponível em contexto inseguro.');
    const text=JSON.stringify({schema:SCHEMA,engine:'SwissEphemeris@1.3.1',input});
    const result=await hash.digest('SHA-256',new TextEncoder().encode(text));
    return [...new Uint8Array(result)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  async function recover(previous,{fingerprint:hash,start,end,total,read}){
    if(!previous||typeof previous!=='object'||typeof read!=='function')
      return null;
    if(!/^[a-f0-9]{64}$/.test(hash)||previous.fingerprint!==hash||
       previous.start!==start||previous.end!==end||previous.total!==total||
       !/^[0-9a-f-]{20,64}$/i.test(previous.id||'')||
       !Number.isInteger(previous.completed)||previous.completed<0||
       previous.completed>total||!Number.isInteger(total)||total<1)
      return null;
    let completed=0;
    for(let i=0;i<previous.completed;i++){
      const entry=await read(previous.id+':'+i);
      const volume=entry?.report?.atlasVolume;
      if(!volume||volume.index!==i+1||volume.total!==total||
         volume.periodStart!==start||volume.periodEnd!==end)
        break;
      completed++;
    }
    return {id:previous.id,start,end,total,completed,fingerprint:hash};
  }
  const DAY=86400000;
  function validDay(value,label){
    if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d$/.test(value)||
       !Number.isFinite(Date.parse(value+'T00:00:00.000Z'))||
       new Date(Date.parse(value+'T00:00:00.000Z')).toISOString().slice(0,10)!==value)
      throw Error(label+': data inválida.');
    return Date.parse(value+'T00:00:00.000Z');
  }
  function mergeVolumes(reports){
    if(!Array.isArray(reports)||!reports.length||reports.length>500)
      throw Error('Forneça de 1 a 500 volumes Atlas.');
    const contacts=[];
    const first=reports[0],identity=first?.atlasVolume;
    if(!identity||!Number.isInteger(identity.total)||identity.total<1||
       identity.total>500||identity.total<reports.length)
      throw Error('Metadados de volumes inválidos.');
    const overallStart=validDay(identity.periodStart,'Início global');
    const overallEnd=validDay(identity.periodEnd,'Fim global');
    if(overallEnd<overallStart)throw Error('Período global invertido.');
    let expectedStart=overallStart,previousTails=new Map(),boundaryJoins=0;
    const key=c=>[c.scope,c.i,c.k,c.z,c.label].join('|');
    for(let i=0;i<reports.length;i++){
      const report=reports[i],meta=report?.atlasVolume;
      if(!meta||meta.index!==i+1||meta.total!==identity.total||
         meta.periodStart!==identity.periodStart||meta.periodEnd!==identity.periodEnd||
         !Array.isArray(report.contacts)||!report.input)
        throw Error('Volumes fora de ordem, alterados ou incompatíveis.');
      const from=validDay(report.input.gStart,'Início de volume');
      const to=validDay(report.input.gEnd,'Fim de volume');
      if(from!==expectedStart||to<from||to>overallEnd)
        throw Error('Volumes com lacuna, sobreposição ou fora do intervalo.');
      expectedStart=to+DAY;
      const hours=Number(report.method?.gridHours||3);
      if(!Number.isFinite(hours)||hours<.25||hours>24)
        throw Error('Amostragem de volume inválida.');
      const step=hours/24,nextTails=new Map();
      for(const raw of report.contacts){
        if(!raw||typeof raw.label!=='string'||!raw.label||
           !Number.isFinite(raw.start)||!Number.isFinite(raw.last)||
           raw.last<raw.start||!Number.isFinite(raw.peakJD)||
           !Number.isFinite(raw.orb)||raw.orb<0)
          throw Error('Janela de volume malformada.');
        const entry=JSON.parse(JSON.stringify(raw));
        const old=raw.truncatedLeft?previousTails.get(key(raw)):null;
        const gap=old?entry.start-old.last:Infinity;
        if(old&&gap>=0&&gap<=step+1e-5){
          old.last=entry.last;old.endUTC=entry.endUTC;
          old.truncatedRight=Boolean(entry.truncatedRight);
          old.samples=(Number(old.samples)||0)+(Number(entry.samples)||0);
          old.min=Math.min(Number(old.min??old.orb),Number(entry.min??entry.orb));
          if(entry.orb<old.orb){
            old.orb=entry.orb;old.peakJD=entry.peakJD;old.peakUTC=entry.peakUTC;
            old.bestJ=entry.bestJ;
          }
          boundaryJoins++;
          if(entry.truncatedRight)nextTails.set(key(entry),old);
        }else{
          contacts.push(entry);
          if(entry.truncatedRight)nextTails.set(key(entry),entry);
        }
      }
      previousTails=nextTails;
    }
    return {
      schema:'oa-atlas-merged/v1',
      periodStart:identity.periodStart,periodEnd:identity.periodEnd,
      totalVolumes:identity.total,completedVolumes:reports.length,
      complete:reports.length===identity.total&&expectedStart===overallEnd+DAY,
      boundaryJoins,
      contacts:contacts.sort((a,b)=>a.peakJD-b.peakJD),
      limitation:'Unifica somente contatos idênticos com continuidade amostrada nas fronteiras de volumes consecutivos. Eventos mais breves do que o passo de amostragem podem permanecer não detectados; o agrupamento não demonstra validade preditiva.'
    };
  }
  return {SCHEMA,fingerprint,recover,mergeVolumes};
});
