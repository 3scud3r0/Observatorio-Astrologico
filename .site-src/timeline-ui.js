/* Transit clock: uses the existing Swiss Ephemeris calculator for one instant at a time. */
(()=>{
  'use strict';
  const T=window.OATimeline,$=id=>document.getElementById('oa-t-'+id);
  if(!T||!$('panel'))return;
  const SIGNS=['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
  const SVG='http://www.w3.org/2000/svg';
  const svg=$('wheel');
  const node=(name,attrs={})=>{
    const element=document.createElementNS(SVG,name);
    for(const [key,value] of Object.entries(attrs))element.setAttribute(key,String(value));
    svg.append(element);return element;
  };
  const point=(longitude,radius)=>{
    const radians=(longitude-90)*Math.PI/180;
    return [Math.cos(radians)*radius,Math.sin(radians)*radius];
  };
  function draw(position,target){
    svg.replaceChildren();
    node('circle',{cx:0,cy:0,r:102,fill:'none',stroke:'#82cde8','stroke-width':1.8});
    node('circle',{cx:0,cy:0,r:80,fill:'none',stroke:'#416e97','stroke-width':1.3});
    for(let n=0;n<12;n++){
      const outer=point(n*30,102),inner=point(n*30,80);
      node('line',{x1:inner[0],y1:inner[1],x2:outer[0],y2:outer[1],stroke:'#416e97'});
      const label=point(n*30+15,91);
      const text=node('text',{x:label[0],y:label[1]+3,fill:'#eff9ff','font-size':8,'text-anchor':'middle'});
      text.textContent=String(n+1);
    }
    const marker=(lon,color,r)=>{
      const p=point(lon,r);
      node('line',{x1:0,y1:0,x2:p[0],y2:p[1],stroke:color,'stroke-width':1.8});
      node('circle',{cx:p[0],cy:p[1],r:4,fill:color});
    };
    if(Number.isFinite(target))marker(target,'#ffde8b',72);
    marker(position,'#8ef5cb',100);
    node('circle',{cx:0,cy:0,r:4,fill:'#82cde8'});
  }
  function base(){return T.parseUTC($('date').value,$('time').value)}
  const rawTarget=()=>{
    const raw=$('target').value.trim();
    if(!raw)return null;
    const n=Number(raw);
    if(!Number.isFinite(n)||n<0||n>360)throw Error('Longitude natal: informe 0° a 360°.');
    return n;
  };
  function render(){
    try{
      if(typeof window.calc!=='function'||!window.obsSwiss?.ready)
        throw Error('Swiss Ephemeris ainda não está pronta. Carregue primeiro um mapa no Observatório.');
      const offset=Number($('slider').value);
      const instant=T.advance(base(),offset,'day');
      const body=Number($('body').value);
      const result=window.calc(T.julian(instant),body);
      if(!result||!Number.isFinite(result.lon))
        throw Error('Sem coordenadas Swiss para este corpo e instante.');
      const lon=((result.lon%360)+360)%360,target=rawTarget();
      const sign=SIGNS[Math.floor(lon/30)],degree=(lon%30).toFixed(6);
      let output='Instante UTC: '+instant.toISOString()+
        '\nCorpo: '+$('body').selectedOptions[0].textContent+
        '\nLongitude: '+lon.toFixed(6)+'° ('+sign+' '+degree+'°)'+
        '\nVelocidade: '+(Number.isFinite(result.speed)?result.speed.toFixed(7)+'°/dia'+
          (result.speed<0?' · retrógrado':' · direto'):'indisponível');
      if(target!==null){
        const orb=$('orb').value.trim(),o=Number(orb),angle=Number($('aspect').value);
        if(!orb||!Number.isFinite(o)||o<0||o>15)throw Error('Orbe: use 0° a 15°.');
        const aspect=T.aspects(lon,target,[{angle,orb:o}])[0];
        output+='\nAlvo natal: '+target.toFixed(6)+'°'+
          '\nAspecto '+angle+'°: diferença '+aspect.deviation.toFixed(6)+'° — '+
          (aspect.inOrb?'dentro do orbe':'fora do orbe');
      }else output+='\nInforme a longitude natal para investigar um aspecto.';
      draw(lon,target);
      $('out').textContent=output;
    }catch(error){$('out').textContent=error.message;svg.replaceChildren()}
  }
  function step(amount){
    try{
      const date=T.advance(base(),amount,$('unit').value);
      $('date').value=date.toISOString().slice(0,10);
      $('time').value=date.toISOString().slice(11,16);
      $('slider').value='0';render();
    }catch(error){$('out').textContent=error.message}
  }
  $('toggle').onclick=()=>{
    const opening=$('panel').hidden;
    $('panel').hidden=!opening;
    $('toggle').setAttribute('aria-expanded',String(opening));
    if(opening){$('close').focus();render()}
  };
  $('close').onclick=()=>{
    $('panel').hidden=true;$('toggle').setAttribute('aria-expanded','false');$('toggle').focus();
  };
  $('panel').addEventListener('keydown',event=>{if(event.key==='Escape')$('close').click()});
  $('back').onclick=()=>step(-1);
  $('forward').onclick=()=>step(1);
  $('now').onclick=()=>{
    const now=new Date();
    $('date').value=now.toISOString().slice(0,10);
    $('time').value=now.toISOString().slice(11,16);
    $('slider').value='0';render();
  };
  $('natal').onclick=()=>{
    try{
      const positions=(typeof window.positions!=='undefined'&&Array.isArray(window.positions))?
        window.positions:(typeof globalThis.positions!=='undefined'&&Array.isArray(globalThis.positions)?
          globalThis.positions:[]);
      const lon=positions[Number($('body').value)]?.lon;
      if(!Number.isFinite(lon))
        throw Error('O mapa atual não disponibilizou esse corpo; informe a longitude natal manualmente.');
      $('target').value=String(lon);render();
    }catch(error){$('out').textContent=error.message}
  };
  for(const id of ['date','time','body','target','aspect','orb']){
    $(id).addEventListener('change',()=>{$('slider').value='0';render()});
  }
  $('slider').addEventListener('input',render);
  $('date').value=new Date().toISOString().slice(0,10);
})();