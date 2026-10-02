'use strict';
const assert=require('node:assert/strict'),C=require('./chart-core.js'),I=require('./interpretation-engine.js');
const facts=C.createFacts({subject:{timeQuality:'documented'},bodies:[{name:'Sol',longitude:12},{name:'Lua',longitude:47}],angles:[{name:'Ascendente',longitude:91}]});
for(const level of ['essential','intermediate','professional']){
  const result=I.interpret(facts,{level});assert.equal(result.findings.length,3);
  for(const item of result.findings){assert(item.evidenceTrace.facts.length);assert(item.evidenceTrace.sources.length);assert(item.evidenceTrace.ruleVersion)}
}
const unknown=C.createFacts({subject:{timeQuality:'unknown'},bodies:[{name:'Sol',longitude:12}],angles:[{name:'Ascendente',longitude:91}]});
assert.equal(I.interpret(unknown).findings.some(x=>x.timeSensitive),false);
assert.throws(()=>I.interpret(facts,{level:'místico'}),/inválido/);
console.log('Interpretation engine: levels, evidence trace and time suppression OK');
