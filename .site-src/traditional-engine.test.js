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
  const angleSolar=E.progressedAngles({
    asc:123.4,mc:35.2,birthJD:birth,refJD:refAge(46.75),sunLongitude:sun,mode:'solar-arc'
  });
  close(angleSolar.asc,E.mod(123.4+r.arc),1e-8,'progressed ASC solar arc');
  close(angleSolar.mc,E.mod(35.2+r.arc),1e-8,'progressed MC solar arc');
  assert.match(angleSolar.convention,/Arco solar verdadeiro/);
  const angleRA=E.progressedAngles({
    asc:123.4,mc:35.2,birthJD:birth,refJD:refAge(46.75),sunLongitude:sun,mode:'right-ascension'
  });
  assert.match(angleRA.convention,/ascensão reta/);
  assert.ok(Number.isFinite(angleRA.asc)&&Number.isFinite(angleRA.mc));
  assert.notEqual(angleRA.arc,angleSolar.arc,'RA and ecliptic solar arcs are distinct conventions');
  const zero=E.progressedAngles({asc:123.4,mc:35.2,birthJD:birth,refJD:birth,sunLongitude:sun,mode:'right-ascension'});
  close(zero.asc,123.4,1e-8,'zero-age RA ASC');
  close(zero.mc,35.2,1e-8,'zero-age RA MC');
  assert.throws(()=>E.progressedAngles({asc:1,mc:2,birthJD:birth,refJD:refAge(1),sunLongitude:sun,mode:'invented'}),/Modo/);

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
  const b=E.jdFromDate('2000-01-15');
  let r=E.annualProfection(b,E.jdFromDate('2012-01-14'),0,1);
  assert.equal(r.completedYears,11);assert.equal(r.house,12);assert.equal(r.signName,'Peixes');
  r=E.annualProfection(b,E.jdFromDate('2012-01-15'),0,1);
  assert.equal(r.completedYears,12);assert.equal(r.house,1);assert.equal(r.signName,'Áries');
  const m=E.monthlyProfection(b,E.jdFromDate('2012-02-20'),0,1);
  assert.ok(m.monthIndex>=1);assert.equal(m.house,m.monthIndex+1);
}
{
  const d=E.hermeticLots(100,120,80,'day');
  close(d.fortune,60);close(d.spirit,140);
  const n=E.hermeticLots(100,120,80,'night');
  close(n.fortune,140);close(n.spirit,60);
  const all=E.sevenHermeticLots({asc:100,sun:120,moon:80,mercury:130,venus:150,mars:170,jupiter:190,saturn:210,sect:'day'});
  close(all.eros,110);close(all.necessity,30);close(all.courage,350);close(all.victory,150);close(all.nemesis,310);
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
  const a=E.antiscia(10);close(a.antiscion,170);close(a.contraAntiscion,350);
  const eq=E.eclipticToEquatorial(0,0);close(eq.ra,0,1e-9);close(eq.dec,0,1e-9);
}
{
  const receptions=E.mutualReceptions([{name:'Marte',lon:40},{name:'Vênus',lon:10}]);
  assert.ok(receptions.some(x=>x.type.includes('domicílio')));
}
{
  const sunLeo=E.essentialDignity('Sol',125,'day');
  assert.equal(sunLeo.domicile,true);
  const satLibra=E.essentialDignity('Saturno',195,'day');
  assert.equal(satLibra.exaltation,true);
  const direct=E.zodiacalPrimaryDirection(300,10,{converse:false,key:1});
  const converse=E.zodiacalPrimaryDirection(300,10,{converse:true,key:1});
  assert.notEqual(direct.arc,converse.arc);
  close(E.mod(direct.arc+converse.arc),0,1e-7);
  const semi=E.placidianSemiArcDirection({lon:100,lat:0},{lon:90,lat:0},{mcRA:0,geoLat:0,key:1,zodiacal:true});
  const expectedArc=E.mod(E.eclipticToRA(100)-E.eclipticToRA(90));
  close(semi.arc,expectedArc,1e-7,'semi-arc equatorial regression');
}
{
  const calc=(jd,body)=>({lon:E.mod((jd-birth)*10),speed:10});
  const roots=E.findPlanetReturn(0,50,birth,birth+20,calc,.25);
  assert.ok(roots.some(x=>Math.abs(x-(birth+5))<1e-6));
  const aspects=E.findAspectsToTarget(0,0,birth,birth+20,calc,[90],.25);
  assert.ok(aspects.some(x=>Math.abs(x.jd-(birth+9))<1e-6&&x.aspect===90));
  const ing=E.findIngresses(0,birth,birth+10,calc,.25);
  assert.ok(ing.some(x=>Math.abs(x.jd-(birth+3))<1e-6&&x.boundary===30));
}
{
  const calc=(jd,body)=>({lon:0,speed:(jd-(birth+2))});
  const stations=E.findStations(0,birth,birth+4,calc,.25);
  assert.ok(stations.some(x=>Math.abs(x.jd-(birth+2))<1e-7));
}
{
  assert.throws(()=>E.parseLongitude(''),/informe uma longitude/);
  assert.throws(()=>E.parseLongitude('  '),/informe uma longitude/);
  assert.throws(()=>E.parseLongitude('foo'),/entre 0° e 360°/);
  assert.throws(()=>E.parseLongitude('361'),/entre 0° e 360°/);
  assert.equal(E.parseLongitude('0'),0);
  assert.equal(E.parseLongitude('360'),360);
}
{
  const calc=jd=>({lon:E.mod(jd-birth),speed:jd-(birth+2)});
  const stations=E.findStations(0,birth,birth+4,calc,.25);
  assert.equal(stations.length,1,'a sampled zero is one station');
  assert.equal(stations[0].type,'Direto');
  close(stations[0].jd,birth+2,1e-7);
  const reverse=jd=>({lon:0,speed:birth+2-jd});
  const retro=E.findStations(0,birth,birth+4,reverse,.25);
  assert.equal(retro.length,1);assert.equal(retro[0].type,'Retrógrado');
  const tangent=jd=>({lon:0,speed:Math.pow(jd-(birth+2),2)});
  assert.equal(E.findStations(0,birth,birth+4,tangent,.25).length,0);
  assert.throws(()=>E.findStations(0,birth,birth+4,calc,0),/passo inválido/);
}
console.log('Traditional engine tests: OK');
