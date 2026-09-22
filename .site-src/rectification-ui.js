(()=>{
  'use strict';
  const root=document.getElementById('oa-rect'),engine=window.OARectification;
  const $=id=>document.getElementById('oa-rect-'+id);
  if(!root||!engine||!$('panel'))return;
  const planets=['Sol','Lua','Mercúrio','Vênus','Marte','Júpiter','Saturno','Urano','Netuno','Plutão'];
  let last=null;
  const report=text=>{$('output').textContent=text};
  const parseTime=(value,name)=>{
    if(!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value))throw Error(name+': HH:MM inválido.');
    const [hour,minute]=value.split(':').map(Number);
    return hour*60+minute;
  };
  function parseEvents(text){
    const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(lines.length<2||lines.length>100)throw Error('Informe de 2 a 100 eventos com fontes.');
    return lines.map((line,index)=>{
      const fields=line.split('|');
      if(fields.length<6)throw Error('Linha '+(index+1)+': seis campos separados por | são obrigatórios.');
      const [instant,planet,angle,aspect,weight,...source]=fields.map(x=>x.trim());
      if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(instant)||
          !Number.isFinite(Date.parse(instant))||new Date(instant).toISOString()!==instant.slice(0,-1)+'.000Z')
        throw Error('Linha '+(index+1)+': informe instante UTC exato, AAAA-MM-DDTHH:MM:SSZ.');
      const body=planets.indexOf(planet);
      if(body<0)throw Error('Linha '+(index+1)+': planeta não reconhecido.');
      return {
        jd:Date.parse(instant)/86400000+2440587.5,body,
        angle,aspect,weight,source:source.join('|').trim()
      };
    });
  }
  function formatMinute(n){
    return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
  }
  function run(){
    if(!window.obsSwiss?.ready||typeof window.calc!=='function'||typeof window.houseGeometry!=='function')
      throw Error('Inicialize o motor Swiss/WASM e um mapa com fuso e coordenadas antes da retificação.');
    const events=parseEvents($('events').value);
    const result=engine.rectify({
      birthDate:$('birth').value,utcOffsetHours:$('offset').value,
      latitude:$('lat').value,longitude:$('lon').value,
      fromMinute:parseTime($('from').value,'Hora mínima'),
      toMinute:parseTime($('to').value,'Hora máxima'),
      stepMinutes:$('step').value,orbDegrees:$('orb').value,
      deltaScore:$('delta').value,houseSystem:$('house').value,
      events,
      calcBody:(jd,body)=>{
        const result=window.calc(jd,body);
        if(!result||result.engine!=='Swiss Ephemeris/WASM')
          throw Error('Posição não calculada pelo motor Swiss; referência recusada.');
        return result;
      },
      calcHouses:(jd,lat,lon,system)=>window.houseGeometry(jd,lat,lon,system)
    });
    last={
      schema:'oa-retrospective-rectification/v1',
      exportedAt:new Date().toISOString(),
      engine:{name:'Swiss Ephemeris/WASM',package:window.obsSwiss.package,
        version:window.obsSwiss.version,fullSwiss:window.obsSwiss.fullSwiss},
      input:{
        birthDate:$('birth').value,utcOffsetHours:$('offset').value,
        latitude:$('lat').value,longitude:$('lon').value,
        from:$('from').value,to:$('to').value,stepMinutes:$('step').value,
        orbDegrees:$('orb').value,deltaScore:$('delta').value,
        houseSystem:$('house').value,events
      },
      result
    };
    $('export').disabled=false;
    const best=result.best,range=result.nearMinimum;
    report(
      result.method+'\n'+result.objective+'\n\n'+result.disclaimer+
      '\nMotor: '+last.engine.name+' '+last.engine.version+' · efemérides '+(last.engine.fullSwiss?'Swiss .se1':'Moshier via Swiss WASM')+
      '\nHorários testados: '+result.evaluated+' · eventos: '+result.eventCount+
      '\nMelhor ajuste na grade: '+formatMinute(best.minute)+' (local), UTC '+best.utc+
      '\nEscore objetivo: '+best.score.toFixed(6)+
      '\nASC / MC do candidato: '+best.asc.toFixed(6)+'° / '+best.mc.toFixed(6)+'°'+
      '\nFaixa contígua próxima: '+formatMinute(range.fromMinute)+'–'+formatMinute(range.toMinute)+
      ' (escore ≤ '+range.cutoffScore.toFixed(6)+')'+
      '\n'+range.meaning+
      '\nOutros mínimos separados ≥30 min: '+result.alternatives.map(item=>formatMinute(item.minute)+' ('+item.score.toFixed(3)+')').join('; ')+
      '\n\nErros dos eventos no melhor candidato:\n'+
      best.details.map((event,i)=>(i+1)+'. '+event.source+' · corpo '+planets[event.body]+
        ' / '+event.angle+' / '+event.aspect+'° · erro '+event.deviation.toFixed(6)+'° · peso '+event.weight).join('\n')+
      (best.houseFallback?'\nAviso do sistema de casas: '+best.houseFallback:'')
    );
  }
  $('open').onclick=()=>{
    const visible=$('panel').hidden;
    $('panel').hidden=!visible;
    $('open').setAttribute('aria-expanded',String(visible));
    if(visible)$('close').focus();
  };
  $('close').onclick=()=>{
    $('panel').hidden=true;
    $('open').setAttribute('aria-expanded','false');
    $('open').focus();
  };
  $('panel').addEventListener('keydown',event=>{if(event.key==='Escape')$('close').click()});
  $('use-map').onclick=()=>{
    const map={birth:'data',offset:'utc',lat:'nlat',lon:'nlon'};
    for(const [dest,source] of Object.entries(map)){
      const value=document.getElementById(source)?.value;
      if(value!==undefined&&value!=='')$(dest).value=value;
    }
    report('Dados copiados. Confirme a fonte do fuso natal e liste eventos UTC previamente documentados.');
  };
  $('run').onclick=async()=>{
    $('run').disabled=true;$('export').disabled=true;last=null;
    report('Calculando objetivo sobre a grade declarada…');
    await new Promise(resolve=>setTimeout(resolve,0));
    try{run()}catch(error){report('Retificação recusada: '+error.message)}
    finally{$('run').disabled=false}
  };
  $('export').onclick=()=>{
    if(!last)return;
    const blob=new Blob([JSON.stringify(last,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='observatorio-retificacao-retrospectiva.json';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
})();