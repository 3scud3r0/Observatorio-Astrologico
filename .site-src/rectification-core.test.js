'use strict';
const assert=require('node:assert/strict');
const E=require('./rectification-core.js');
const birthDate='2000-01-01',baseJD=Date.parse(birthDate+'T00:00:00Z')/86400000+2440587.5;
const events=[
  {jd:baseJD+100,body:0,angle:'ASC',aspect:0,weight:1,source:'Registro 1'},
  {jd:baseJD+200,body:1,angle:'MC',aspect:0,weight:2,source:'Registro 2'}
];
const params={
  birthDate,utcOffsetHours:0,latitude:0,longitude:0,
  fromMinute:480,toMinute:600,stepMinutes:5,orbDegrees:2,
  houseSystem:'E',events,
  calcBody:(_jd,body)=>({lon:body===0?180:270}),
  calcHouses:(jd)=>({asc:(jd-baseJD)*1440,mc:(jd-baseJD)*1440+90})
};
const result=E.rectify(params);
assert.equal(result.best.minute,540);
assert.ok(result.best.score<1e-10);
assert.equal(result.best.details.length,2);
assert.equal(result.evaluated,25);
assert.equal(result.eventCount,2);
assert.equal(result.nearMinimum.fromMinute,540);
assert.equal(result.nearMinimum.toMinute,540);
assert.match(result.nearMinimum.meaning,/NÃO é intervalo de confiança/);
assert.match(result.disclaimer,/não validação/);
assert.equal(E.separation(359,1),2);
assert.equal(E.separation(180,0),180);
assert.throws(()=>E.rectify({...params,events:[events[0]]}),/2 e 100/);
assert.throws(()=>E.rectify({...params,fromMinute:601}),/crescente/);
assert.throws(()=>E.rectify({...params,utcOffsetHours:''}),/obrigatório/);
assert.throws(()=>E.rectify({...params,birthDate:'2000-02-30'}),/inválida/);
assert.throws(()=>E.rectify({...params,stepMinutes:1,fromMinute:0,toMinute:1439}),/500/);
assert.throws(()=>E.rectify({...params,events:[events[0],{...events[1],source:''}]}),/Fonte documental/);
assert.throws(()=>E.rectify({...params,calcHouses:()=>({asc:NaN,mc:0})}),/não calculado/);
console.log('Rectification tests: OK (weighted objective, minutes, uncertainty, validation)');
