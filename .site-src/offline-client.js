/* Local opt-in PWA preparation. Cannot promise full offline without confirmed assets. */
(()=>{
  'use strict';
  const $=name=>document.getElementById('oa-o-'+name);
  if(!$('panel'))return;
  const tell=message=>{$('status').textContent=message};
  const BASE=new URL('./',location.href).href;
  let registration=null,activeId=null;
  function register(){
    if(!('serviceWorker' in navigator)||!isSecureContext){
      tell('Este navegador precisa de Service Worker e HTTPS para disponibilizar arquivos offline.');
      return Promise.resolve(null);
    }
    return navigator.serviceWorker.register(new URL('./service-worker.js',BASE).href,{
      scope:BASE,updateViaCache:'none'
    }).then(r=>{registration=r;return r}).catch(error=>{
      tell('Não foi possível ativar o armazenamento offline: '+error.message);
      return null;
    });
  }
  const ready=register();
  $('toggle').onclick=()=>{
    const open=$('panel').hidden;
    $('panel').hidden=!open;
    $('toggle').setAttribute('aria-expanded',String(open));
    if(open)$('close').focus();
  };
  $('close').onclick=()=>{
    $('panel').hidden=true;$('toggle').setAttribute('aria-expanded','false');
    $('toggle').focus();
  };
  $('panel').addEventListener('keydown',event=>{
    if(event.key==='Escape')$('close').click();
  });
  $('prepare').onclick=async()=>{
    const button=$('prepare');
    button.disabled=true;
    try{
      const r=(await ready)||await register();
      if(!r)throw Error('Service Worker indisponível neste contexto.');
      const service=await navigator.serviceWorker.ready;
      const worker=service.active||service.waiting||service.installing;
      if(!worker)throw Error('O Service Worker ainda não está ativo.');
      const id=(crypto.randomUUID?crypto.randomUUID():String(Date.now()));
      activeId=id;
      const storage=await navigator.storage?.estimate?.();
      const space=storage?.quota===undefined?'indisponível':Math.round((storage.quota-storage.usage)/1048576)+' MiB';
      tell('Preparando arquivos públicos... Espaço estimado disponível: '+space+'.');
      worker.postMessage({type:'OA_OFFLINE_PREPARE',id});
    }catch(error){button.disabled=false;tell(error.message)}
  };
  navigator.serviceWorker?.addEventListener('message',event=>{
    const message=event.data;
    if(!message||message.id!==activeId)return;
    const failures=message.errors||[];
    if(message.type==='OA_OFFLINE_PROGRESS'){
      tell('Arquivos verificados: '+message.count+'/'+message.total+
        (failures.length?'\nFalhas até agora: '+failures.join('\n'):''));
    }else if(message.type==='OA_OFFLINE_DONE'){
      activeId=null;$('prepare').disabled=false;
      tell(failures.length?
        'Uso offline INCOMPLETO ('+message.count+'/'+message.total+'). Verifique espaço, conexão e tente novamente.\n'+failures.join('\n'):
        'Uso offline PREPARADO ('+message.total+' arquivos públicos). Recarregue a página para ativar a navegação offline. Os dados de conta e bibliotecas remotas não fazem parte do pacote offline.');
    }
  });
  $('clear').onclick=async()=>{
    if(!confirm('Excluir somente os arquivos públicos em cache? Seus mapas e hipóteses locais serão preservados.'))return;
    const keys=await caches.keys();
    for(const name of keys)if(name.startsWith('oa-pages-'))await caches.delete(name);
    tell('Arquivos públicos offline removidos. Seus registros locais permanecem neste navegador.');
  };
})();