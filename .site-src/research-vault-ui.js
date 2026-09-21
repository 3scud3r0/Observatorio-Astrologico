/* Optional encrypted snapshots. Existing Atlas Supabase configuration/session is reused. */
(()=>{
  'use strict';
  const $=id=>document.getElementById('oa-v-'+id);
  if(!$('panel')||!window.OAResearchVault)return;
  const V=window.OAResearchVault,E=window.OAResearch;
  const tell=text=>{$('status').textContent=text};
  const KEY='./atlas-auth.json';
  let client=null,rows=[],owner=null;
  const pass=()=>{
    const value=$('password').value;
    $('password').value='';
    return value;
  };
  async function account(){
    if(!client){
      const r=await fetch(KEY,{cache:'no-store'});
      if(!r.ok)throw Error('Configuração Supabase não encontrada.');
      const config=await r.json();
      if(!config.url||!config.publishableKey){
        throw Error('Sincronização remota não configurada. Defina a URL e a chave PUBLICÁVEL do seu projeto; nunca uma service_role.');
      }
      const url=new URL(config.url);
      if(url.protocol!=='https:')throw Error('Supabase requer uma URL HTTPS.');
      const sdk=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
      client=sdk.createClient(url.href,config.publishableKey,{
        auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true}
      });
    }
    const {data,error}=await client.auth.getUser();
    if(error)throw error;
    if(!data?.user)throw Error('Entre primeiro na sua conta pelo painel Atlas.');
    if(owner&&owner!==data.user.id){rows=[];$('snapshots').replaceChildren()}
    owner=data.user.id;
    return data.user;
  }
  function chosen(){
    const index=Number($('snapshots').value);
    if(!Number.isInteger(index)||index<0||index>=rows.length)
      throw Error('Selecione um snapshot da sua conta.');
    return rows[index];
  }
  async function list(){
    const user=await account();
    const {data,error}=await client.from('atlas_research_vault')
      .select('id,record_hash,ciphertext,created_at')
      .eq('owner_id',user.id).order('created_at',{ascending:false}).limit(200);
    if(error)throw error;
    rows=data||[];
    $('snapshots').replaceChildren();
    rows.forEach((row,i)=>{
      const option=document.createElement('option');
      option.value=String(i);
      option.textContent=(i+1)+'. '+row.created_at+' · '+row.record_hash.slice(0,16)+'…';
      $('snapshots').append(option);
    });
    tell(rows.length+' snapshots cifrados disponíveis na conta. Somente a frase-senha pode decifrá-los.');
  }
  function click(id,handler){
    $(id).onclick=async()=>{
      $(id).disabled=true;
      try{await handler()}catch(error){tell(error.message)}
      finally{$(id).disabled=false}
    };
  }
  $('toggle').onclick=()=>{
    const opening=$('panel').hidden;
    $('panel').hidden=!opening;$('toggle').setAttribute('aria-expanded',String(opening));
    if(opening)$('close').focus();
  };
  $('close').onclick=()=>{
    $('panel').hidden=true;$('toggle').setAttribute('aria-expanded','false');
    $('password').value='';$('toggle').focus();
  };
  $('panel').addEventListener('keydown',event=>{
    if(event.key==='Escape')$('close').click();
  });
  click('upload',async()=>{
    const user=await account();
    const local=window.OAResearchLocal;
    if(!local)throw Error('Laboratório local não carregado.');
    const snapshot=await local.getSelected();
    if(!await E.verify(snapshot.record))
      throw Error('Selo local inválido. Upload recusado.');
    const phrase=pass();
    const ciphertext=await V.encrypt(snapshot,phrase);
    const {error}=await client.from('atlas_research_vault').insert({
      owner_id:user.id,record_hash:snapshot.record.hash,ciphertext
    });
    if(error)throw error;
    await list();
    tell('Snapshot enviado cifrado. Este envio é uma cópia explícita; a hipótese local continua no navegador.');
  });
  click('list',list);
  click('restore',async()=>{
    const user=await account(),row=chosen();
    if(user.id!==owner)throw Error('Conta alterada. Atualize a lista.');
    const snapshot=await V.decrypt(row.ciphertext,pass());
    if(!snapshot?.record||snapshot.record.hash!==row.record_hash||
       !await E.verify(snapshot.record))
      throw Error('Selo do backup divergente.');
    const added=await window.OAResearchLocal.importSnapshot(snapshot);
    tell(added?'Snapshot decifrado e restaurado localmente.':'Já existe um protocolo com esse selo no navegador. Nada foi sobrescrito.');
  });
  click('delete',async()=>{
    const user=await account(),row=chosen();
    if(!confirm('Excluir este snapshot cifrado da sua conta? O backup local não será alterado.'))return;
    const {error}=await client.from('atlas_research_vault').delete()
      .eq('id',row.id).eq('owner_id',user.id);
    if(error)throw error;
    await list();
    tell('Snapshot cifrado excluído da conta. Os registros locais permanecem intactos.');
  });
})();