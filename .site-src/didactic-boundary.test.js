'use strict';
const assert=require('node:assert/strict');
const D=require('./didactic-boundary.js');
const calculation={longitude:123.456789,source:'Swiss Ephemeris'};
const record=D.envelope({
  calculation,
  explanation:'O signo é um setor geométrico de 30 graus.',
  sources:[{title:'Swiss Ephemeris',url:'https://www.astro.com/swisseph/'}],
  generatedByAI:true
});
assert.deepEqual(record.calculation,calculation);
record.calculation.longitude=1;
assert.equal(calculation.longitude,123.456789,'didactic envelope must clone, never mutate source calculation');
assert.equal(record.didactic.role,'didactic-only');
assert.match(D.render(record),/não altera os cálculos/);
assert.match(D.render(record),/Fontes:/);
assert.throws(()=>D.envelope({calculation,explanation:'sem fonte',sources:[]}),/fonte/);
assert.throws(()=>D.envelope({calculation,explanation:'x',sources:[{title:'x',url:'javascript:alert(1)'}]}),/fonte/);
console.log('Didactic boundary tests: OK (immutable math separation, AI label, mandatory sources)');
