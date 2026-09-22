(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAZodiacMode=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SIDEREAL_FLAG=65536;
  const MODES={
    fagan:{id:0,label:'Fagan/Bradley'},
    lahiri:{id:1,label:'Lahiri'},
    raman:{id:3,label:'Raman'},
    krishnamurti:{id:5,label:'Krishnamurti'}
  };
  const mod=n=>((Number(n)%360)+360)%360;
  function normalize(input={}){
    const mode=input.mode||'tropical';
    if(mode==='tropical')return {mode:'tropical',ayanamsha:null,ayanamshaId:null,label:'Tropical'};
    if(mode!=='sidereal')throw Error('Modo zodiacal inválido.');
    const key=input.ayanamsha||'lahiri',entry=MODES[key];
    if(!entry)throw Error('Ayanamsha não suportado.');
    return {mode:'sidereal',ayanamsha:key,ayanamshaId:entry.id,label:'Sideral · '+entry.label};
  }
  function flags(base,config){
    const cfg=normalize(config);
    return cfg.mode==='sidereal'?(Number(base)|SIDEREAL_FLAG):Number(base);
  }
  function rotateHouses(houses,ayanamsha){
    const a=Number(ayanamsha);
    if(!houses||!Number.isFinite(a))throw Error('Casas/ayanamsha inválidos.');
    const rotate=v=>mod(Number(v)-a);
    return {
      ...houses,
      ascendant:rotate(houses.ascendant),mc:rotate(houses.mc),
      cusps:Array.isArray(houses.cusps)?houses.cusps.map((v,i)=>i===0?v:rotate(v)):houses.cusps,
      siderealAyanamsha:a,
      siderealHouseConvention:'cúspides Swiss tropicais rotacionadas pelo ayanamsha; o wrapper browser 1.3.1 não expõe houses_ex sidereal'
    };
  }
  function label(config,ayanamsha){
    const cfg=normalize(config);
    return cfg.mode==='tropical'?'zodíaco tropical':
      'zodíaco sideral · '+MODES[cfg.ayanamsha].label+
      (Number.isFinite(Number(ayanamsha))?' · ayanamsha '+Number(ayanamsha).toFixed(6)+'°':'');
  }
  return {SIDEREAL_FLAG,MODES,normalize,flags,rotateHouses,label};
});
