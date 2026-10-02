(()=>{
  'use strict';
  const root=document.getElementById('oa-pro-workspace'),C=window.OAChartCore,
    I=window.OAInterpretationEngine,F=window.OAForecastCore,Q=window.OAQualityGates;
  if(!root||!C||!I||!F||!Q)return;
  const $=name=>document.getElementById('oa-pw-'+name),rpc=window.OACoreRPC?new window.OACoreRPC():null;
  const names=['Sol','Lua','Mercúrio','Vênus','Marte','Júpiter','Saturno','Urano','Netuno','Plutão'];
  let level='essential',last=null,events=[];
  function positionsNow(){try{return typeof positions!=='undefined'?positions:window.positions||[]}catch{return[]}}
  function facts(){
    const list=positionsNow();if(!list.length)throw Error('Calcule o mapa natal antes de gerar a leitura.');
    const unknown=document.getElementById('precision')?.value==='desconhecida',asc=window.currentHouseGeometry?.asc;
    return C.createFacts({subject:{label:document.getElementById('nome')?.value||'Mapa atual',utc:typeof currentDate!=='undefined'?currentDate:null,timeQuality:unknown?'unknown':'documented'},referenceFrame:{zodiac:document.getElementById('zodiacMode')?.value||'tropical',ayanamsha:document.getElementById('siderealMode')?.value||null,houseSystem:document.getElementById('houseSystem')?.value||null},bodies:names.flatMap((name,index)=>Number.isFinite(list[index]?.lon)?[{name,longitude:list[index].lon,latitude:list[index].lat??null,speed:list[index].speed??null}]:[]),angles:Number.isFinite(asc)?[{name:'Ascendente',longitude:asc}]:[],provenance:{calculator:'Swiss Ephemeris/WASM'}});
  }
  function download(name,type,text){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),0)}
  function natal(){
    const chart=facts(),reading=I.interpret(chart,{level,maxFindings:12}),quality=Q.evaluate({facts:chart,interpretation:reading,timingEvents:events});last={chart,reading,events,convergences:F.convergence(events),quality};
    $('output').textContent=reading.summary+'\n\n'+reading.findings.map(x=>x.title+'\n'+x.text+(level==='professional'?'\nRegra: '+x.evidenceTrace.ruleVersion+' · '+x.evidenceTrace.school:'' )).join('\n\n')+'\n\n'+reading.warnings.join('\n')+'\n\nGate automático: '+quality.status.toUpperCase();return last;
  }
  function selectedTechniques(){const out=[];if($('transit').checked)out.push('transit');if($('progression').checked)out.push('secondary-progression');if($('direction').checked)out.push('solar-arc-direction');if($('return').checked)out.push('planetary-return');if(!out.length)throw Error('Selecione ao menos uma técnica.');return out}
  async function forecast(){
    const chart=facts(),list=positionsNow(),body=Number($('body').value),targetIndex=Number($('target').value),target=targetIndex===10?chart.angles.find(x=>x.name==='Ascendente'):chart.bodies[targetIndex],source=chart.bodies[body],days=Number($('days').value),orb=Number($('orb').value),birthJD=Date.parse(chart.subject.utc)/86400000+2440587.5,now=Date.now()/86400000+2440587.5;
    if(!target||!source||!Number.isFinite(birthJD)||!rpc)throw Error('Dados natais, horário ou Worker Swiss indisponíveis.');
    $('output').textContent='Calculando no Worker Swiss…';
    events=await rpc.call('buildTimeline',{birthJD,startJD:now,endJD:now+days,body,targetLongitude:target.longitude,targetName:target.name+' natal',bodyName:source.name+' em movimento',sourceName:source.name+' dirigido',sourceLongitude:source.longitude,natalLongitude:source.longitude,orb,step:body===1?.125:.25,techniques:selectedTechniques()},{progress:value=>{$('output').textContent='Calculando no Worker Swiss… '+Math.round(value*100)+'%'}});
    const convergences=F.convergence(events),texts=events.map(x=>F.interpretEvent(x,level).text).join('\n\n');
    $('output').textContent=(texts||'Nenhum evento exato encontrado com estes parâmetros.')+(convergences.length?'\n\nConvergências descritivas:\n'+convergences.map(x=>x.techniques.join(' + ')+' · '+x.windowStart.slice(0,10)+' — '+x.windowEnd.slice(0,10)).join('\n'):'')+'\n\nHipóteses simbólicas; não garantem acontecimentos.';
    last={chart,events,convergences,quality:Q.evaluate({facts:chart,interpretation:I.interpret(chart,{level}),timingEvents:events})};
  }
  function svgReport(){if(!last)natal();const lines=[last.chart.subject.label,last.reading?.summary||'Agenda temporal',...(last.reading?.findings||[]).slice(0,8).map(x=>x.title+' — '+x.text)];const escaped=value=>String(value).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="'+(180+lines.length*70)+'" viewBox="0 0 1200 '+(180+lines.length*70)+'"><rect width="100%" height="100%" fill="#071c2d"/><text x="60" y="70" fill="#ffdc83" font-family="system-ui" font-size="34">Observatório Astrológico</text>'+lines.map((line,index)=>'<text x="60" y="'+(130+index*70)+'" fill="#eefaff" font-family="system-ui" font-size="18">'+escaped(line).slice(0,115)+'</text>').join('')+'</svg>'}
  function pdfReport(){if(!last)natal();const PDF=window.jspdf?.jsPDF||window.jsPDF;if(typeof PDF!=='function')throw Error('Gerador PDF indisponível; use JSON ou SVG.');const pdf=new PDF({unit:'pt',format:'a4'}),lines=$('output').textContent.match(/.{1,90}(?:\s|$)/g)||[];pdf.setFontSize(18);pdf.text('Observatório Astrológico',40,50);pdf.setFontSize(10);let y=75;for(const line of lines){if(y>800){pdf.addPage();y=40}pdf.text(line.trim(),40,y);y+=14}pdf.save('observatorio-relatorio.pdf')}
  async function reminders(){if(!('Notification'in window))throw Error('Notificações não são suportadas neste navegador.');const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Permissão de notificação não concedida.');localStorage.setItem('oa-reminders',JSON.stringify(events.map(x=>({id:x.id,at:x.windowStart,summary:x.source+' '+x.aspect+'° '+x.target}))));new Notification('Observatório Astrológico',{body:events.length+' lembretes foram guardados localmente. O navegador pode limitar execução em segundo plano.'})}
  async function safe(fn){try{await fn()}catch(error){$('output').textContent=error.message}}
  $('toggle').onclick=()=>{const open=$('panel').hidden;$('panel').hidden=!open;$('toggle').setAttribute('aria-expanded',String(open));if(open)$('close').focus()};$('close').onclick=()=>{$('panel').hidden=true;$('toggle').setAttribute('aria-expanded','false');$('toggle').focus()};$('panel').onkeydown=e=>{if(e.key==='Escape')$('close').click()};
  for(const name of ['essential','intermediate','professional'])$(name).onclick=()=>{level=name;safe(natal)};
  $('natal').onclick=()=>safe(natal);$('forecast').onclick=()=>safe(forecast);$('json').onclick=()=>safe(()=>{if(!last)natal();download('observatorio-leitura.json','application/json',JSON.stringify(last,null,2))});$('ics').onclick=()=>safe(()=>download('observatorio-agenda.ics','text/calendar',F.toICS(events)));$('svg').onclick=()=>safe(()=>download('observatorio-relatorio.svg','image/svg+xml',svgReport()));$('pdf').onclick=()=>safe(pdfReport);$('notify').onclick=()=>safe(reminders);
})();
