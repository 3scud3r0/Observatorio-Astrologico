(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAInterpretationEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='oa-interpretation/1.0.0';
  const signs=['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
  const elements=['fogo','terra','ar','água','fogo','terra','ar','água','fogo','terra','ar','água'];
  const modalities=['cardinal','fixa','mutável','cardinal','fixa','mutável','cardinal','fixa','mutável','cardinal','fixa','mutável'];
  const subjects={Sol:{simple:'direção consciente e forma de expressão'},Lua:{simple:'necessidades emocionais e respostas habituais'},Mercúrio:{simple:'modo de organizar ideias e comunicar'},Vênus:{simple:'valores, vínculos e busca de harmonia'},Marte:{simple:'iniciativa, desejo e resposta ao conflito'},Júpiter:{simple:'expansão, confiança e construção de sentido'},Saturno:{simple:'limites, responsabilidade e maturação'},Urano:{simple:'mudança, autonomia e ruptura de padrões'},Netuno:{simple:'imaginação, permeabilidade e idealização'},Plutão:{simple:'intensidade, crise e transformação'},Ascendente:{simple:'modo de iniciar experiências e encontrar o ambiente'}};
  const elementText={fogo:'ênfase em iniciativa, inspiração e expressão',terra:'ênfase em concretização, estabilidade e recursos',ar:'ênfase em ideias, trocas e relações',água:'ênfase em sensibilidade, vínculo e percepção subjetiva'};
  const modalityText={cardinal:'tende a iniciar movimentos',fixa:'tende a sustentar e consolidar',mutável:'tende a adaptar e redistribuir'};
  const SOURCES=[{title:'Swiss Ephemeris — documentação astronômica',url:'https://www.astro.com/swisseph/'},{title:'Observatório Astrológico — contrato e metodologia',url:'https://github.com/3scud3r0/Observatorio-Astrologico/blob/main/docs/PRODUCT_CONTRACT.md'}];
  function ruleFor(name,longitude){
    const index=Math.floor((((Number(longitude)%360)+360)%360)/30),sign=signs[index],subject=subjects[name];
    if(!subject)return null;
    return {id:'placement.'+name.toLowerCase()+'.sign',school:'síntese didática tropical',version:VERSION,facts:[name+'.longitude'],subject:name,sign,element:elements[index],modality:modalities[index],simple:name+' em '+sign+' associa '+subject.simple+' a uma linguagem de '+elements[index]+'.',intermediate:name+' em '+sign+': '+elementText[elements[index]]+'; a modalidade '+modalities[index]+' '+modalityText[modalities[index]]+'.',professional:name+' em '+sign+' ('+(Number(longitude)%30).toFixed(4)+'° no signo), elemento '+elements[index]+', modalidade '+modalities[index]+'. Regra: posição zodiacal tropical por setores de 30°.',sources:SOURCES};
  }
  function aspectRules(points){
    const aspects=[{angle:0,name:'conjunção',kind:'concentra'},{angle:60,name:'sextil',kind:'facilita cooperação entre'},{angle:90,name:'quadratura',kind:'cria tensão dinâmica entre'},{angle:120,name:'trígono',kind:'favorece fluidez entre'},{angle:180,name:'oposição',kind:'pede equilíbrio entre'}],out=[];
    for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++){
      let separation=Math.abs(points[a].longitude-points[b].longitude)%360;separation=Math.min(separation,360-separation);
      const hit=aspects.map(x=>({...x,orb:Math.abs(separation-x.angle)})).sort((x,y)=>x.orb-y.orb)[0];
      if(hit.orb>6)continue;
      const first=points[a].name,second=points[b].name;
      out.push({id:'aspect.'+first+'.'+second+'.'+hit.angle,title:first+' '+hit.name+' '+second,textEssential:'A relação entre '+first+' e '+second+' merece leitura conjunta.',textIntermediate:'A '+hit.name+' '+hit.kind+' '+subjects[first].simple+' e '+subjects[second].simple+'.',textProfessional:first+'–'+second+': '+hit.name+'; separação '+separation.toFixed(4)+'°, orbe '+hit.orb.toFixed(4)+'°; política didática fixa de 6°.',orb:hit.orb,evidenceTrace:{facts:[first+'.longitude',second+'.longitude'],school:'aspectos maiores didáticos',ruleVersion:VERSION,sources:SOURCES}});
    }
    return out.sort((x,y)=>x.orb-y.orb);
  }
  function interpret(facts,{level='essential',maxFindings=5}={}){
    if(!facts||facts.schema!=='oa-chart-facts/v1')throw Error('ChartFacts incompatível.');
    if(!['essential','intermediate','professional'].includes(level))throw Error('Nível interpretativo inválido.');
    const points=facts.bodies.filter(x=>subjects[x.name]).concat(facts.angles.filter(x=>x.name==='Ascendente'));
    const placements=points.map(x=>ruleFor(x.name,x.longitude)).filter(Boolean).map(rule=>({id:rule.id,title:rule.subject+' em '+rule.sign,text:level==='essential'?rule.simple:level==='intermediate'?rule.intermediate:rule.professional,evidenceTrace:{facts:rule.facts,school:rule.school,ruleVersion:rule.version,sources:rule.sources},timeSensitive:rule.subject==='Ascendente'}));
    const aspects=aspectRules(points).map(rule=>({id:rule.id,title:rule.title,text:level==='essential'?rule.textEssential:level==='intermediate'?rule.textIntermediate:rule.textProfessional,evidenceTrace:rule.evidenceTrace,timeSensitive:false}));
    const priority=name=>name.startsWith('placement.sol')?0:name.startsWith('placement.lua')?1:name.startsWith('placement.ascendente')?2:3;
    const findings=placements.concat(aspects).sort((a,b)=>priority(a.id)-priority(b.id)).slice(0,Math.max(1,Math.min(12,maxFindings)));
    const counts=points.reduce((acc,x)=>{const element=elements[Math.floor((((x.longitude%360)+360)%360)/30)];acc[element]=(acc[element]||0)+1;return acc},{}),dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    const warnings=[...facts.warnings,'Leitura astrológica é uma convenção de estudo; não é diagnóstico nem garantia de acontecimentos.'];
    return Object.freeze({schema:'oa-interpretation-result/v1',version:VERSION,level,calculationSchema:facts.schema,summary:dominant&&dominant[1]>1?'Convergência de '+dominant[1]+' fatores no elemento '+dominant[0]+'.':'Não há dominância elementar suficiente nesta seleção.',findings,warnings,sources:SOURCES});
  }
  return {VERSION,interpret};
});
