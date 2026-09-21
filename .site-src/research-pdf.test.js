'use strict';
const assert=require('node:assert/strict');
const P=require('./research-pdf.js');
const record={hash:'a'.repeat(64),createdAt:'2026-09-21T12:00:00Z',protocol:{
  question:'Haverá contratação assinada?',
  predicted:true,techniques:['Trânsito','Profecção'],
  windowStart:'2027-02-01',windowEnd:'2027-02-28',
  configuration:'Orbe ±1°',criterion:'Contrato datado',
  nonConfirmation:'Ausência de contrato',baseline:'Taxa histórica',baselineRate:0.2
}};
const assessments=Array.from({length:45},(_,i)=>({
  evaluatedAt:'2027-03-01T00:00:00Z',
  observed:i%2===0,evidence:'Evidência nº '+i+' — '.repeat(20)
}));
const item={record,assessments};
const all=P.lines(item);
assert.ok(all.some(([k,v])=>k==='SHA-256'&&v===record.hash));
assert.ok(all.some(([k,v])=>k==='Taxa-base pré-registrada'&&v==='20.00%'));
assert.ok(all.some(([k,v])=>k==='Avaliação 45 — resultado'));
const written=[],saved=[],doc={
  setFontSize(){},
  splitTextToSize(v){return String(v).match(/.{1,50}/gu)||['']},
  text(value){written.push(value)},
  addPage(){written.push('PAGE_BREAK')},
  save(filename){saved.push(filename)}
};
assert.equal(P.render(item,{doc}),doc);
assert.ok(written.includes('PAGE_BREAK'),'long reports must paginate');
assert.ok(written.join('').includes(record.hash),'wrapped PDF text retains the entire SHA-256');
assert.deepEqual(saved,['observatorio-auditoria-aaaaaaaaaaaa.pdf']);
assert.throws(()=>P.lines({record,assessments:null}),/íntegro/);
console.log('Research PDF tests: OK (full protocol, outcome history, pagination and export)');
