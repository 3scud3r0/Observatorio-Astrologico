/* Exploratory natal-time rectification, not validation of astrology or birth records.
 * The objective is fully defined by the user's preselected retrospective events,
 * angles, aspects and weights. No probabilistic confidence level is inferred.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OARectification=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DAY=86400000;
  const mod=n=>((Number(n)%360)+360)%360;
  const separation=(a,b)=>{const x=Math.abs(mod(a)-mod(b));return Math.min(x,360-x)};
  const number=(value,name,min,max)=>{
    if(value===null||value===undefined||value===''||typeof value==='boolean')
      throw Error(name+': valor obrigatório.');
    const n=Number(value);
    if(!Number.isFinite(n)||n<min||n>max)throw Error(name+': valor fora do intervalo.');
    return n;
  };
  function civilDay(text){
    if(typeof text!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(text))
      throw Error('Data natal deve estar em AAAA-MM-DD.');
    const ms=Date.parse(text+'T00:00:00Z');
    if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==text)
      throw Error('Data natal inválida.');
    return ms;
  }
  const asJD=ms=>ms/DAY+2440587.5;
  function validateEvents(events){
    if(!Array.isArray(events)||events.length<2||events.length>100)
      throw Error('Informe entre 2 e 100 acontecimentos documentados.');
    return events.map((item,index)=>{
      if(!item||typeof item!=='object')throw Error('Acontecimento '+(index+1)+' inválido.');
      const jd=number(item.jd,'JD do acontecimento',2378496.5,2488434.5);
      const body=number(item.body,'Corpo',0,9);
      if(!Number.isInteger(body))throw Error('Índice do corpo deve ser inteiro.');
      if(!['ASC','MC'].includes(item.angle))throw Error('Ângulo deve ser ASC ou MC.');
      const aspect=number(item.aspect,'Aspecto',0,180);
      if(![0,60,90,120,180].includes(aspect))throw Error('Aspecto não suportado.');
      const weight=number(item.weight,'Peso',.1,10);
      if(typeof item.source!=='string'||!item.source.trim()||item.source.length>500)
        throw Error('Fonte documental do acontecimento obrigatória.');
      return {jd,body,angle:item.angle,aspect,weight,source:item.source.trim()};
    });
  }
  function rectify(input={}){
    const {
      birthDate,utcOffsetHours,latitude,longitude,
      fromMinute=0,toMinute=1439,stepMinutes=5,orbDegrees=2,
      deltaScore=1,houseSystem='E',events,calcBody,calcHouses
    }=input;
    const birthMs=civilDay(birthDate);
    const year=Number(birthDate.slice(0,4));
    if(year<1800||year>2100)throw Error('Nascimento fora da janela de efemérides declarada (1800–2100).');
    const offset=number(utcOffsetHours,'UTC offset',-14,14);
    const lat=number(latitude,'Latitude',-89.999,89.999);
    const lon=number(longitude,'Longitude',-180,180);
    const from=number(fromMinute,'Início em minutos',0,1439);
    const to=number(toMinute,'Fim em minutos',0,1439);
    const step=number(stepMinutes,'Passo em minutos',1,60);
    const orb=number(orbDegrees,'Orbe',.1,15);
    const delta=number(deltaScore,'Tolerância do escore',0,10);
    if(![from,to,step].every(Number.isInteger)||to<=from)
      throw Error('Use minutos inteiros e intervalo de horário crescente.');
    if(!['P','K','E','W','O','R','C','B','M','X','T','V','H'].includes(houseSystem))
      throw Error('Sistema de casas inválido.');
    if(typeof calcBody!=='function'||typeof calcHouses!=='function')
      throw Error('Motor Swiss/cálculo de casas obrigatório.');
    const validated=validateEvents(events);
    const observed=validated.map(event=>{
      const body=calcBody(event.jd,event.body);
      if(!Number.isFinite(body?.lon))
        throw Error('Longitude de trânsito indisponível para '+event.source);
      return {...event,transitLongitude:mod(body.lon)};
    });
    const minutes=[];
    for(let minute=from;minute<=to;minute+=step)minutes.push(minute);
    if(minutes.at(-1)!==to)minutes.push(to);
    if(minutes.length>500)throw Error('Muitas amostras; aumente o passo para no máximo 500 horários.');
    const totalWeight=observed.reduce((sum,item)=>sum+item.weight,0);
    const candidates=minutes.map(minute=>{
      const utcMs=birthMs+minute*60000-offset*3600000;
      const jd=asJD(utcMs);
      if(jd<2378496.5||jd>2488434.5)
        throw Error('Candidato fora da janela de efemérides.');
      const h=calcHouses(jd,lat,lon,houseSystem);
      if(!Number.isFinite(h?.asc)||!Number.isFinite(h?.mc))
        throw Error('ASC ou MC não calculado; hora/local inadequados.');
      const details=observed.map(event=>{
        const natalAngle=mod(event.angle==='ASC'?h.asc:h.mc);
        const deviation=Math.abs(separation(event.transitLongitude,natalAngle)-event.aspect);
        return {source:event.source,body:event.body,angle:event.angle,aspect:event.aspect,
          transitLongitude:event.transitLongitude,natalAngle,
          deviation,weight:event.weight};
      });
      const score=details.reduce((sum,item)=>sum+item.weight*Math.pow(item.deviation/orb,2),0)/totalWeight;
      return {minute,jd,utc:new Date(utcMs).toISOString(),asc:mod(h.asc),mc:mod(h.mc),
        score,details,houseFallback:h.fallback||null};
    });
    const ordered=[...candidates].sort((a,b)=>a.score-b.score||a.minute-b.minute);
    const best=ordered[0],index=candidates.findIndex(c=>c.minute===best.minute);
    let left=index,right=index;
    while(left>0&&candidates[left-1].score<=best.score+delta)left--;
    while(right<candidates.length-1&&candidates[right+1].score<=best.score+delta)right++;
    const alternatives=[];
    for(const candidate of ordered){
      if(alternatives.every(previous=>Math.abs(previous.minute-candidate.minute)>=30))
        alternatives.push({minute:candidate.minute,score:candidate.score});
      if(alternatives.length===5)break;
    }
    return {
      method:'Exploratório: mínimos quadrados ponderados do erro angular normalizado pelo orbe.',
      objective:'Soma(peso × (|separação(trânsito, ASC/MC natal) − aspecto| / orbe)²) / soma(peso).',
      disclaimer:'Ajuste retrospectivo, não validação da astrologia e não inferência confiável da hora de nascimento.',
      natalDate:birthDate,utcOffsetHours:offset,latitude:lat,longitude:lon,
      houseSystem,stepMinutes:step,orbDegrees:orb,deltaScore:delta,
      evaluated:candidates.length,eventCount:observed.length,best,
      nearMinimum:{fromMinute:candidates[left].minute,toMinute:candidates[right].minute,
        cutoffScore:best.score+delta,
        meaning:'Faixa contígua de amostras até melhor escore + tolerância; NÃO é intervalo de confiança.'},
      alternatives
    };
  }
  return {rectify,validateEvents,separation};
});
