/* UTC-only chart clock math. Does not substitute astronomical ephemerides. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OATimeline=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DAY=86400000;
  const units={minute:60000,hour:3600000,day:DAY};
  const mod=x=>((x%360)+360)%360;
  const separation=(a,b)=>Math.min(mod(a-b),mod(b-a));
  function parseUTC(day,time='12:00'){
    if(typeof day!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day))
      throw Error('Informe a data UTC (AAAA-MM-DD).');
    if(typeof time!=='string'||!/^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/.test(time))
      throw Error('Informe a hora UTC em HH:MM ou HH:MM:SS.');
    const d=new Date(day+'T'+time+'Z');
    if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==day)
      throw Error('Data UTC inexistente.');
    return d;
  }
  function advance(value,amount,unit){
    const current=value instanceof Date?value:new Date(value);
    if(!Number.isFinite(current.getTime())||!Number.isInteger(amount)||Math.abs(amount)>5000)
      throw Error('Instante ou incremento inválido.');
    if(Object.prototype.hasOwnProperty.call(units,unit))
      return new Date(current.getTime()+amount*units[unit]);
    if(!['month','year'].includes(unit))throw Error('Unidade temporal desconhecida.');
    const offset=unit==='year'?12*amount:amount;
    const y=current.getUTCFullYear(),m=current.getUTCMonth();
    const anchor=new Date(Date.UTC(y,m+offset,1,current.getUTCHours(),current.getUTCMinutes(),current.getUTCSeconds(),current.getUTCMilliseconds()));
    const last=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth()+1,0)).getUTCDate();
    anchor.setUTCDate(Math.min(last,current.getUTCDate()));
    return anchor;
  }
  function julian(value){
    const ms=value instanceof Date?value.getTime():new Date(value).getTime();
    if(!Number.isFinite(ms))throw Error('Instante inválido.');
    return ms/DAY+2440587.5;
  }
  function aspects(longitude,target,orbs){
    if(![longitude,target].every(Number.isFinite))throw Error('Longitudes inválidas.');
    if(!Array.isArray(orbs)||!orbs.length)throw Error('Escolha os aspectos.');
    return orbs.map(entry=>{
      if(!entry||!Number.isFinite(entry.angle)||entry.angle<0||entry.angle>180||
         !Number.isFinite(entry.orb)||entry.orb<0||entry.orb>30)throw Error('Orbe inválido.');
      const distance=Math.abs(separation(longitude,target)-entry.angle);
      return {angle:entry.angle,deviation:distance,inOrb:distance<=entry.orb,orb:entry.orb};
    });
  }
  return {parseUTC,advance,julian,aspects,separation};
});
