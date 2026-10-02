'use strict';
const assert=require('node:assert/strict'),C=require('./chart-core.js');
(async()=>{
  assert.equal(C.timePolicy('unknown').allowsAngles,false);
  assert.throws(()=>C.timePolicy('approximate',0),/incerteza/);
  const facts=C.createFacts({subject:{label:'Teste',timeQuality:'unknown'},bodies:[{name:'Sol',longitude:-1},{name:'Lua',longitude:361}],angles:[{name:'Ascendente',longitude:10}]});
  assert.equal(facts.bodies[0].longitude,359);assert.equal(facts.bodies[1].longitude,1);assert.equal(facts.angles.length,0);
  assert(Object.isFrozen(facts)&&Object.isFrozen(facts.bodies));
  assert.throws(()=>C.createFacts({subject:{timeQuality:'exact'},bodies:[{name:'Sol',longitude:''}]}),/Longitude/);
  const civil=C.resolveCivilTime({date:'2026-01-15',time:'12:00:00',timeZone:'America/Sao_Paulo'});
  assert.equal(civil.utc,'2026-01-15T15:00:00.000Z');assert.equal(civil.offsetMinutes,-180);
  assert.deepEqual(C.sensitivity([{Sol:10,Ascendente:20},{Sol:10.1,Ascendente:25}],.25).stable,['Sol']);
  assert.equal(await C.fingerprint(facts),await C.fingerprint(JSON.parse(JSON.stringify(facts))));
  console.log('Chart core: validation, uncertainty, immutability and fingerprint OK');
})().catch(error=>{console.error(error);process.exitCode=1});
