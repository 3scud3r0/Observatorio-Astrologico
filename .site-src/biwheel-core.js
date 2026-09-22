(function(root,factory){
  const api=factory(root?.OATraditionalEngine);
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./traditional-engine.js'));
  if(root)root.OABiWheel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  if(!E)throw Error('OATraditionalEngine é obrigatório.');
  function bodies(count=10){return Array.from({length:count},(_,i)=>i)}
  function snapshot(jd,calc,ids=bodies()){
    if(!Number.isFinite(Number(jd))||typeof calc!=='function')throw Error('JD/cálculo inválido.');
    return ids.map(id=>{
      const p=calc(Number(jd),id);
      if(!p||!Number.isFinite(Number(p.lon)))throw Error('Posição ausente para corpo '+id);
      return {id,name:p.name||String(id),lon:E.mod(p.lon),speed:Number(p.speed),lat:Number(p.lat)};
    });
  }
  function transit(targetJD,calc,ids){return {technique:'transit',jd:Number(targetJD),positions:snapshot(targetJD,calc,ids)}}
  function secondaryProgression(birthJD,targetJD,calc,ids){
    const age=E.ageYears(Number(birthJD),Number(targetJD)),jd=Number(birthJD)+age;
    return {technique:'secondary-progression',age,jd,positions:snapshot(jd,calc,ids),
      convention:'1 dia após o nascimento = 1 ano tropical de vida; idade fracionária preservada.'};
  }
  function solarArc(birthJD,targetJD,natal,calcSun,{mode='true'}={}){
    if(!Array.isArray(natal)||!natal.length)throw Error('Mapa natal obrigatório.');
    const age=E.ageYears(Number(birthJD),Number(targetJD));
    let arc,details;
    if(mode==='true'){
      details=E.trueSolarArc(Number(birthJD),Number(targetJD),calcSun);arc=details.arc;
    }else if(mode==='mean'){
      arc=E.mod(age*0.98564736);details={age,arc};
    }else throw Error('Modo de arco solar inválido.');
    return {technique:'solar-arc-'+mode,age,arc,
      positions:natal.map(p=>({...p,lon:E.mod(Number(p.lon)+arc)})),
      convention:mode==='true'?'Arco solar verdadeiro pela diferença Sol secundariamente progredido − Sol natal.':'Arco solar médio: idade tropical × 0,98564736°.'};
  }
  function compareSolarArc(birthJD,targetJD,natal,calcSun){
    const mean=solarArc(birthJD,targetJD,natal,calcSun,{mode:'mean'});
    const trueArc=solarArc(birthJD,targetJD,natal,calcSun,{mode:'true'});
    return {mean,true:trueArc,difference:E.signed(trueArc.arc,mean.arc)};
  }
  return {snapshot,transit,secondaryProgression,solarArc,compareSolarArc};
});
