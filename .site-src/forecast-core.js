(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAForecastCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='oa-timing-event/v1',VERSION='oa-forecast/1.0.0';
  const ASPECTS=[0,60,90,120,180];
  const mod=value=>((Number(value)%360)+360)%360;
  const signed=(a,b)=>{let d=mod(a-b);return d>180?d-360:d};
  const separation=(a,b)=>Math.abs(signed(a,b));
  function finite(value,label){const n=Number(value);if(!Number.isFinite(n))throw Error(label+' inválido.');return n}
  function iso(jd){return new Date((jd-2440587.5)*86400000).toISOString()}
  function bisect(a,b,fn){let fa=fn(a);for(let i=0;i<48&&b-a>1/864000;i++){const m=(a+b)/2,fm=fn(m);if((fa<=0)===(fm<=0)){a=m;fa=fm}else b=m}return(a+b)/2}
  function createEvent(value){
    const event={schema:SCHEMA,version:VERSION,id:String(value.id),technique:String(value.technique),source:String(value.source),target:String(value.target),aspect:finite(value.aspect,'Aspecto'),exactAt:String(value.exactAt),windowStart:String(value.windowStart),windowEnd:String(value.windowEnd),orb:finite(value.orb,'Orbe'),pass:Number(value.pass||1),applyingBefore:Boolean(value.applyingBefore),referenceFrame:value.referenceFrame||'geocentric-tropical',provenance:value.provenance||{}};
    for(const key of ['exactAt','windowStart','windowEnd'])if(!Number.isFinite(Date.parse(event[key])))throw Error(key+' inválido.');
    return Object.freeze(event);
  }
  function scanTransits({startJD,endJD,body,targetLongitude,targetName='ponto natal',bodyName='corpo',orb=1,step=.25,calc}){
    startJD=finite(startJD,'Início');endJD=finite(endJD,'Fim');orb=finite(orb,'Orbe');step=finite(step,'Passo');targetLongitude=finite(targetLongitude,'Alvo');
    if(endJD<=startJD||endJD-startJD>366*120||step<=0||step>1||orb<=0||orb>10||typeof calc!=='function')throw Error('Parâmetros de varredura inválidos.');
    const roots=[];
    for(const aspect of ASPECTS)for(const branch of aspect===0||aspect===180?[aspect]:[aspect,-aspect]){
      const fn=jd=>signed(calc(jd,body).longitude,targetLongitude+branch);let a=startJD,fa=fn(a);
      for(let b=Math.min(endJD,a+step);a<endJD;b=Math.min(endJD,b+step)){
        const fb=fn(b);if(fa===0||(fa<0&&fb>0)||(fa>0&&fb<0)){
          const exact=fa===0?a:bisect(a,b,fn),actual=separation(calc(exact,body).longitude,targetLongitude);
          if(Math.abs(actual-aspect)<1e-4&&!roots.some(x=>Math.abs(x.exact-exact)<1/1440&&x.aspect===aspect))roots.push({exact,aspect});
        }
        if(b===endJD)break;a=b;fa=fb;
      }
    }
    roots.sort((a,b)=>a.exact-b.exact);
    return roots.map((root,index)=>{
      const deviation=jd=>Math.abs(separation(calc(jd,body).longitude,targetLongitude)-root.aspect)-orb;
      let left=root.exact,right=root.exact;
      while(left>startJD&&deviation(left)>0)left-=Math.min(step,left-startJD);
      while(left>startJD&&deviation(left)<=0)left-=Math.min(step,left-startJD);
      if(left<root.exact&&deviation(left)>0)left=bisect(left,Math.min(root.exact,left+step),deviation);
      while(right<endJD&&deviation(right)<=0)right+=Math.min(step,endJD-right);
      if(right>root.exact&&deviation(right)>0)right=bisect(Math.max(root.exact,right-step),right,deviation);
      return createEvent({id:[body,targetName,root.aspect,root.exact.toFixed(6)].join(':'),technique:'transit',source:bodyName,target:targetName,aspect:root.aspect,exactAt:iso(root.exact),windowStart:iso(Math.max(startJD,left)),windowEnd:iso(Math.min(endJD,right)),orb,pass:index+1,applyingBefore:true,provenance:{engine:'Swiss Ephemeris/WASM',algorithm:VERSION,stepDays:step}});
    });
  }
  function relabel(events,technique,source,extra={}){
    return events.map((event,index)=>createEvent({...event,id:technique+':'+event.id,technique,source:source||event.source,pass:index+1,provenance:{...event.provenance,...extra}}));
  }
  function scanSecondaryProgression({birthJD,startJD,endJD,body,targetLongitude,targetName,bodyName,orb=1,step=1,calc}){
    birthJD=finite(birthJD,'Nascimento');
    const progressed=(jd,id)=>calc(birthJD+(jd-birthJD)/365.242189,id);
    return relabel(scanTransits({startJD,endJD,body,targetLongitude,targetName,bodyName,orb,step,calc:progressed}),'secondary-progression',bodyName,{key:'1 ephemeris day = 1 tropical year',birthJD});
  }
  function scanSolarArc({birthJD,startJD,endJD,sourceLongitude,targetLongitude,targetName,sourceName,orb=1,step=1,calc}){
    birthJD=finite(birthJD,'Nascimento');sourceLongitude=finite(sourceLongitude,'Fonte natal');
    const natalSun=calc(birthJD,0).longitude;
    const directed=(jd)=>({longitude:mod(sourceLongitude+signed(calc(birthJD+(jd-birthJD)/365.242189,0).longitude,natalSun))});
    return relabel(scanTransits({startJD,endJD,body:0,targetLongitude,targetName,bodyName:sourceName,orb,step,calc:directed}),'solar-arc-direction',sourceName,{key:'true solar arc; secondary progressed Sun',birthJD});
  }
  function scanReturn({startJD,endJD,body,natalLongitude,bodyName,step=.25,calc}){
    const all=scanTransits({startJD,endJD,body,targetLongitude:natalLongitude,targetName:bodyName+' natal',bodyName:bodyName+' em trânsito',orb:.01,step,calc});
    return relabel(all.filter(event=>event.aspect===0),'planetary-return','Retorno de '+bodyName,{kind:'longitude return'});
  }
  function buildTimeline(request){
    const techniques=new Set(request.techniques||['transit']),events=[];
    if(techniques.has('transit'))events.push(...scanTransits(request));
    if(techniques.has('secondary-progression'))events.push(...scanSecondaryProgression(request));
    if(techniques.has('solar-arc-direction'))events.push(...scanSolarArc(request));
    if(techniques.has('planetary-return'))events.push(...scanReturn({...request,natalLongitude:request.sourceLongitude??request.targetLongitude}));
    return events.sort((a,b)=>Date.parse(a.exactAt)-Date.parse(b.exactAt));
  }
  const themes={0:'concentração e início de um ciclo',60:'oportunidade de cooperação',90:'tensão que pede ajuste',120:'fluidez que pode ser desenvolvida',180:'polaridade que pede equilíbrio'};
  const bodyThemes={Sol:'direção, visibilidade e propósito',Lua:'necessidades, hábitos e pertencimento',Mercúrio:'comunicação, estudo e decisões',Vênus:'valores, vínculos e acordos',Marte:'iniciativa, desejo e conflito',Júpiter:'expansão, confiança e sentido',Saturno:'limites, responsabilidade e estrutura',Urano:'mudança, autonomia e ruptura',Netuno:'imaginação, idealização e fronteiras',Plutão:'intensidade, poder e transformação'};
  function interpretEvent(event,level='essential'){
    if(event?.schema!==SCHEMA)throw Error('Evento temporal incompatível.');
    const base=event.source+' em aspecto de '+event.aspect+'° com '+event.target,body=Object.keys(bodyThemes).find(name=>event.source.includes(name)),topic=bodyThemes[body]||'o tema simbolizado pelos pontos envolvidos';
    const text=level==='professional'?base+'; técnica '+event.technique+', exatidão '+event.exactAt+', orbe '+event.orb.toFixed(2)+'°, janela '+event.windowStart+' — '+event.windowEnd+'.':level==='intermediate'?base+' é tradicionalmente associado a '+themes[event.aspect]+' em '+topic+'. Observe o período sem presumir um acontecimento específico.':'Entre '+event.windowStart.slice(0,10)+' e '+event.windowEnd.slice(0,10)+', este ciclo convida a observar '+topic+' com atenção a '+themes[event.aspect]+'.';
    return {schema:'oa-timing-interpretation/v1',eventId:event.id,level,text,evidenceTrace:{eventSchema:event.schema,technique:event.technique,algorithm:event.provenance.algorithm,sourceFields:['source','target','aspect','windowStart','exactAt','windowEnd']},warning:'Hipótese simbólica, não previsão empiricamente demonstrada nem recomendação decisória.'};
  }
  function convergence(events){
    const sorted=[...events].sort((a,b)=>Date.parse(a.windowStart)-Date.parse(b.windowStart)),groups=[];
    for(const event of sorted){const group=groups.find(item=>Date.parse(event.windowStart)<=item.end&&Date.parse(event.windowEnd)>=item.start);if(group){group.events.push(event);group.start=Math.min(group.start,Date.parse(event.windowStart));group.end=Math.max(group.end,Date.parse(event.windowEnd))}else groups.push({start:Date.parse(event.windowStart),end:Date.parse(event.windowEnd),events:[event]})}
    return groups.filter(group=>new Set(group.events.map(x=>x.technique)).size>1).map(group=>({windowStart:new Date(group.start).toISOString(),windowEnd:new Date(group.end).toISOString(),techniques:[...new Set(group.events.map(x=>x.technique))],eventIds:group.events.map(x=>x.id),warning:'Convergência descritiva; técnicas correlacionadas não são evidências independentes.'}));
  }
  function toICS(events,title='Agenda do Observatório'){
    const stamp=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const clean=value=>String(value).replace(/[\\;,\n]/g,x=>'\\'+x);
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Observatorio Astrologico//PT-BR','X-WR-CALNAME:'+clean(title),...events.flatMap(event=>['BEGIN:VEVENT','UID:'+clean(event.id)+'@observatorio.local','DTSTAMP:'+stamp(new Date().toISOString()),'DTSTART:'+stamp(event.windowStart),'DTEND:'+stamp(event.windowEnd),'SUMMARY:'+clean(event.source+' '+event.aspect+'° '+event.target),'DESCRIPTION:'+clean('Exato: '+event.exactAt+'; hipótese simbólica, não garantia de acontecimento.'),'END:VEVENT']),'END:VCALENDAR'].join('\r\n')+'\r\n';
  }
  return {SCHEMA,VERSION,ASPECTS,createEvent,scanTransits,scanSecondaryProgression,scanSolarArc,scanReturn,buildTimeline,interpretEvent,convergence,toICS};
});
