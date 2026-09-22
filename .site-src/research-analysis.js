/* Prospective analysis: descriptive summaries, not evidence of astrology's predictive validity.
 * One sealed protocol = one opportunity. Overlapping techniques remain non-independent.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAResearchAnalysis=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DAY=86400000;
  function wilson(successes,n,z=1.959963984540054){
    if(!Number.isInteger(successes)||!Number.isInteger(n)||n<0||successes<0||successes>n)
      throw Error('Contagens estatísticas inválidas.');
    if(!n)return null;
    const p=successes/n,z2=z*z,den=1+z2/n;
    const midpoint=(p+z2/(2*n))/den;
    const half=z*Math.sqrt(p*(1-p)/n+z2/(4*n*n))/den;
    return [Math.max(0,midpoint-half),Math.min(1,midpoint+half)];
  }
  function checkedNow(now){
    if(typeof now!=='string'||!/^\d{4}-\d\d-\d\dT/.test(now)||
       !Number.isFinite(Date.parse(now)))throw Error('Instante de análise inválido.');
    return Date.parse(now);
  }
  function summarize(items,now=new Date().toISOString()){
    if(!Array.isArray(items)||items.length>20000)throw Error('Conjunto de registros inválido.');
    const time=checkedNow(now);
    const state={opportunities:items.length,pending:0,unreviewed:0,inconclusive:0,
      tp:0,fp:0,fn:0,tn:0,observedEvents:0,baselineExpected:0,
      baselineCovered:0,finalized:0,reviewed:0,eventClosed:0};
    for(const item of items){
      const record=item?.record,assessments=item?.assessments;
      if(!record||typeof record.protocol?.predicted!=='boolean'||!Array.isArray(assessments))
        throw Error('Registro de pesquisa inválido.');
      const {windowStart,windowEnd,predicted,baselineRate}=record.protocol;
      if(typeof windowStart!=='string'||typeof windowEnd!=='string'||
         !/^\d{4}-\d\d-\d\d$/.test(windowStart)||
         !/^\d{4}-\d\d-\d\d$/.test(windowEnd)||
         windowStart>windowEnd)throw Error('Janela de pesquisa inválida.');
      // The 23:59:59.999 UTC of the final day is the hard deadline.
      const start=Date.parse(windowStart+'T00:00:00.000Z');
      const end=Date.parse(windowEnd+'T00:00:00.000Z')+DAY;
      if(!Number.isFinite(start)||!Number.isFinite(end))throw Error('Data final de pesquisa inválida.');
      let review=null,eventClosed=false;
      if(record.protocol.closureMode==='first-confirming-event'){
        const confirmed=assessments.find(a=>a?.observed===true&&Number.isFinite(Date.parse(a.evaluatedAt)));
        if(confirmed){
          const when=Date.parse(confirmed.evaluatedAt);
          if(when>=start&&when<end&&when<=time){review=confirmed;eventClosed=true}
        }
      }
      if(!review&&time<end){state.pending++;continue}
      state.finalized++;
      if(eventClosed)state.eventClosed++;
      if(!review)review=assessments.at(-1);
      if(!review){state.unreviewed++;continue}
      if(review.observed===null){state.inconclusive++;continue}
      if(typeof review.observed!=='boolean')throw Error('Resultado da avaliação inválido.');
      state.reviewed++;
      if(review.observed)state.observedEvents++;
      if(predicted){if(review.observed)state.tp++;else state.fp++}
      else if(review.observed)state.fn++;
      else state.tn++;
      if(baselineRate!==undefined&&baselineRate!==null){
        if(typeof baselineRate!=='number'||!Number.isFinite(baselineRate)||
           baselineRate<0||baselineRate>1)
          throw Error('Taxa-base fora de 0–1.');
        state.baselineCovered++;
        state.baselineExpected+=baselineRate;
      }
    }
    const ratio=(a,b)=>b===0?null:a/b;
    const accuracy=state.tp+state.tn;
    return {...state,
      eventRate:ratio(state.observedEvents,state.reviewed),
      eventRateCI95:wilson(state.observedEvents,state.reviewed),
      accuracy:ratio(accuracy,state.reviewed),
      precision:ratio(state.tp,state.tp+state.fp),
      sensitivity:ratio(state.tp,state.tp+state.fn),
      specificity:ratio(state.tn,state.tn+state.fp),
      falsePositiveRate:ratio(state.fp,state.fp+state.tn),
      baselineExpected:state.baselineCovered?state.baselineExpected:null,
      baselineComparable:state.reviewed>0&&state.baselineCovered===state.reviewed,
      baselineExpectedRate:state.baselineCovered?
        ratio(state.baselineExpected,state.baselineCovered):null};
  }
  function byTechnique(items,now=new Date().toISOString()){
    if(!Array.isArray(items))throw Error('Registros inválidos.');
    const groups=new Map();
    for(const item of items){
      const techniques=item?.record?.protocol?.techniques;
      if(!Array.isArray(techniques))throw Error('Técnicas inválidas.');
      for(const name of new Set(techniques)){
        if(typeof name!=='string'||!name||name.length>120)
          throw Error('Nome de técnica inválido.');
        if(!groups.has(name))groups.set(name,[]);
        groups.get(name).push(item);
      }
    }
    const numberOfTests=groups.size;
    return [...groups].sort(([a],[b])=>a.localeCompare(b,'pt-BR'))
      .map(([name,records])=>({
        name,...summarize(records,now),
        descriptiveOnly:true,
        comparisons:numberOfTests,
        // Conservative Bonferroni reference threshold; no p-values are inferred.
        familywiseAlphaReference:numberOfTests?0.05/numberOfTests:null
      }));
  }
  return {summarize,byTechnique,wilson};
});
