/* On-demand Swiss worker scanner UI, with cancellation and strict input parsing. */
(()=>{
  'use strict';
  const $=name=>document.getElementById('oa-s-'+name);
  if(!$('panel'))return;
  const DAY=86400000;
  let worker=null,run=null,last=null;
  const tell=value=>{$('result').textContent=value};
  const lock=busy=>{
    $('run').disabled=busy;$('cancel').disabled=!busy;
  };
  function number(field,label,min,max){
    const raw=$(field).value.trim();
    if(!raw)throw Error(label+': valor obrigatório.');
    const value=Number(raw);
    if(!Number.isFinite(value)||value<min||value>max)
      throw Error(label+': intervalo '+min+'–'+max+'.');
    return value;
  }
  const fmt=value=>value.replace('.000Z','Z');
  function ensureWorker(){
    if(worker)return worker;
    if(typeof Worker!=='function')throw Error('Este navegador não oferece Web Workers.');
    worker=new Worker(new URL('./swiss-scan-worker.js',document.baseURI).href,{type:'module'});
    worker.onmessage=event=>{
      const message=event.data;
      if(!run||message?.id!==run.id)return;
      switch(message.type){
        case 'status':tell(message.message);break;
        case 'progress':
          tell('Calculando Swiss: '+message.completed+'/'+message.total+
            ' amostras. Janelas concluídas: '+message.windows+'.');
          break;
        case 'cancelled':
          tell('Consulta cancelada. Nenhuma conclusão parcial foi classificada como janela fechada.');
          run=null;lock(false);break;
        case 'error':
          tell('Falha no cálculo Swiss: '+message.message);
          run=null;lock(false);break;
        case 'done':{
          last={...message,
            parameters:run.parameters,
            exportedAt:new Date().toISOString()};
          const lines=message.windows.map((window,index)=>
            (index+1)+'. '+fmt(window.start)+' até '+fmt(window.end)+
            '\n   Menor desvio amostrado: '+window.deviation.toFixed(5)+'° em '+fmt(window.closest)+
            (window.clippedStart?' · início no limite da consulta':'')+
            (window.clippedEnd?' · fim no limite da consulta':''));
          tell(message.windows.length+' janelas detectadas; '+message.total+
            ' amostras.\n'+message.source+'\n'+message.limitation+'\n\n'+
            (lines.join('\n')||'Nenhuma janela encontrada para esses parâmetros.'));
          $('export').disabled=false;run=null;lock(false);break;
        }
      }
    };
    worker.onerror=event=>{
      tell('Worker indisponível: '+(event.message||'erro de módulo/WASM'));
      worker.terminate();worker=null;run=null;lock(false);
    };
    return worker;
  }
  $('toggle').onclick=()=>{
    const show=$('panel').hidden;$('panel').hidden=!show;
    $('toggle').setAttribute('aria-expanded',String(show));
    if(show)$('close').focus();
  };
  $('close').onclick=()=>{
    $('panel').hidden=true;$('toggle').setAttribute('aria-expanded','false');$('toggle').focus();
  };
  $('panel').addEventListener('keydown',event=>{if(event.key==='Escape')$('close').click()});
  $('run').onclick=()=>{
    try{
      if(run)throw Error('Uma consulta está em andamento.');
      const start=$('start').value,end=$('end').value;
      if(!start||!end)throw Error('Preencha as datas UTC.');
      const a=Date.parse(start+'T00:00:00.000Z'),b=Date.parse(end+'T23:59:59.000Z');
      if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
        throw Error('O fim deve ser posterior ao início.');
      const parameters={
        body:number('body','Corpo',0,9),
        target:number('target','Longitude natal',0,360),
        aspect:number('aspect','Aspecto',0,180),
        orb:number('orb','Orbe',0.01,15),
        stepHours:number('hours','Amostragem',1,24),
        start:new Date(a).toISOString(),end:new Date(b).toISOString()
      };
      last=null;$('export').disabled=true;
      run={id:crypto.randomUUID?.()||String(Date.now()),parameters};
      lock(true);tell('Inicializando scanner Swiss no Worker…');
      ensureWorker().postMessage({type:'scan',id:run.id,...parameters});
    }catch(error){tell(error.message);run=null;lock(false)}
  };
  $('cancel').onclick=()=>{
    if(run&&worker){
      worker.postMessage({type:'cancel',id:run.id});
      tell('Cancelamento solicitado; aguardando o fim do lote atual.');
    }
  };
  $('export').onclick=()=>{
    if(!last)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{
      type:'application/json;charset=utf-8'
    }));
    const a=document.createElement('a');
    a.href=url;a.download='observatorio-janelas-swiss.json';document.body.append(a);
    a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const today=new Date();
  $('start').value=today.toISOString().slice(0,10);
  $('end').value=new Date(today.getTime()+30*DAY).toISOString().slice(0,10);
})();