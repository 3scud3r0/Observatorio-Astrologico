/* Browser-side encryption of opt-in cloud backups; passphrases never leave the device. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAResearchVault=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CONTEXT='oa-research-vault/v1',ITERATIONS=310000;
  const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
  function crypt(backend){
    const api=backend||globalThis.crypto;
    if(!api?.subtle||typeof api.getRandomValues!=='function')
      throw Error('Criptografia WebCrypto indisponível neste navegador.');
    return api;
  }
  function password(value){
    if(typeof value!=='string'||value.length<12||value.length>256)
      throw Error('Use uma frase-senha de 12 a 256 caracteres (não guardada na nuvem).');
    return value;
  }
  function b64(bytes){
    if(typeof btoa==='function'){
      let binary='';
      for(const byte of bytes)binary+=String.fromCharCode(byte);
      return btoa(binary);
    }
    if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64');
    throw Error('Codificador Base64 indisponível.');
  }
  function unb64(value,max){
    if(typeof value!=='string'||value.length>max*2||
       !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
      throw Error('Backup cifrado malformado.');
    const decoded=typeof atob==='function'?atob(value):
      typeof Buffer!=='undefined'?Buffer.from(value,'base64').toString('binary'):null;
    if(decoded===null)throw Error('Decodificador Base64 indisponível.');
    return Uint8Array.from(decoded,c=>c.charCodeAt(0));
  }
  async function key(api,pass,salt){
    const base=await api.subtle.importKey('raw',enc.encode(password(pass)),'PBKDF2',false,['deriveKey']);
    return api.subtle.deriveKey(
      {name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},
      base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']
    );
  }
  async function encrypt(payload,pass,{crypto:backend}={}){
    const api=crypt(backend),data=enc.encode(JSON.stringify(payload));
    if(data.length>1000000)throw Error('Backup acima de 1 MB; divida em volumes.');
    const salt=api.getRandomValues(new Uint8Array(16)),iv=api.getRandomValues(new Uint8Array(12));
    const secret=await key(api,pass,salt);
    const ciphertext=await api.subtle.encrypt(
      {name:'AES-GCM',iv,additionalData:enc.encode(CONTEXT)},secret,data
    );
    return {v:1,kdf:'PBKDF2-SHA-256',iterations:ITERATIONS,
      cipher:'AES-256-GCM',salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(ciphertext))};
  }
  async function decrypt(envelope,pass,{crypto:backend}={}){
    const api=crypt(backend);
    if(!envelope||envelope.v!==1||envelope.kdf!=='PBKDF2-SHA-256'||
       envelope.cipher!=='AES-256-GCM'||envelope.iterations!==ITERATIONS)
      throw Error('Versão de criptografia incompatível.');
    const salt=unb64(envelope.salt,16),iv=unb64(envelope.iv,12),data=unb64(envelope.data,1100000);
    if(salt.length!==16||iv.length!==12||data.length<16)
      throw Error('Backup cifrado incompleto.');
    try{
      const secret=await key(api,pass,salt);
      const plain=await api.subtle.decrypt(
        {name:'AES-GCM',iv,additionalData:enc.encode(CONTEXT)},secret,data
      );
      return JSON.parse(dec.decode(plain));
    }catch{
      throw Error('Não foi possível decifrar: senha incorreta ou conteúdo alterado.');
    }
  }
  return {encrypt,decrypt,CONTEXT,ITERATIONS};
});
