'use strict';
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const E=require('./research-core.js');
const base={
  question:'Haverá contratação formal?',
  techniques:['Profecção anual','Trânsito'],
  configuration:'Quadratura 90° ±1°, Swiss Ephemeris, mapa tropical',
  windowStart:'2027-02-01',windowEnd:'2027-02-28',
  criterion:'Contrato assinado e datado na janela',
  nonConfirmation:'Ausência de contrato assinado na janela',
  baseline:'Taxa de contratações no setor sem uso de astrologia',
  predicted:true
};
(async()=>{
  assert.throws(()=>E.protocol({...base,windowEnd:'2027-01-01'}),/janela/);
  assert.throws(()=>E.protocol({...base,windowStart:'2027-02-30'}),/inexistente/);
  assert.throws(()=>E.protocol({...base,predicted:'yes'}),/Defina a hipótese/);
  assert.throws(()=>E.protocol({...base,techniques:[]}),/técnica/);
  assert.throws(()=>E.protocol({...base,criterion:''}),/obrigatório/);
  const opts={now:()=> '2026-09-21T12:00:00.000Z',subtle:webcrypto.subtle};
  await assert.rejects(
    E.seal({...base,windowStart:'2026-09-20',windowEnd:'2026-09-25'},opts),
    /retrospectiva/
  );
  assert.equal(E.protocol({...base,baselineRate:0}).baselineRate,0);
  assert.equal(E.protocol({...base,baselineRate:1}).baselineRate,1);
  assert.equal(E.protocol({...base,closureMode:'first-confirming-event'}).closureMode,'first-confirming-event');
  assert.throws(()=>E.protocol({...base,closureMode:'volume-end'}),/encerramento/);
  assert.equal(Object.hasOwn(E.protocol(base),'baselineRate'),false,'legacy v1 hash layout unchanged');
  assert.throws(()=>E.protocol({...base,baselineRate:-0.01}),/Taxa-base/);
  assert.throws(()=>E.protocol({...base,baselineRate:1.01}),/Taxa-base/);
  const locked=await E.seal(base,opts);
  const again=await E.seal(base,opts);
  assert.equal(locked.hash,again.hash,'canonical hash must be deterministic');
  assert.equal(locked.hash.length,64);
  assert.equal(await E.verify(locked,webcrypto.subtle),true);
  const baselineLocked=await E.seal({...base,baselineRate:0.25},opts);
  assert.equal(await E.verify(baselineLocked,webcrypto.subtle),true);
  assert.notEqual(baselineLocked.hash,locked.hash);
  assert.equal(await E.verify({...locked,protocol:{...locked.protocol,criterion:'retrospective edit'}},webcrypto.subtle),false);
  const outcome=E.assessment(locked,true,'Documento datado', '2027-03-01T00:00:00.000Z');
  assert.equal(outcome.hash,locked.hash);
  assert.throws(()=>E.assessment(locked,'yes','prova'),/Resultado/);
  assert.throws(
    ()=>E.assessment(locked,true,'Antes da janela','2027-01-31T23:59:59.000Z'),
    /anterior ao início/
  );
  assert.throws(
    ()=>E.assessment(locked,false,'Ausência ainda não observável','2027-02-27T12:00:00.000Z'),
    /encerramento da janela/
  );
  assert.equal(
    E.assessment(locked,false,'Ausência após fechamento','2027-03-01T00:00:00.000Z').observed,
    false
  );
  const mk=(predicted,observed)=>({
    record:{protocol:{predicted}},
    assessment:{observed}
  });
  const matrix=E.confusion([
    mk(true,true),mk(true,false),mk(false,true),mk(false,false),mk(true,null)
  ]);
  assert.deepEqual([matrix.tp,matrix.fp,matrix.fn,matrix.tn,matrix.inconclusive],[1,1,1,1,1]);
  assert.equal(matrix.precision,0.5);
  assert.equal(matrix.sensitivity,0.5);
  assert.equal(E.confusion([mk(false,false)]).precision,null);
  assert.equal(E.provenance({
    birthDate:'2000-01-01',timePrecision:'desconhecida',latitude:0,longitude:0,
    zodiac:'Tropical'
  }).houseSystem,null,'unknown birth time may not invent a house');
  assert.throws(()=>E.provenance({
    birthDate:'2000-01-01',timePrecision:'documentada',birthTime:'12:00',
    timezone:'',latitude:0,longitude:0,zodiac:'Tropical',houseSystem:'Placidus',
    timeSource:'Certidão'
  }),/UTC/);
  assert.throws(()=>E.provenance({
    birthDate:'2000-01-01',timePrecision:'documentada',birthTime:'99:99',
    timezone:-3,latitude:0,longitude:0,zodiac:'Tropical',houseSystem:'Placidus',
    timeSource:'Certidão'
  }),/Hora natal/);
  assert.throws(()=>E.provenance({
    birthDate:'2000-01-01',timePrecision:'documentada',birthTime:'12:00',
    timezone:-3,latitude:true,longitude:0,zodiac:'Tropical',houseSystem:'Placidus',
    timeSource:'Certidão'
  }),/Latitude/);
  console.log('Research core tests: OK (audit, digest, outcomes, matrix, provenance)');
})().catch(error=>{console.error(error);process.exitCode=1});
