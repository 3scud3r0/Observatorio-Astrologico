(()=>{
  'use strict';
  const root=document.getElementById('oa-ref'),R=window.OAReferenceMaps;
  const $=name=>document.getElementById('oa-ref-'+name);
  if(!root||!R||!$('panel'))return;
  const KEY='oa-reference-maps-v1';
  let maps=[];
  const tell=x=>{$('status').textContent=x};
  try{
    const stored=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(Array.isArray(stored))maps=stored.map(R.normalize);
  }catch(error){tell('Referências locais ilegíveis: '+error.message+'. Importe novamente ou exclua explicitamente.')}
  function save(next){localStorage.setItem(KEY,JSON.stringify(next));maps=next;render()}
  function render(){
    $('list').replaceChildren();
    maps.forEach((map,i)=>{
      const o=document.createElement('option');o.value=String(i);
      o.textContent=(i+1)+'. '+map.name+' · '+map.birthDate+' · Rodden '+map.roddenRating;
      $('list').append(o);
    });
    if(!maps.length)tell('Nenhuma referência importada.');
  }
  function selected(){
    const i=Number($('list').value);
    if(!Number.isInteger(i)||i<0||i>=maps.length)throw Error('Selecione um mapa importado.');
    return maps[i];
  }
  function set(id,value){
    const element=document.getElementById(id);
    if(!element)return;
    element.value=value==null?'':String(value);
    element.dispatchEvent(new Event('change',{bubbles:true}));
  }
  $('open').onclick=()=>{
    const open=$('panel').hidden;$('panel').hidden=!open;
    $('open').setAttribute('aria-expanded',String(open));if(open)$('close').focus();
  };
  $('close').onclick=()=>{$('panel').hidden=true;$('open').setAttribute('aria-expanded','false');$('open').focus()};
  $('panel').addEventListener('keydown',e=>{if(e.key==='Escape')$('close').click()});
  $('file').onchange=async()=>{
    try{
      const file=$('file').files[0];if(!file)return;
      if(file.size>2_000_000)throw Error('Arquivo excede 2 MB.');
      const imported=R.parse(await file.text());
      const key=m=>[m.name,m.birthDate,m.birthTime,m.latitude,m.longitude,m.roddenRating].join('|');
      const known=new Set(maps.map(key)),next=[...maps];let count=0;
      for(const map of imported)if(!known.has(key(map))){next.push(map);known.add(key(map));count++}
      save(next);tell(count+' referência(s) importada(s); duplicatas ignoradas.');
    }catch(error){tell('Importação recusada: '+error.message)}
    finally{$('file').value=''}
  };
  $('apply').onclick=()=>{
    try{
      const map=selected();
      set('nome',map.name);set('data',map.birthDate);set('hora',map.birthTime);
      set('utc',map.timezone);set('nlat',map.latitude);set('nlon',map.longitude);
      set('precision',map.timeQuality);
      set('origem','Rodden '+map.roddenRating+' · '+map.timeSource+' · '+map.sourceCitation);
      if(map.timeQuality==='desconhecida')set('houseSystem','none');
      tell('Referência aplicada ao formulário principal. Rodden '+map.roddenRating+
        ' · qualidade da hora: '+map.timeQuality+'. Revise os dados antes de calcular.');
    }catch(error){tell(error.message)}
  };
  $('export').onclick=()=>{
    try{
      const blob=new Blob([JSON.stringify({schema:R.SCHEMA,maps},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='observatorio-mapas-referencia.json';document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(error){tell(error.message)}
  };
  $('delete').onclick=()=>{
    if(!confirm('Excluir todas as referências importadas deste navegador?'))return;
    try{localStorage.removeItem(KEY);maps=[];render();tell('Referências locais excluídas.')}catch(error){tell(error.message)}
  };
  render();
})();