/* Print-ready local audit report; jsPDF is supplied by the existing Atlas renderer.
 * No user input is interpolated into HTML.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OAResearchPDF=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function lines(item){
    const r=item?.record,p=r?.protocol,assessments=item?.assessments;
    if(!r||!p||!Array.isArray(assessments))throw Error('Selecione um protocolo íntegro.');
    const f=(name,value)=>[name,String(value===undefined||value===null?'Não informado':value)];
    const list=[
      f('Título','OBSERVATÓRIO ASTROLÓGICO / AUDITORIA PROSPECTIVA'),
      f('Finalidade','Relato descritivo de hipótese; não comprova eficácia preditiva.'),
      f('SHA-256',r.hash),
      f('Criado (relógio local; sem carimbo temporal independente)',r.createdAt),
      f('Pergunta',p.question),
      f('Hipótese',p.predicted?'Ocorrência':'Não ocorrência'),
      f('Início UTC',p.windowStart),f('Fim UTC',p.windowEnd),
      f('Técnicas',p.techniques.join('; ')),
      f('Configuração/orbes',p.configuration),
      f('Critério de confirmação',p.criterion),
      f('Critério de não confirmação',p.nonConfirmation),
      f('Referência sem astrologia',p.baseline),
      f('Taxa-base pré-registrada',typeof p.baselineRate==='number'?
        (p.baselineRate*100).toFixed(2)+'%':'Não informada'),
      f('Proveniência técnica',p.provenance?JSON.stringify(p.provenance):'Não anexada'),
      f('Número de avaliações',assessments.length)
    ];
    assessments.forEach((entry,i)=>{
      list.push(
        f('Avaliação '+(i+1)+' — data',entry.evaluatedAt),
        f('Avaliação '+(i+1)+' — resultado',
          entry.observed===null?'Inconclusivo':entry.observed?'Ocorreu':'Não ocorreu'),
        f('Avaliação '+(i+1)+' — evidência',entry.evidence)
      );
    });
    list.push(
      f('Limite do selo','O SHA-256 protege o conteúdo, mas não comprova sua data.'),
      f('Limite da análise','Não inferir causalidade ou capacidade preditiva a partir de coincidências.'),
      f('Emissão do relatório',new Date().toISOString())
    );
    return list;
  }
  function render(item,{doc,save=true}={}){
    let writer=doc;
    if(!writer){
      if(typeof pdfDoc==='function')writer=pdfDoc();
      else if(globalThis.jspdf?.jsPDF)writer=new globalThis.jspdf.jsPDF();
      else throw Error('Biblioteca PDF não disponível. Exporte o backup JSON para preservar os dados.');
    }
    if(typeof writer.splitTextToSize!=='function'||typeof writer.text!=='function'||
       typeof writer.addPage!=='function')throw Error('Gerador PDF incompatível.');
    const margin=18,maxY=275;let y=22;
    writer.setFontSize(10);
    for(const [heading,value] of lines(item)){
      const wrappedHeading=writer.splitTextToSize(heading,174);
      const wrappedBody=writer.splitTextToSize(value,174);
      for(const [type,words] of [['heading',wrappedHeading],['body',wrappedBody]]){
        writer.setFontSize(type==='heading'?10:9);
        for(const line of words){
          if(y>maxY){writer.addPage();y=22}
          writer.text(line,margin,y);
          y+=type==='heading'?5.7:4.8;
        }
      }
      y+=4;
    }
    if(save&&typeof writer.save==='function')
      writer.save('observatorio-auditoria-'+item.record.hash.slice(0,12)+'.pdf');
    return writer;
  }
  return {lines,render};
});
