/* Resume Atlas volumes only when the entire calculation contract matches.
 * No natal data is persisted in the resume index; only its SHA-256 fingerprint.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAAtlasResume=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='oa-atlas-resume/v1';
  async function fingerprint(input,{subtle}={}){
    if(!input||typeof input!=='object')throw Error('Contrato de consulta inválido.');
    const hash=subtle||globalThis.crypto?.subtle;
    if(!hash)throw Error('SHA-256 indisponível em contexto inseguro.');
    const text=JSON.stringify({schema:SCHEMA,engine:'SwissEphemeris@1.3.1',input});
    const result=await hash.digest('SHA-256',new TextEncoder().encode(text));
    return [...new Uint8Array(result)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  async function recover(previous,{fingerprint:hash,start,end,total,read}){
    if(!previous||typeof previous!=='object'||typeof read!=='function')
      return null;
    if(!/^[a-f0-9]{64}$/.test(hash)||previous.fingerprint!==hash||
       previous.start!==start||previous.end!==end||previous.total!==total||
       !/^[0-9a-f-]{20,64}$/i.test(previous.id||'')||
       !Number.isInteger(previous.completed)||previous.completed<0||
       previous.completed>total||!Number.isInteger(total)||total<1)
      return null;
    let completed=0;
    for(let i=0;i<previous.completed;i++){
      const entry=await read(previous.id+':'+i);
      const volume=entry?.report?.atlasVolume;
      if(!volume||volume.index!==i+1||volume.total!==total||
         volume.periodStart!==start||volume.periodEnd!==end)
        break;
      completed++;
    }
    return {id:previous.id,start,end,total,completed,fingerprint:hash};
  }
  return {SCHEMA,fingerprint,recover};
});
