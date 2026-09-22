(()=>{
  'use strict';
  const root=document.getElementById('oa-biwheel'),B=window.OABiWheel,E=window.OATraditionalEngine;
  const $=name=>document.getElementById('oa-b-'+name),NS='http://www.w3.org/2000/svg';
  if(!root||!B||!E||!$('panel'))return;
  const svg=$('wheel');
  function natal(){
    try{if(typeof positions!=='undefined'&&Array.isArray(positions))return positions.slice(0,10)}catch{}
    return Array.isArray(window.positions)?window.positions.slice(0,10):[];
  }
  function birthJD(){
    const date=document.getElementById('data')?.value,time=document.getElementById('hora')?.value,
      utc=document.getElementById('utc')?.value;
    if(!date||!time||utc===''||!Number.isFinite(Number(utc)))throw Error('Mapa natal sem data/hora/UTC utilizáveis.');
    const raw=Date.parse(date+'T'+(time.length===5?time+':00':time)+'Z');
    if(!Number.isFinite(raw))throw Error('Data natal inválida.');
    return (raw-Number(utc)*3600000)/86400000+2440587.5;
  }
  function targetJD(){
    const d=$('date').value,t=$('time').value;if(!d||!t)throw Error('Informe data e hora UTC.');
    const ms=Date.parse(d+'T'+t+':00Z');if(!Number.isFinite(ms))throw Error('Data-alvo inválida.');
    return ms/86400000+2440587.5;
  }
  function add(name,attrs,text){
    const node=document.createElementNS(NS,name);
    for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,String(v));
    if(text!==undefined)node.textContent=text;svg.append(node);return node;
  }
  function xy(lon,r){const a=(Number(lon)-90)*Math.PI/180;return [Math.cos(a)*r,Math.sin(a)*r]}
  function draw(inner,outer){
    svg.replaceChildren();
    for(const r of [58,94,128,160])add('circle',{cx:0,cy:0,r,fill:'none',stroke:r===94?'#ffcf83':'#4f7797','stroke-width':r===94?1.6:1});
    for(let i=0;i<12;i++){const p=xy(i*30,58),q=xy(i*30,160);add('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:'#294a66','stroke-width':.7})}
    const plot=(set,r,fill,prefix)=>set.forEach((p,i)=>{const q=xy(p.lon,r);add('circle',{cx:q[0],cy:q[1],r:4,fill});const label=xy(p.lon,r+(r>100?12:-12));add('text',{x:label[0],y:label[1]+3,fill:'#fff','font-size':7,'text-anchor':'middle'},prefix+(p.name||i).slice(0,3))});
    plot(inner,76,'#ffd78f','N:');plot(outer,142,'#8ef5cb','T:');
  }
  async function run(){
    const inner=natal();if(inner.length<7)throw Error('Calcule primeiro um mapa natal.');
    if(typeof window.calc!=='function'||!window.obsSwiss?.ready)throw Error('Swiss Ephemeris ainda não está pronta.');
    const b=birthJD(),t=targetJD(),layer=$('layer').value;
    let result;
    if(layer==='transit')result=B.transit(t,window.calc,Array.from({length:10},(_,i)=>i));
    if(layer==='progression')result=B.secondaryProgression(b,t,window.calc,Array.from({length:10},(_,i)=>i));
    if(layer==='solar-true'||layer==='solar-mean')result=B.solarArc(b,t,inner,jd=>window.calc(jd,0).lon,{mode:layer==='solar-true'?'true':'mean'});
    if(!result)throw Error('Camada temporal inválida.');
    draw(inner,result.positions);
    const compare=B.compareSolarArc(b,t,inner,jd=>window.calc(jd,0).lon);
    $('out').textContent='Camada: '+result.technique+
      '\nData-alvo: '+new Date((t-2440587.5)*86400000).toISOString()+
      (result.age!==undefined?'\nIdade tropical fracionária: '+result.age.toFixed(8):'')+
      (result.arc!==undefined?'\nArco aplicado: '+result.arc.toFixed(8)+'°':'')+
      '\nComparação arco solar verdadeiro − médio: '+compare.difference.toFixed(8)+'°'+
      (result.convention?'\nConvenção: '+result.convention:'');
  }
  $('open').onclick=()=>{
    const open=$('panel').hidden;$('panel').hidden=!open;$('open').setAttribute('aria-expanded',String(open));
    if(open){$('close').focus();if(!$('date').value)$('date').value=new Date().toISOString().slice(0,10);run().catch(e=>$('out').textContent=e.message)}
  };
  $('close').onclick=()=>{$('panel').hidden=true;$('open').setAttribute('aria-expanded','false');$('open').focus()};
  $('panel').addEventListener('keydown',e=>{if(e.key==='Escape')$('close').click()});
  $('run').onclick=()=>run().catch(e=>$('out').textContent=e.message);
  for(const id of ['date','time','layer'])$(id).addEventListener('change',()=>run().catch(e=>$('out').textContent=e.message));
})();