(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAReferenceMaps=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='oa-reference-map/v1';
  const RATINGS=new Set(['AA','A','B','C','DD','X','XX']);
  function text(value,label,max=500){
    if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(label+': texto inválido.');
    return value.trim();
  }
  function date(value){
    if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))throw Error('Data: use AAAA-MM-DD.');
    const d=new Date(value+'T00:00:00Z');
    if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw Error('Data inexistente.');
    return value;
  }
  function time(value){
    if(typeof value!=='string'||!/^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/.test(value))
      throw Error('Hora: use HH:MM ou HH:MM:SS.');
    return value;
  }
  function number(value,label,min,max){
    if(value===''||value===null||value===undefined||typeof value==='boolean')throw Error(label+': número obrigatório.');
    const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(label+': fora do intervalo.');
    return n;
  }
  function normalize(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Mapa de referência inválido.');
    const rating=text(input.roddenRating,'Rodden Rating',2).toUpperCase();
    if(!RATINGS.has(rating))throw Error('Rodden Rating deve ser AA, A, B, C, DD, X ou XX.');
    const unknown=rating==='X'||rating==='XX';
    const birthTime=unknown?null:time(input.birthTime);
    const timezone=unknown&&input.timezone==null?null:number(input.timezone,'UTC',-14,14);
    return {
      schema:SCHEMA,
      name:text(input.name,'Nome',160),
      birthDate:date(input.birthDate),
      birthTime,
      timezone,
      latitude:number(input.latitude,'Latitude',-90,90),
      longitude:number(input.longitude,'Longitude',-180,180),
      roddenRating:rating,
      timeQuality:rating==='AA'?'documentada':unknown?'desconhecida':'aproximada',
      timeSource:text(input.timeSource||'Não informado','Fonte da hora',300),
      sourceCitation:text(input.sourceCitation||'Não informado','Fonte bibliográfica/documental',1000)
    };
  }
  function parse(payload){
    const data=typeof payload==='string'?JSON.parse(payload):payload;
    const items=Array.isArray(data)?data:Array.isArray(data?.maps)?data.maps:[data];
    if(!items.length||items.length>500)throw Error('Arquivo deve conter de 1 a 500 mapas.');
    return items.map(normalize);
  }
  return {SCHEMA,RATINGS:[...RATINGS],normalize,parse};
});