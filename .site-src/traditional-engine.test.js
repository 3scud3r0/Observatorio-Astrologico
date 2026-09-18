'use strict';
const assert=require('assert');
const E=require('./traditional-engine.js');
const close=(a,b,tol=1e-8,msg='')=>assert.ok(Math.abs(a-b)<=tol,(msg+' expected '+b+', got '+a));

const birth=2451545;
const refAge=y=>birth+y*E.TROPICAL_YEAR;

{
  const rate=.98564736;
  const sun=jd=>E.mod(100+(jd-birth)*rate);
  const r=E.trueSolarArc(birth,refAge(46.75),sun);
  close(r.age,46.75,1e-9,'fractional age');
  close(r.progressedJD,birth+46.75,1e-9,'progressed day');
  close(r.arc,E.mod(46.75*rate),1e-8,'true solar arc');
}
{
  let r=E.firdaria(birth,refAge(0),'day');
  assert.equal(r.major.lord,'Sol'); assert.equal(r.sub.lord,'Sol');
  r=E.firdaria(birth,refAge(10),'day');
  assert.equal(r.major.lord,'Vênus'); assert.equal(r.sub.lord,'Vênus');
  r=E.firdaria(birth,refAge(12),'day');
  assert.equal(r.major.lord,'Vênus'); assert.equal(r.sub.lord,'Mercúrio');
  r=E.firdaria(birth,refAge(18),'day');
  assert.equal(r.major.lord,'Mercúrio'); assert.equal(r.sub.lord,'Mercúrio');
  r=E.firdaria(birth,refAge(0),'night');
  assert.equal(r.major.lord,'Lua'); assert.equal(r.sub.lord,'Lua');
}
{
  let r=E.annualProfection(birth,refAge(0),0,1);
  assert.equal(r.house,1);assert.equal(r.signName,'Áries');assert.equal(r.lord,'Marte');
  r=E.annualProfection(birth,refAge(12),0,1);
  assert.equal(r.house,1);assert.equal(r.signName,'Áries');
  r=E.annualProfection(birth,refAge(13),0,1);
  assert.equal(r.house,2);assert.equal(r.signName,'Touro');
}
{
  const d=E.hermeticLots(100,120,80,'day');
  close(d.fortune,60);close(d.spirit,140);
  const n=E.hermeticLots(100,120,80,'night');
  close(n.fortune,140);close(n.spirit,60);
}
{
  const taurus=1;
  let r=E.zodiacalReleasing(taurus,birth,birth+1,{fortuneSign:taurus,maxLevel:4});
  assert.equal(r.path[0].sign,taurus);
  assert.equal(r.path[1].sign,taurus);
  r=E.zodiacalReleasing(taurus,birth,birth+8*360+.01,{fortuneSign:taurus,maxLevel:2});
  assert.equal(r.path[0].sign,2);
}
{
  const gemini=2;
  const fullL2=E.ZR_YEARS.reduce((a,b)=>a+b,0)*30;
  const r=E.zodiacalReleasing(gemini,birth,birth+fullL2+.01,{fortuneSign:gemini,maxLevel:2});
  assert.equal(r.path[0].sign,gemini);
  assert.equal(r.path[1].sign,8);
  assert.equal(r.path[1].isLoosing,true);
}
{
  const m=E.midpoint(350,10);close(m.near,0);close(m.opposite,180);
  close(E.harmonic(100,4),40);
}
{
  const sunLeo=E.essentialDignity('Sol',125,'day');
  assert.equal(sunLeo.domicile,true);
  const satLibra=E.essentialDignity('Saturno',195,'day');
  assert.equal(satLibra.exaltation,true);
}
{
  const calc=(jd,body)=>({lon:E.mod((jd-birth)*10),speed:10});
  const roots=E.findPlanetReturn(0,50,birth,birth+20,calc,.25);
  assert.ok(roots.some(x=>Math.abs(x-(birth+5))<1e-6));
  const ing=E.findIngresses(0,birth,birth+10,calc,.25);
  assert.ok(ing.some(x=>Math.abs(x.jd-(birth+3))<1e-6&&x.boundary===30));
}
{
  const calc=(jd,body)=>({lon:0,speed:(jd-(birth+2))});
  const stations=E.findStations(0,birth,birth+4,calc,.25);
  assert.ok(stations.some(x=>Math.abs(x.jd-(birth+2))<1e-7));
}
console.log('Traditional engine tests: OK');
