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
  const jd=value=>Date.parse(value+'T00:00:00.000Z')/86400000+2440587.5;
  const item={
    scope:'ceu',i:0,k:1,z:2,label:'Sol quadratura Lua',
    start:jd('2027-01-02')+.5,last:jd('2027-01-03')-.25,
    startUTC:'2027-01-02T12:00:00.000Z',endUTC:'2027-01-02T18:00:00.000Z',
    peakJD:jd('2027-01-02')+.6,peakUTC:'2027-01-02T14:24:00.000Z',
    bestJ:jd('2027-01-02')+.6,orb:.6,min:.6,
    truncatedLeft:false,truncatedRight:true,samples:2
  };
  const tail={...item,start:jd('2027-01-03'),
    last:jd('2027-01-03')+.25,startUTC:'2027-01-03T00:00:00.000Z',
    endUTC:'2027-01-03T06:00:00.000Z',peakJD:jd('2027-01-03')+.125,
    peakUTC:'2027-01-03T03:00:00.000Z',bestJ:jd('2027-01-03')+.125,
    orb:.2,min:.2,truncatedLeft:true,truncatedRight:false,samples:3};
  const meta={total:2,periodStart:'2027-01-01',periodEnd:'2027-01-04'};
  const first={
    atlasVolume:{...meta,index:1},input:{gStart:'2027-01-01',gEnd:'2027-01-02'},
    method:{gridHours:6},contacts:[item]
  };
  const second={
    atlasVolume:{...meta,index:2},input:{gStart:'2027-01-03',gEnd:'2027-01-04'},
    method:{gridHours:6},contacts:[tail,{...tail,i:2,label:'Mercúrio quadratura Lua',
      truncatedLeft:false,truncatedRight:false}]
  };
  const combined=R.mergeVolumes([first,second]);
  assert.equal(combined.complete,true);
  assert.equal(combined.boundaryJoins,1);
  assert.equal(combined.contacts.length,2,'adjacent matching transit is one opportunity');
  const merged=combined.contacts.find(x=>x.i===0);
  assert.equal(merged.start,item.start);
  assert.equal(merged.last,tail.last);
  assert.equal(merged.orb,.2);
  assert.equal(merged.peakJD,tail.peakJD);
  assert.equal(merged.truncatedRight,false);
  assert.equal(merged.samples,5);
  assert.equal(item.last,jd('2027-01-03')-.25,'source volume must not mutate');
  assert.equal(R.mergeVolumes([first]).complete,false,'partial consultation is marked incomplete');
  assert.throws(()=>R.mergeVolumes([first,{...second,input:{gStart:'2027-01-04',gEnd:'2027-01-04'}}]),/lacuna/);
  assert.throws(()=>R.mergeVolumes([first,{...second,atlasVolume:{...meta,index:3}}]),/fora de ordem/);
  assert.throws(()=>R.mergeVolumes([first,{...second,contacts:[{...tail,orb:-1}]}]),/malformada/);
  console.log('Atlas resume tests: OK (hash contract, validated stored volumes and gaps)');
})().catch(e=>{console.error(e);process.exitCode=1});
