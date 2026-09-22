(()=>{
  'use strict';
  const root=document.getElementById('oa-missions');
  const $=name=>document.getElementById('oa-m-'+name);
  if(!root||!$('panel'))return;
  const svg=$('wheel'),NS='http://www.w3.org/2000/svg';
  const names=['Sol','Lua'];
  function positionsNow(){
    try{
      if(typeof positions!=='undefined'&&Array.isArray(positions))return positions;
    }catch{}
    return Array.isArray(window.positions)?window.positions:[];
  }
  function point(lon,r=92){
    const rad=(Number(lon)-90)*Math.PI/180;
    return [Math.cos(rad)*r,Math.sin(rad)*r];
  }
  function add(name,attrs,text){
    const n=document.createElementNS(NS,name);
    for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));
    if(text!==undefined)n.textContent=text;
    svg.append(n);return n;
  }
  function base(){
    svg.replaceChildren();
    add('circle',{cx:0,cy:0,r:100,fill:'none',stroke:'#6e9bbc','stroke-width':1.4});
    add('circle',{cx:0,cy:0,r:74,fill:'none',stroke:'#355875','stroke-width':1});
    for(let i=0;i<12;i++){
      const a=point(i*30,74),b=point(i*30,100);
      add('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#355875'});
      const p=point(i*30+15,87);
      add('text',{x:p[0],y:p[1]+3,fill:'#bcd2e5','font-size':8,'text-anchor':'middle'},String(i+1));
    }
  }
  function highlight(lon,label,kind){
    base();
    const p=point(lon,92);
    add('line',{x1:0,y1:0,x2:p[0],y2:p[1],stroke:'#ffd78f','stroke-width':2});
    add('circle',{cx:p[0],cy:p[1],r:6,fill:'#8ef5cb',stroke:'#fff','stroke-width':1});
    const t=point(lon,60);
    add('text',{x:t[0],y:t[1]+4,fill:'#fff','font-size':11,'font-weight':'700','text-anchor':'middle'},label);
    $('output').textContent=label+' destacado em '+Number(lon).toFixed(6)+'°.\n'+
      (kind==='angle'
        ?'Ângulos e casas dependem de hora, local, fuso e sistema de casas confiáveis.'
        :'A longitude vem diretamente das posições calculadas do mapa atual.');
  }
  function mission(id){
    root.querySelectorAll('[data-mission]').forEach(b=>
      b.setAttribute('aria-pressed',String(b.dataset.mission===id)));
    const ps=positionsNow(),houses=window.currentHouseGeometry;
    if(id==='sun'||id==='moon'){
      const index=id==='sun'?0:1,lon=ps[index]?.lon;
      if(!Number.isFinite(lon))throw Error(names[index]+' indisponível. Calcule primeiro o mapa.');
      highlight(lon,names[index],'planet');return;
    }
    const precision=document.getElementById('precision')?.value;
    const noHouses=document.getElementById('houseSystem')?.value==='none';
    if(precision==='desconhecida'||noHouses)
      throw Error('Casas indisponíveis: hora natal desconhecida ou mapa explicitamente sem casas.');
    if(!houses)throw Error('Geometria de casas indisponível. Calcule um mapa com hora e localização.');
    const lon=id==='asc'?houses.asc:houses.mc;
    if(!Number.isFinite(lon))throw Error('Ângulo não calculado.');
    highlight(lon,id==='asc'?'ASC / Casa 1':'MC / Casa 10','angle');
  }
  $('open').onclick=()=>{
    const open=$('panel').hidden;$('panel').hidden=!open;
    $('open').setAttribute('aria-expanded',String(open));
    if(open){$('close').focus();base()}
  };
  $('close').onclick=()=>{
    $('panel').hidden=true;$('open').setAttribute('aria-expanded','false');$('open').focus();
  };
  $('panel').addEventListener('keydown',e=>{if(e.key==='Escape')$('close').click()});
  root.querySelectorAll('[data-mission]').forEach(button=>button.addEventListener('click',()=>{
    try{mission(button.dataset.mission)}catch(error){base();$('output').textContent=error.message}
  }));
  base();
})();