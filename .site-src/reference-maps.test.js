'use strict';
const assert=require('node:assert/strict');
const R=require('./reference-maps.js');
const base={
  name:'Pessoa de referência',birthDate:'1984-03-15',birthTime:'14:32',
  timezone:-3,latitude:-22.9,longitude:-43.2,roddenRating:'AA',
  timeSource:'Certidão',sourceCitation:'Arquivo público consultado'
};
assert.equal(R.normalize(base).timeQuality,'documentada');
assert.equal(R.normalize({...base,roddenRating:'B'}).timeQuality,'aproximada');
const unknown=R.normalize({...base,roddenRating:'X',birthTime:'99:99',timezone:null});
assert.equal(unknown.birthTime,null);
assert.equal(unknown.timezone,null);
assert.equal(unknown.timeQuality,'desconhecida');
assert.deepEqual(R.parse(JSON.stringify({maps:[base,{...base,name:'Outra',roddenRating:'DD'}]})).map(x=>x.roddenRating),['AA','DD']);
assert.throws(()=>R.normalize({...base,roddenRating:'ZZ'}),/Rodden/);
assert.throws(()=>R.normalize({...base,birthTime:'25:00'}),/Hora/);
assert.throws(()=>R.normalize({...base,latitude:true}),/Latitude/);
assert.throws(()=>R.parse('[]'),/1 a 500/);
assert.throws(()=>R.parse(JSON.stringify(Array.from({length:501},()=>base))),/1 a 500/);
console.log('Reference map tests: OK (Rodden ratings, unknown time, validation, limits)');
