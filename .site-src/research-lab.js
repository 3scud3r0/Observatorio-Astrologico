/* Local-first prospective audit UI: user text is never interpolated into innerHTML. */
(()=>{
  'use strict';
  const root=document.getElementById('oa-research');
  const E=window.OAResearch;
  if(!root||!E)return;
  const byId=id=>document.getElementById('oa-r-'+id);
  const KEY='oa-research-v1';
  let items=[];
  const status=message=>{byId('matrix').textContent=message};
  try{
    const stored=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(!Array.isArray(stored))throw Error('Armazenamento inválido.');
    items=stored;
  }catch(error){status('Arquivo local ilegível: '+error.message+'. Exporte/corrija antes de salvar novos registros.')}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(items));
  function download(data,name){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=name;
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function selected(){
    const index=Number(byId('records').value);
    if(!Number.isInteger(index)||index<0||index>=items.length)
      throw Error('Selecione um protocolo selado.');
    return items[index];
  }
  function history(){
    const index=Number(byId('records').value),item=items[index];
    if(!item){byId('history').textContent='Nenhum registro selecionado.';return}
    byId('history').textContent=
      'Hipótese original: '+item.record.protocol.question+
      '\nSelo: '+item.record.hash+
      '\nRegistro local: '+item.record.createdAt+
      '\nJanela: '+item.record.protocol.windowStart+' até '+item.record.protocol.windowEnd+
      '\nPrevisão: '+(item.record.protocol.predicted?'ocorrência':'ausência')+
      '\nCritério: '+item.record.protocol.criterion+
      '\nReferência sem astrologia: '+item.record.protocol.baseline+
      '\nAvaliações anexadas:\n'+(item.assessments.length?
        item.assessments.map(a=>a.evaluatedAt+': '+
          (a.observed===null?'inconclusivo':a.observed?'ocorreu':'não ocorreu')+
          ' — '+a.evidence).join('\n'):'nenhuma');
  }
  function refresh(){
    const select=byId('records'),current=select.value;
    select.replaceChildren();
    items.forEach((item,i)=>{
      const option=document.createElement('option');
      option.value=String(i);
      option.textContent=(i+1)+'. '+item.record.protocol.question.slice(0,90);
      select.append(option);
    });
    if(items.length){
      select.value=items[Number(current)]?current:String(items.length-1);
    }
    history();
  }
  byId('toggle').onclick=()=>{
    const opening=byId('panel').hidden;
    byId('panel').hidden=!opening;
    byId('toggle').setAttribute('aria-expanded',String(opening));
    if(opening)byId('close').focus();
  };
  byId('close').onclick=()=>{
    byId('panel').hidden=true;
    byId('toggle').setAttribute('aria-expanded','false');
    byId('toggle').focus();
  };
  byId('panel').addEventListener('keydown',event=>{
    if(event.key==='Escape')byId('close').click();
  });
  byId('records').onchange=history;
  byId('seal').onclick=async()=>{
    const out=byId('seal-output'),button=byId('seal');
    button.disabled=true;
    try{
      const record=await E.seal({
        question:byId('question').value,
        techniques:byId('techniques').value.split('\n').map(x=>x.trim()).filter(Boolean),
        configuration:byId('config').value,
        windowStart:byId('start').value,windowEnd:byId('end').value,
        criterion:byId('criterion').value,
        nonConfirmation:byId('nonconfirmation').value,
        baseline:byId('baseline').value,
        predicted:byId('predicted').value==='yes'
      });
      if(items.some(item=>item.record.hash===record.hash))
        throw Error('Um protocolo idêntico já foi selado.');
      items.push({record,assessments:[]});
      save();refresh();
      out.textContent='Selo SHA-256: '+record.hash+
        '\nSalvo somente neste navegador. Exporte o backup; publique o selo em registro externo para datá-lo independentemente.';
    }catch(error){out.textContent=error.message}
    finally{button.disabled=false}
  };
  byId('verify').onclick=async()=>{
    try{
      const item=selected();
      byId('history').textContent=(await E.verify(item.record))?
        'Selo íntegro. Conteúdo idêntico ao que foi selado neste registro. Isso não prova a data sem fonte externa.':
        'ALERTA: conteúdo diferente do selo SHA-256.';
    }catch(error){byId('history').textContent=error.message}
  };
  byId('evaluate').onclick=async()=>{
    try{
      const item=selected();
      if(!await E.verify(item.record))
        throw Error('O selo original não corresponde ao conteúdo; avaliação bloqueada.');
      const observed=byId('observed').value;
      const outcome=E.assessment(item.record,
        observed==='unknown'?null:observed==='yes',byId('evidence').value);
      item.assessments.push(outcome);
      save();history();
      status('Avaliação anexada sem modificar o protocolo original.');
    }catch(error){status(error.message)}
  };
  byId('summary').onclick=()=>{
    try{
      const result=E.confusion(items.map(item=>({
        record:item.record,
        assessment:item.assessments.length?item.assessments[item.assessments.length-1]:null
      })));
      const fmt=n=>n===null?'indefinido (denominador zero)':(100*n).toFixed(2)+'%';
      status('Verdadeiros positivos: '+result.tp+
        '\nFalsos positivos: '+result.fp+
        '\nFalsos negativos: '+result.fn+
        '\nVerdadeiros negativos: '+result.tn+
        '\nInconclusivos/pendentes: '+result.inconclusive+
        '\nPrecisão: '+fmt(result.precision)+
        '\nSensibilidade: '+fmt(result.sensitivity)+
        '\nEspecificidade: '+fmt(result.specificity)+
        '\nTaxa de falsos positivos: '+fmt(result.falsePositiveRate)+
        '\nExige referência sem astrologia e registro de todas as janelas para interpretação responsável. Correlação não demonstra causalidade.');
    }catch(error){status(error.message)}
  };
  byId('backup').onclick=()=>download({schema:E.SCHEMA,records:items},'observatorio-auditoria-backup.json');
  byId('import').onchange=async()=>{
    try{
      const file=byId('import').files[0];
      if(!file)return;
      if(file.size>5e6)throw Error('Backup excede 5 MB.');
      const parsed=JSON.parse(await file.text());
      if(parsed.schema!==E.SCHEMA||!Array.isArray(parsed.records)||parsed.records.length>2000)
        throw Error('Formato de backup não reconhecido.');
      for(const item of parsed.records){
        if(!await E.verify(item.record))throw Error('Backup contém selo divergente.');
        if(!Array.isArray(item.assessments))throw Error('Avaliações inválidas no backup.');
        for(const assessment of item.assessments)
          if(assessment.hash!==item.record.hash||
             ![true,false,null].includes(assessment.observed)||
             typeof assessment.evidence!=='string')
            throw Error('Avaliação sem vínculo íntegro ao protocolo.');
      }
      const known=new Set(items.map(x=>x.record.hash));
      let count=0;
      for(const item of parsed.records){
        if(!known.has(item.record.hash)){items.push(item);known.add(item.record.hash);count++}
      }
      save();refresh();status(count+' registros restaurados; duplicatas ignoradas.');
    }catch(error){status('Importação recusada: '+error.message)}
    finally{byId('import').value=''}
  };
  byId('delete').onclick=()=>{
    if(!window.confirm('Excluir permanentemente todos os protocolos e avaliações locais deste navegador? Exporte um backup antes.'))return;
    items=[];localStorage.removeItem(KEY);refresh();status('Registros locais excluídos.');
  };
  byId('precision').onchange=()=>{
    const unknown=byId('precision').value==='desconhecida';
    for(const id of ['time','utc','houses'])byId(id).disabled=unknown;
    if(unknown)status('Hora desconhecida: o laudo não incluirá casas ou horário exatos.');
  };
  byId('provenance').onclick=async()=>{
    try{
      const info=E.provenance({
        birthDate:byId('birth').value,birthTime:byId('time').value,
        timePrecision:byId('precision').value,timeSource:byId('source').value,
        timezone:byId('utc').value,latitude:byId('lat').value,
        longitude:byId('lon').value,houseSystem:byId('houses').value,
        zodiac:byId('zodiac').value
      });
      const response=await fetch('./ephemeris-provenance.json',{cache:'no-store'});
      if(!response.ok)throw Error('Metadados das efemérides indisponíveis.');
      const manifest=await response.json();
      if(manifest.schema!=='oa-asset-provenance/v1'||!manifest.assets)
        throw Error('Metadados das efemérides inválidos.');
      info.assetProvenance=manifest;
      download(info,'observatorio-identidade-tecnica.json');
      byId('provenance-output').textContent='Identidade técnica exportada. A versão do motor e a fonte dos dados constam no arquivo.';
    }catch(error){byId('provenance-output').textContent=error.message}
  };
  // Narrow, integrity-checked bridge for optional end-to-end encrypted backups.
  // Never exposes local data without a direct user click in the vault panel.
  window.OAResearchLocal={
    getSelected:async()=>{
      const item=selected();
      if(!await E.verify(item.record))throw Error('Selo local divergente.');
      return JSON.parse(JSON.stringify(item));
    },
    importSnapshot:async item=>{
      if(!item||!await E.verify(item.record)||!Array.isArray(item.assessments))
        throw Error('Snapshot não possui protocolo íntegro.');
      if(item.assessments.length>10000)throw Error('Avaliações excedem o limite.');
      for(const a of item.assessments){
        if(a.hash!==item.record.hash||![true,false,null].includes(a.observed)||
           typeof a.evidence!=='string'||typeof a.evaluatedAt!=='string')
          throw Error('Avaliação cifrada malformada.');
      }
      if(items.some(old=>old.record.hash===item.record.hash))
        return false;
      items.push(JSON.parse(JSON.stringify(item)));
      save();refresh();return true;
    }
  };
  refresh();
})();