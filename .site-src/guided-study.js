/* Guide is a renderer of already-calculated map values, never a second ephemeris. */
(()=>{
  'use strict';
  const root=document.getElementById('oa-guide'),D=window.OADidacticBoundary,C=window.OAChartCore,I=window.OAInterpretationEngine;
  if(!root||!D||!C||!I)return;
  const $=name=>document.getElementById('oa-g-'+name);
  const signs=['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
  const subjects=[
    {name:'Sol',description:'O Sol mostra a posição aparente do Sol na eclíptica no instante escolhido. O signo é um setor de 30° do zodíaco.'},
    {name:'Lua',description:'A Lua se desloca relativamente rápido; uma hora natal aproximada ou desconhecida pode mudar o grau calculado.'},
    {name:'Ascendente',description:'O Ascendente depende da interseção entre eclíptica e horizonte local. Exige hora, local e fuso confiáveis.'}
  ];
  let step=0,level='essential';
  const emit=s=>{$('output').textContent=s};
  function current(){
    try{
      // Legacy chart scripts may declare a global lexical variable rather than window.positions.
      if(typeof positions!=='undefined'&&Array.isArray(positions))return positions;
      return Array.isArray(window.positions)?window.positions:[];
    }catch{return []}
  }
  function point(){
    const unknown=document.getElementById('precision')?.value==='desconhecida';
    const noHouses=document.getElementById('houseSystem')?.value==='none';
    const entries=current();
    if(step===2){
      if(unknown||noHouses)throw Error('Ascendente indisponível: horário natal desconhecido ou mapa sem casas. Não se pode atribuir um grau exato.');
      const lon=window.currentHouseGeometry?.asc;
      if(!Number.isFinite(lon))throw Error('Ascendente indisponível. Calcule um mapa com coordenadas, hora e sistema de casas.');
      return lon;
    }
    const lon=entries[step]?.lon;
    if(!Number.isFinite(lon))throw Error('Calcule o mapa natal para consultar Sol e Lua. Nenhuma longitude será presumida.');
    return lon;
  }
  function structuredReading(){
    const entries=current(),precision=document.getElementById('precision')?.value;
    const quality=precision==='desconhecida'?'unknown':precision==='aproximada'?'approximate':'documented';
    const bodies=[],names=['Sol','Lua','Mercúrio','Vênus','Marte','Júpiter','Saturno','Urano','Netuno','Plutão'];
    names.forEach((name,index)=>{if(Number.isFinite(entries[index]?.lon))bodies.push({name,longitude:entries[index].lon,latitude:entries[index].lat??null,speed:entries[index].speed??null})});
    const asc=window.currentHouseGeometry?.asc,angles=Number.isFinite(asc)?[{name:'Ascendente',longitude:asc}]:[];
    const facts=C.createFacts({subject:{label:'Mapa atual',timeQuality:quality,uncertaintyMinutes:quality==='approximate'?60:0},referenceFrame:{zodiac:document.getElementById('zodiacMode')?.value||'tropical',ayanamsha:document.getElementById('siderealMode')?.value||null,houseSystem:document.getElementById('houseSystem')?.value||null},bodies,angles,provenance:{calculator:window.obsSwiss?.ready?'Swiss Ephemeris/WASM':'Motor ainda não confirmado'}});
    const result=I.interpret(facts,{level,maxFindings:5});
    const findings=result.findings.map(item=>'• '+item.title+': '+item.text+(level==='professional'?'\n  Regra '+item.evidenceTrace.ruleVersion+' · '+item.evidenceTrace.school+' · fatos: '+item.evidenceTrace.facts.join(', '):'')).join('\n');
    return 'LEITURA ESTRUTURADA · '+level.toUpperCase()+'\n'+result.summary+'\n'+(findings||'Nenhum fator disponível neste nível.')+'\n\nAvisos:\n'+result.warnings.map(x=>'• '+x).join('\n');
  }
  function render(){
    root.querySelectorAll('[data-oa-step]').forEach(button=>
      button.setAttribute('aria-pressed',String(Number(button.dataset.oaStep)===step)));
    $('simple').setAttribute('aria-pressed',String(level==='essential'));
    $('intermediate').setAttribute('aria-pressed',String(level==='intermediate'));
    $('technical').setAttribute('aria-pressed',String(level==='professional'));
    try{
      const lon=((point()%360)+360)%360;
      const sign=signs[Math.floor(lon/30)],degree=lon%30;
      const subject=subjects[step];
      const calculation={subject:subject.name,longitude:lon,sign,signIndex:Math.floor(lon/30),degreeInSign:degree};
      const explanation=level==='professional'?subject.description:
        'Seu mapa localiza '+subject.name.toLowerCase()+' no setor '+sign+
        ' do zodíaco. Isso não define personalidade nem garante acontecimentos.';
      const didactic=D.envelope({
        calculation,explanation,generatedByAI:false,
        sources:[
          {title:'Swiss Ephemeris — documentação do motor astronômico',url:'https://www.astro.com/swisseph/'},
          {title:'Fonte do Observatório e metodologia',url:'https://github.com/3scud3r0/Observatorio-Astrologico'}
        ]
      });
      emit('Dados calculados · '+subject.name+' · '+sign+
        '\nLongitude eclíptica: '+lon.toFixed(6)+'°'+
        '\nGrau dentro do signo: '+degree.toFixed(6)+'°'+
        (level==='professional'?'\nÍndice do signo: ⌊(λ mod 360°)/30°⌋.':'')+
        '\n\n'+D.render(didactic)+'\n\n'+structuredReading());
    }catch(error){emit(error.message)}
  }
  $('toggle').onclick=()=>{
    const show=$('panel').hidden;
    $('panel').hidden=!show;$('toggle').setAttribute('aria-expanded',String(show));
    if(show){$('close').focus();render()}
  };
  $('close').onclick=()=>{
    $('panel').hidden=true;$('toggle').setAttribute('aria-expanded','false');$('toggle').focus();
  };
  $('panel').addEventListener('keydown',event=>{if(event.key==='Escape')$('close').click()});
  root.querySelectorAll('[data-oa-step]').forEach(button=>button.onclick=()=>{
    step=Number(button.dataset.oaStep);render();
  });
  $('simple').onclick=()=>{level='essential';render()};
  $('intermediate').onclick=()=>{level='intermediate';render()};
  $('technical').onclick=()=>{level='professional';render()};
  root.querySelectorAll('[data-oa-go]').forEach(button=>button.onclick=()=>{
    root.querySelectorAll('[data-oa-go]').forEach(other=>
      other.setAttribute('aria-pressed',String(other===button)));
    switch(button.dataset.oaGo){
      case 'begin':
        emit('Começar: informe nascimento, fonte do horário, fuso e localização no formulário do Observatório. Calcule o mapa e retorne aqui para conhecer Sol, Lua e Ascendente.');
        break;
      case 'investigate':
        emit('Investigar: defina uma hipótese antes da janela, registre os critérios e preserve os resultados, inclusive não confirmações.');
        document.getElementById('oa-r-toggle')?.click();
        break;
      case 'learn':step=0;render();break;
      case 'expert':
        emit('Especialista: use os instrumentos profissionais e confira o método, a seita, as casas e as limitações de cada técnica.');
        document.getElementById('oa-studio-launch')?.click();
        break;
    }
  });
})();
