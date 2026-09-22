/* Observatório: prospective audit core. No astrology implies causal evidence.
 * Universal module: browser window.OAResearch; Node module.exports.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAResearch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='oa-prospective-audit/v1';
  const LIMIT=50000;
  function text(value,label,max=LIMIT){
    if(typeof value!=='string'||!value.trim()||value.length>max)
      throw Error(label+': texto obrigatório (até '+max+' caracteres).');
    return value.trim();
  }
  function date(value,label){
    if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))
      throw Error(label+': use AAAA-MM-DD.');
    const d=new Date(value+'T00:00:00.000Z');
    if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)
      throw Error(label+': data inexistente.');
    return value;
  }
  function finite(value,label,min,max){
    if(value===null||value===undefined||String(value).trim()==='')
      throw Error(label+': informe um número.');
    if(typeof value!=='number'&&typeof value!=='string'||typeof value==='boolean')
      throw Error(label+': número inválido.');
    const n=Number(value);
    if(!Number.isFinite(n)||n<min||n>max)throw Error(label+': fora do intervalo '+min+' a '+max+'.');
    return n;
  }
  function protocol(input){
    if(!input||typeof input!=='object'||Array.isArray(input))
      throw Error('Protocolo inválido.');
    const start=date(input.windowStart,'Início'),end=date(input.windowEnd,'Fim');
    if(start>end)throw Error('A janela termina antes de começar.');
    if(typeof input.predicted!=='boolean')throw Error('Defina a hipótese como previsão de ocorrência ou ausência.');
    const techniques=Array.isArray(input.techniques)?input.techniques:[];
    if(!techniques.length||techniques.length>20)throw Error('Defina pelo menos uma técnica (máximo 20).');
    const result={
      question:text(input.question,'Pergunta'),
      techniques:techniques.map(t=>text(t,'Técnica',120)),
      configuration:text(input.configuration,'Configuração/orbes'),
      windowStart:start,windowEnd:end,
      criterion:text(input.criterion,'Critério de confirmação'),
      nonConfirmation:text(input.nonConfirmation,'Critério de não confirmação'),
      baseline:text(input.baseline,'Referência sem astrologia'),
      predicted:input.predicted,
      provenance:input.provenance===undefined?null:JSON.parse(JSON.stringify(input.provenance))
    };
    // Added only when supplied: existing sealed v1 hashes remain byte-for-byte verifiable.
    if(input.baselineRate!==undefined&&input.baselineRate!==null&&input.baselineRate!=='')
      result.baselineRate=finite(input.baselineRate,'Taxa-base',0,1);
    if(input.closureMode!==undefined){
      if(!['fixed-date','first-confirming-event'].includes(input.closureMode))
        throw Error('Modo de encerramento inválido.');
      result.closureMode=input.closureMode;
    }
    return result;
  }
  function canonical(record){
    return JSON.stringify({schema:SCHEMA,protocol:record.protocol,createdAt:record.createdAt});
  }
  async function digest(value,subtle){
    const cryptoSubtle=subtle||globalThis.crypto?.subtle;
    if(!cryptoSubtle)throw Error('SHA-256 requer HTTPS ou contexto seguro.');
    const bytes=new TextEncoder().encode(value);
    const result=await cryptoSubtle.digest('SHA-256',bytes);
    return [...new Uint8Array(result)].map(n=>n.toString(16).padStart(2,'0')).join('');
  }
  async function seal(input,{now=()=>new Date().toISOString(),subtle}={}){
    const p=protocol(input),createdAt=now();
    if(!Number.isFinite(Date.parse(createdAt)))throw Error('Relógio inválido.');
    // A prospective protocol must be closed before the first instant of its window (UTC).
    if(Date.parse(createdAt)>=Date.parse(p.windowStart+'T00:00:00.000Z'))
      throw Error('Hipótese retrospectiva: sele antes do início da janela em UTC.');
    const record={schema:SCHEMA,protocol:p,createdAt,hash:''};
    record.hash=await digest(canonical(record),subtle);
    return record;
  }
  async function verify(record,subtle){
    if(!record||record.schema!==SCHEMA||!/^[a-f0-9]{64}$/.test(record.hash||''))
      return false;
    try{
      const p=protocol(record.protocol);
      if(JSON.stringify(p)!==JSON.stringify(record.protocol))return false;
      return (await digest(canonical(record),subtle))===record.hash;
    }catch{return false}
  }
  function assessment(record,observed,evidence,now=new Date().toISOString()){
    if(!record||record.schema!==SCHEMA||!/^[a-f0-9]{64}$/.test(record.hash||''))
      throw Error('Registre e sele a hipótese antes de avaliar.');
    if(observed!==true&&observed!==false&&observed!==null)
      throw Error('Resultado: sim, não ou inconclusivo.');
    const when=Date.parse(now);
    if(typeof now!=='string'||!Number.isFinite(when))
      throw Error('Data da avaliação inválida.');
    const start=Date.parse(date(record.protocol?.windowStart,'Início')+'T00:00:00.000Z');
    const end=Date.parse(date(record.protocol?.windowEnd,'Fim')+'T00:00:00.000Z')+86400000;
    if(observed!==null&&when<start)
      throw Error('Avaliação de ocorrência anterior ao início da janela.');
    if(observed===false&&when<end)
      throw Error('Ausência de ocorrência só pode ser avaliada após o encerramento da janela UTC.');
    return {
      hash:record.hash,
      observed,
      evidence:text(evidence,'Evidência/justificativa',LIMIT),
      evaluatedAt:now
    };
  }
  function confusion(records){
    let tp=0,fp=0,fn=0,tn=0,inconclusive=0;
    for(const item of records){
      const record=item.record||item,review=item.assessment;
      if(!record||!record.protocol||typeof record.protocol.predicted!=='boolean')
        throw Error('Registro estatístico inválido.');
      if(!review||review.observed===null||review.observed===undefined){inconclusive++;continue}
      if(typeof review.observed!=='boolean')throw Error('Resultado observado inválido.');
      if(record.protocol.predicted){if(review.observed)tp++;else fp++}
      else if(review.observed)fn++;else tn++;
    }
    const ratio=(a,b)=>b===0?null:a/b;
    return {tp,fp,fn,tn,inconclusive,
      precision:ratio(tp,tp+fp),sensitivity:ratio(tp,tp+fn),
      specificity:ratio(tn,tn+fp),falsePositiveRate:ratio(fp,fp+tn),
      evaluated:tp+fp+fn+tn,total:records.length};
  }
  function validTime(value){
    const time=text(value,'Hora natal',12);
    if(!/^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/.test(time))
      throw Error('Hora natal: use HH:MM ou HH:MM:SS.');
    return time;
  }
  function provenance(input){
    if(!input||typeof input!=='object')throw Error('Dados de origem inválidos.');
    const precision=['documentada','aproximada','desconhecida'];
    if(!precision.includes(input.timePrecision))throw Error('Informe a qualidade da hora natal.');
    const result={
      schema:'oa-chart-provenance/v1',
      birthDate:date(input.birthDate,'Data natal'),
      birthTime:input.timePrecision==='desconhecida'?null:validTime(input.birthTime),
      timePrecision:input.timePrecision,
      timeSource:input.timePrecision==='documentada'?text(input.timeSource,'Fonte da hora',300):
        input.timeSource===undefined||input.timeSource===''?'':text(input.timeSource,'Fonte da hora',300),
      timezone:input.timePrecision==='desconhecida'?null:finite(input.timezone,'UTC',-14,14),
      latitude:finite(input.latitude,'Latitude',-90,90),
      longitude:finite(input.longitude,'Longitude geográfica',-180,180),
      houseSystem:input.timePrecision==='desconhecida'?null:text(input.houseSystem,'Casas',80),
      zodiac:text(input.zodiac,'Zodíaco',60),
      ephemeris:'@swisseph/browser@1.3.1; sepl_18.se1; semo_18.se1; seas_18.se1',
      engine:'OATraditionalEngine',
      recordedAt:new Date().toISOString()
    };
    return result;
  }
  return {SCHEMA,protocol,canonical,digest,seal,verify,assessment,confusion,provenance,date,finite};
});
