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
  const locked=await E.seal(base,opts);
  const again=await E.seal(base,opts);
  assert.equal(locked.hash,again.hash,'canonical hash must be deterministic');
  assert.equal(locked.hash.length,64);
  assert.equal(await E.verify(locked,webcrypto.subtle),true);
  assert.equal(await E.verify({...locked,protocol:{...locked.protocol,criterion:'retrospective edit'}},webcrypto.subtle),false);
  const outcome=E.assessment(locked,true,'Documento datado', '2027-03-01T00:00:00.000Z');
  assert.equal(outcome.hash,locked.hash);
  assert.throws(()=>E.assessment(locked,'yes','prova'),/Resultado/);
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
  console.log('Research core tests: OK (audit, digest, outcomes, matrix, provenance)');
})().catch(error=>{console.error(error);process.exitCode=1});
