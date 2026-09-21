'use strict';
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const {encrypt,decrypt}=require('./research-vault.js');
(async()=>{
  const payload={record:{hash:'a'.repeat(64),protocol:{question:'Nome privado e hipótese'}},
    assessments:[{observed:false,evidence:'não confirmado'}]};
  const pass='frase secreta de teste com 12+ caracteres';
  const a=await encrypt(payload,pass,{crypto:webcrypto});
  const b=await encrypt(payload,pass,{crypto:webcrypto});
  assert.equal(a.v,1);
  assert.equal(a.iterations,310000);
  assert.notEqual(a.data,b.data,'fresh randomness for every snapshot');
  assert.notEqual(a.iv,b.iv,'unique AES-GCM nonce');
  assert.equal(JSON.stringify(a).includes('Nome privado'),false,'no plaintext in cloud envelope');
  assert.deepEqual(await decrypt(a,pass,{crypto:webcrypto}),payload);
  await assert.rejects(decrypt(a,'senha errada maior 12',{crypto:webcrypto}),/senha incorreta|alterado/);
  const tampered={...a,data:a.data.slice(0,-4)+'AAAA'};
  await assert.rejects(decrypt(tampered,pass,{crypto:webcrypto}),/incorreta|alterado|malformado/);
  await assert.rejects(encrypt(payload,'short',{crypto:webcrypto}),/frase-senha/);
  await assert.rejects(decrypt({...a,iterations:1},pass,{crypto:webcrypto}),/incompatível/);
  console.log('Research vault crypto tests: OK (roundtrip, random IV, wrong key, tampering)');
})().catch(e=>{console.error(e);process.exitCode=1});
