(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OADidacticBoundary=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  function source(item){
    if(!item||typeof item!=='object'||typeof item.title!=='string'||!item.title.trim()||
       typeof item.url!=='string'||!/^https?:\/\//.test(item.url))
      throw Error('Toda explicação deve declarar fonte com título e URL.');
    return {title:item.title.trim(),url:item.url};
  }
  function envelope({calculation,explanation,sources,generatedByAI=false}={}){
    if(!calculation||typeof calculation!=='object'||Array.isArray(calculation))
      throw Error('Payload matemático obrigatório.');
    if(typeof explanation!=='string'||!explanation.trim())
      throw Error('Texto didático obrigatório.');
    if(!Array.isArray(sources)||!sources.length)
      throw Error('Texto didático sem fonte não é permitido.');
    const fixed=clone(calculation);
    const didactic={
      role:'didactic-only',
      generatedByAI:Boolean(generatedByAI),
      explanation:explanation.trim(),
      sources:sources.map(source)
    };
    return {calculation:fixed,didactic};
  }
  function render(record){
    if(!record?.didactic||record.didactic.role!=='didactic-only')
      throw Error('Envelope didático inválido.');
    const label=record.didactic.generatedByAI?
      'Texto didático gerado por IA; não altera os cálculos.':
      'Texto didático local; não altera os cálculos.';
    const refs=record.didactic.sources.map((s,i)=>(i+1)+'. '+s.title+' — '+s.url).join('\n');
    return label+'\n'+record.didactic.explanation+'\nFontes:\n'+refs;
  }
  return {envelope,render};
});
