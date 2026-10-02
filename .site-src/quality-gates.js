(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.OAQualityGates=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function evaluate({facts,interpretation,timingEvents=[]}={}){
    const checks=[],$=(id,pass,detail)=>checks.push({id,pass:Boolean(pass),detail});
    $('facts-schema',facts?.schema==='oa-chart-facts/v1','Contrato canônico do mapa');
    $('facts-frozen',Boolean(facts&&Object.isFrozen(facts)),'Mapa imutável');
    $('provenance',Boolean(facts?.engineVersion&&facts?.provenance?.calculator&&facts?.provenance?.rulesVersion),'Motor e regras identificados');
    $('unknown-time',facts?.subject?.timeQuality!=='unknown'||(facts.angles.length===0&&facts.bodies.every(x=>x.house===null)),'Hora desconhecida não expõe ângulos/casas');
    $('interpretation-trace',Boolean(interpretation?.findings?.every(x=>x.evidenceTrace?.facts?.length&&x.evidenceTrace?.sources?.length)),'Achados rastreáveis');
    $('interpretation-warning',Boolean(interpretation?.warnings?.some(x=>/não é diagnóstico|não.*garantia/i.test(x))),'Limite interpretativo explícito');
    $('timing-schema',timingEvents.every(x=>x.schema==='oa-timing-event/v1'),'Eventos temporais canônicos');
    $('timing-provenance',timingEvents.every(x=>x.provenance?.engine&&x.provenance?.algorithm),'Eventos temporais reproduzíveis');
    return {schema:'oa-quality-report/v1',status:checks.every(x=>x.pass)?'pass':'fail',checks,disclaimer:'Relatório automatizado; não substitui auditoria matemática, WCAG, segurança ou revisão editorial independentes.'};
  }
  return {evaluate};
});
