'use strict';
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const R=require('./atlas-resume.js');
(async()=>{
  const contract={profile:{subject:'Consulta privada',range:['2027-01-01','2027-09-01']},
    natal:{sun:0,moon:359.9},settings:{orbe:1,timezone:-3}};
  const opts={subtle:webcrypto.subtle};
  const hash=await R.fingerprint(contract,opts);
  assert.equal(hash.length,64);
  assert.equal(await R.fingerprint(JSON.parse(JSON.stringify(contract)),opts),hash);
  assert.notEqual(await R.fingerprint({...contract,settings:{orbe:2,timezone:-3}},opts),hash,
    'altered orbs must start a new run');
  assert.notEqual(await R.fingerprint({...contract,natal:{sun:1,moon:359.9}},opts),hash,
    'altered natal position must start a new run');
  const old={id:'550e8400-e29b-41d4-a716-446655440000',
    start:'2027-01-01',end:'2027-09-01',total:3,completed:3,fingerprint:hash};
  const storage={};
  for(let i=0;i<3;i++)storage[old.id+':'+i]={
    report:{atlasVolume:{index:i+1,total:3,periodStart:old.start,periodEnd:old.end}}
  };
  const read=async key=>storage[key]||null;
  assert.deepEqual(await R.recover(old,{fingerprint:hash,start:old.start,end:old.end,total:3,read}),old);
  delete storage[old.id+':'+1];
  assert.equal((await R.recover(old,{fingerprint:hash,start:old.start,end:old.end,total:3,read})).completed,1,
    'missing middle volume forces restart at first gap');
  assert.equal(await R.recover(old,{fingerprint:'a'.repeat(64),
    start:old.start,end:old.end,total:3,read}),null);
  assert.equal(await R.recover({...old,completed:4},{fingerprint:hash,
    start:old.start,end:old.end,total:3,read}),null);
  assert.equal(await R.recover({...old,id:'../../unsafe'},{
    fingerprint:hash,start:old.start,end:old.end,total:3,read}),null);
  console.log('Atlas resume tests: OK (hash contract, validated stored volumes and gaps)');
})().catch(e=>{console.error(e);process.exitCode=1});
