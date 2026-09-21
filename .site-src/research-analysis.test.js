'use strict';
const assert=require('node:assert/strict');
const A=require('./research-analysis.js');
const mk=(predicted,observed,end='2026-08-02',techniques=['Trânsito'],baselineRate)=>{
  const protocol={predicted,windowStart:'2026-08-01',windowEnd:end,techniques};
  if(baselineRate!==undefined)protocol.baselineRate=baselineRate;
  return {record:{protocol},assessments:observed==='missing'?[]:[{
    observed,evaluatedAt:'2026-09-01T00:00:00.000Z'
  }]};
};
const now='2026-09-21T00:00:00.000Z';
assert.equal(A.summarize([],now).opportunities,0);
assert.equal(A.summarize([],now).eventRateCI95,null);
assert.deepEqual(A.wilson(0,0),null);
assert.deepEqual(A.wilson(0,1).map(x=>Math.round(x*1e6)),[0,793451]);
const data=[
  mk(true,true,'2026-08-02',['Trânsito','Profecção'],0.2),
  mk(true,false,'2026-08-02',['Trânsito'],0.2),
  mk(false,true,'2026-08-02',['Profecção'],0.2),
  mk(false,false,'2026-08-02',['Profecção'],0.2),
  mk(true,null),
  mk(true,'missing'),
  mk(false,false,'2026-10-01')
];
const report=A.summarize(data,now);
assert.deepEqual([report.tp,report.fp,report.fn,report.tn],[1,1,1,1]);
assert.equal(report.opportunities,7,'all registered opportunities count');
assert.equal(report.pending,1,'future windows cannot be evaluated');
assert.equal(report.unreviewed,1);
assert.equal(report.inconclusive,1);
assert.equal(report.reviewed,4);
assert.equal(report.baselineCovered,4);
assert.equal(report.baselineComparable,true);
assert.ok(Math.abs(report.baselineExpected-0.8)<1e-10);
assert.equal(report.eventRate,0.5);
assert.equal(report.precision,0.5);
assert.equal(report.sensitivity,0.5);
assert.equal(report.specificity,0.5);
assert.equal(A.summarize([mk(true,false,'2026-09-21')],now).pending,1,
  'last day must finish before score can be assigned');
const groups=A.byTechnique(data,now);
assert.equal(groups.length,2);
assert.deepEqual(groups.map(x=>x.name),['Profecção','Trânsito']);
assert.equal(groups[0].comparisons,2);
assert.equal(groups[0].familywiseAlphaReference,0.025);
assert.equal(groups[0].opportunities,3);
assert.equal(groups[1].opportunities,4);
assert.equal(A.summarize([mk(true,true,'2026-08-02',['Trânsito'])],now).baselineComparable,false);
assert.throws(()=>A.summarize([mk(true,'yes')],now),/Resultado/);
assert.throws(()=>A.summarize([{record:{protocol:{predicted:true}},assessments:[]}],now),/Janela/);
console.log('Prospective analysis tests: OK (opportunities, closure, baseline, groups, Wilson intervals)');
