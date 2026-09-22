/* Observatório Astrológico — Traditional Techniques Engine v2
 * Pure calculation helpers. Browser: window.OATraditionalEngine. Node: module.exports.
 * Conventions are explicit so the UI never presents one school as the only possible school.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.OATraditionalEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DAY=86400000;
  const TROPICAL_YEAR=365.242189;
  const SIGN_NAMES=['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
  const SIGN_RULERS=['Marte','Vênus','Mercúrio','Lua','Sol','Mercúrio','Vênus','Marte','Júpiter','Saturno','Saturno','Júpiter'];
  const EXALTATIONS={Sol:0,Lua:1,Mercúrio:5,Vênus:11,Marte:9,Júpiter:3,Saturno:6};
  const CHALDEAN=['Saturno','Júpiter','Marte','Sol','Vênus','Mercúrio','Lua'];
  const FIRDAR_YEARS={Sol:10,Vênus:8,Mercúrio:13,Lua:9,Saturno:11,Júpiter:12,Marte:7,'Nodo Norte':3,'Nodo Sul':2};
  const FIRDAR_DAY=['Sol','Vênus','Mercúrio','Lua','Saturno','Júpiter','Marte','Nodo Norte','Nodo Sul'];
  const FIRDAR_NIGHT=['Lua','Saturno','Júpiter','Marte','Sol','Vênus','Mercúrio','Nodo Norte','Nodo Sul'];
  const ZR_YEARS=[15,8,20,25,19,20,8,15,12,27,30,12];
  const TRIPLICITY_SCHOOLS={
    dorothean:{
      fire:{day:'Sol',night:'Júpiter',participating:'Saturno'},
      earth:{day:'Vênus',night:'Lua',participating:'Marte'},
      air:{day:'Saturno',night:'Mercúrio',participating:'Júpiter'},
      water:{day:'Vênus',night:'Marte',participating:'Lua'}
    },
    ptolemaic:{
      fire:{day:'Sol',night:'Júpiter',participating:'Marte'},
      earth:{day:'Vênus',night:'Lua',participating:'Saturno'},
      air:{day:'Saturno',night:'Mercúrio',participating:'Júpiter'},
      water:{day:'Vênus',night:'Lua',participating:'Marte'}
    }
  };
  const TRIPLICITY=TRIPLICITY_SCHOOLS.dorothean;
  const ELEMENTS=['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
  const FACES=[
    ['Marte','Sol','Vênus'],['Mercúrio','Lua','Saturno'],['Júpiter','Marte','Sol'],['Vênus','Mercúrio','Lua'],
    ['Saturno','Júpiter','Marte'],['Sol','Vênus','Mercúrio'],['Lua','Saturno','Júpiter'],['Marte','Sol','Vênus'],
    ['Mercúrio','Lua','Saturno'],['Júpiter','Marte','Sol'],['Vênus','Mercúrio','Lua'],['Saturno','Júpiter','Marte']
  ];
  // Ptolemaic bounds/terms; [upper degree, ruler].
  const TERMS=[
    [[6,'Júpiter'],[14,'Vênus'],[21,'Mercúrio'],[26,'Marte'],[30,'Saturno']],
    [[8,'Vênus'],[15,'Mercúrio'],[22,'Júpiter'],[26,'Saturno'],[30,'Marte']],
    [[7,'Mercúrio'],[14,'Júpiter'],[21,'Vênus'],[25,'Marte'],[30,'Saturno']],
    [[6,'Marte'],[13,'Júpiter'],[20,'Mercúrio'],[27,'Vênus'],[30,'Saturno']],
    [[6,'Júpiter'],[11,'Vênus'],[18,'Saturno'],[24,'Mercúrio'],[30,'Marte']],
    [[7,'Mercúrio'],[17,'Vênus'],[21,'Júpiter'],[28,'Marte'],[30,'Saturno']],
    [[6,'Saturno'],[11,'Vênus'],[19,'Júpiter'],[24,'Mercúrio'],[30,'Marte']],
    [[6,'Marte'],[14,'Júpiter'],[21,'Vênus'],[27,'Mercúrio'],[30,'Saturno']],
    [[8,'Júpiter'],[14,'Vênus'],[19,'Mercúrio'],[25,'Saturno'],[30,'Marte']],
    [[6,'Vênus'],[12,'Mercúrio'],[19,'Júpiter'],[25,'Marte'],[30,'Saturno']],
    [[6,'Saturno'],[12,'Mercúrio'],[20,'Vênus'],[25,'Júpiter'],[30,'Marte']],
    [[8,'Vênus'],[14,'Júpiter'],[20,'Mercúrio'],[26,'Marte'],[30,'Saturno']]
  ];
  // Egyptian bounds as preserved in Vettius Valens, Anthology I.
  const EGYPTIAN_TERMS=[
    [[6,'Júpiter'],[12,'Vênus'],[20,'Mercúrio'],[25,'Marte'],[30,'Saturno']],
    [[8,'Vênus'],[14,'Mercúrio'],[22,'Júpiter'],[27,'Saturno'],[30,'Marte']],
    [[6,'Mercúrio'],[12,'Júpiter'],[17,'Vênus'],[24,'Marte'],[30,'Saturno']],
    [[7,'Marte'],[13,'Vênus'],[19,'Mercúrio'],[26,'Júpiter'],[30,'Saturno']],
    [[6,'Júpiter'],[11,'Vênus'],[18,'Saturno'],[24,'Mercúrio'],[30,'Marte']],
    [[7,'Mercúrio'],[17,'Vênus'],[21,'Júpiter'],[28,'Marte'],[30,'Saturno']],
    [[6,'Saturno'],[11,'Mercúrio'],[19,'Júpiter'],[26,'Vênus'],[30,'Marte']],
    [[7,'Marte'],[11,'Vênus'],[19,'Mercúrio'],[24,'Júpiter'],[30,'Saturno']],
    [[12,'Júpiter'],[17,'Vênus'],[21,'Mercúrio'],[26,'Saturno'],[30,'Marte']],
    [[7,'Mercúrio'],[14,'Júpiter'],[22,'Vênus'],[26,'Saturno'],[30,'Marte']],
    [[7,'Mercúrio'],[13,'Vênus'],[20,'Júpiter'],[25,'Marte'],[30,'Saturno']],
    [[12,'Vênus'],[16,'Júpiter'],[19,'Mercúrio'],[28,'Marte'],[30,'Saturno']]
  ];
  const TERM_SCHOOLS={ptolemaic:TERMS,egyptian:EGYPTIAN_TERMS};
  const TRADITIONAL_SOURCES={
    dorotheanTriplicity:'https://www.skyscript.co.uk/pdf/pubs/texts/dariot/index_20.html',
    ptolemaicTriplicity:'https://www.skyscript.co.uk/tetrabiblos',
    ptolemaicTerms:'https://www.skyscript.co.uk/tetrabiblos',
    egyptianTerms:'https://www.spucchi.com/wiki/astrology/terms-bounds-essential-dignities/term-tables/'
  };

  const FIXED_STARS=[
    ['Algol',56.13,2.12],['Alcyone',60.00,2.87],['Aldebaran',69.80,0.85],['Rigel',78.63,0.13],
    ['Capella',80.00,0.08],['Bellatrix',80.95,1.64],['Betelgeuse',88.79,0.42],['Sirius',104.08,-1.46],
    ['Canopus',95.99,-0.74],['Castor',110.32,1.58],['Pollux',113.22,1.14],['Procyon',115.84,0.34],
    ['Regulus',149.83,1.35],['Denebola',171.79,2.14],['Vindemiatrix',190.17,2.83],['Spica',203.84,0.97],
    ['Arcturus',204.21,-0.05],['Zuben Elgenubi',225.07,2.75],['Zuben Eschamali',229.22,2.61],
    ['Unukalhai',232.06,2.63],['Acrux',221.97,0.76],['Antares',249.85,0.96],['Rasalhague',262.34,2.07],
    ['Vega',285.32,0.03],['Altair',301.75,0.77],['Deneb Algedi',303.43,2.85],['Fomalhaut',333.99,1.16],
    ['Markab',353.46,2.49],['Scheat',359.37,2.42]
  ];

  const mod=(n,m=360)=>((Number(n)%m)+m)%m;
  // Empty, missing and invalid inputs are distinct from the legitimate longitude 0°.
  function parseLongitude(value,label='Longitude'){
    if(value===null||value===undefined||String(value).trim()==='')throw new Error(label+': informe uma longitude.');
    const n=Number(value);
    if(!Number.isFinite(n)||n<0||n>360)throw new Error(label+': use um número entre 0° e 360°.');
    return n;
  }
  const sep=(a,b)=>{let d=Math.abs(mod(a)-mod(b));return d>180?360-d:d};
  const signed=(a,b)=>{let d=mod(a-b);return d>180?d-360:d};
  const signIndex=lon=>Math.floor(mod(lon)/30);
  const signDegree=lon=>mod(lon)%30;
  const jdFromDate=(s,hour=12)=>{
    if(typeof s==='number') return s;
    const ms=Date.parse(String(s).slice(0,10)+'T'+String(hour).padStart(2,'0')+':00:00Z');
    if(!Number.isFinite(ms)) throw new Error('Data inválida.');
    return ms/DAY+2440587.5;
  };
  const isoFromJD=jd=>new Date((jd-2440587.5)*DAY).toISOString();
  const addYearsJD=(jd,years)=>jd+years*TROPICAL_YEAR;
  const ageYears=(birthJD,refJD)=>(refJD-birthJD)/TROPICAL_YEAR;
  const dateFromJD=jd=>new Date((jd-2440587.5)*DAY);
  const daysInMonthUTC=(year,month)=>new Date(Date.UTC(year,month+1,0)).getUTCDate();
  function civilAnniversaryJD(birthJD,years){
    const d=dateFromJD(birthJD),y=d.getUTCFullYear()+Number(years),m=d.getUTCMonth();
    const day=Math.min(d.getUTCDate(),daysInMonthUTC(y,m));
    return Date.UTC(y,m,day,d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds(),d.getUTCMilliseconds())/DAY+2440587.5;
  }
  function completedCivilYears(birthJD,refJD){
    if(refJD<birthJD) throw new Error('A referência não pode preceder o nascimento.');
    const b=dateFromJD(birthJD),r=dateFromJD(refJD);
    let years=r.getUTCFullYear()-b.getUTCFullYear();
    if(refJD<civilAnniversaryJD(birthJD,years)-1e-10) years--;
    return Math.max(0,years);
  }

  function trueSolarArc(birthJD,refJD,sunLongitude){
    const age=ageYears(birthJD,refJD);
    if(age<0) throw new Error('A referência não pode preceder o nascimento.');
    const progressedJD=birthJD+age; // secondary progression: 1 day = 1 tropical year
    const natal=mod(sunLongitude(birthJD));
    const progressed=mod(sunLongitude(progressedJD));
    return {age,progressedJD,natalSun:natal,progressedSun:progressed,arc:mod(progressed-natal)};
  }

  function annualProfection(birthJD,refJD,startSign=0,startHouse=1){
    const age=ageYears(birthJD,refJD);
    const completed=completedCivilYears(birthJD,refJD);
    const house=((Number(startHouse)-1+completed)%12+12)%12+1;
    const sign=(Number(startSign)+completed)%12;
    return {age,completedYears:completed,house,sign,signName:SIGN_NAMES[sign],lord:SIGN_RULERS[sign],
      startJD:civilAnniversaryJD(birthJD,completed),endJD:civilAnniversaryJD(birthJD,completed+1),
      convention:'A profecção anual muda no aniversário civil; 29 de fevereiro é limitado ao último dia de fevereiro em anos não bissextos.'};
  }
  function monthlyProfection(birthJD,refJD,startSign=0,startHouse=1){
    const annual=annualProfection(birthJD,refJD,startSign,startHouse);
    const span=annual.endJD-annual.startJD;
    const fraction=Math.min(.999999999,Math.max(0,(refJD-annual.startJD)/span));
    const monthIndex=Math.min(11,Math.floor(fraction*12));
    const sign=mod(annual.sign+monthIndex,12),house=((annual.house-1+monthIndex)%12)+1;
    return {annual,monthIndex,house,sign,signName:SIGN_NAMES[sign],lord:SIGN_RULERS[sign],
      startJD:annual.startJD+span*monthIndex/12,endJD:annual.startJD+span*(monthIndex+1)/12,
      convention:'Profeção mensal por doze partes iguais do ano profectado entre aniversários.'};
  }

  function rotateFrom(list,item){
    const i=list.indexOf(item);
    return i<0?list.slice():list.slice(i).concat(list.slice(0,i));
  }

  function firdaria(birthJD,refJD,sect='day'){
    const rawAge=ageYears(birthJD,refJD);
    if(rawAge<0) throw new Error('A referência não pode preceder o nascimento.');
    const cycle=Math.floor(rawAge/75);
    const cycleAge=rawAge-cycle*75;
    const seq=sect==='night'?FIRDAR_NIGHT:FIRDAR_DAY;
    let cursor=0,major=null;
    for(const lord of seq){
      const years=FIRDAR_YEARS[lord];
      if(cycleAge<cursor+years-1e-10){major={lord,years,offset:cursor};break}
      cursor+=years;
    }
    if(!major){major={lord:seq[0],years:FIRDAR_YEARS[seq[0]],offset:0}}
    const globalOffset=cycle*75+major.offset;
    const majorStartJD=addYearsJD(birthJD,globalOffset);
    const majorEndJD=addYearsJD(majorStartJD,major.years);
    const within=rawAge-globalOffset;
    let sub=null;
    if(CHALDEAN.includes(major.lord)){
      const order=rotateFrom(CHALDEAN,major.lord);
      const subYears=major.years/7;
      const index=Math.min(6,Math.max(0,Math.floor((within+1e-10)/subYears)));
      const lord=order[index];
      sub={lord,index,years:subYears,startJD:addYearsJD(majorStartJD,index*subYears),endJD:addYearsJD(majorStartJD,(index+1)*subYears),order};
    }
    return {sect,age:rawAge,cycle,major:{...major,startJD:majorStartJD,endJD:majorEndJD,yearsElapsed:within},sub};
  }

  function hermeticLots(asc,sun,moon,sect='day'){
    const day=sect!=='night';
    const fortune=mod(asc+(day?moon-sun:sun-moon));
    const spirit=mod(asc+(day?sun-moon:moon-sun));
    return {fortune,spirit,fortuneSign:signIndex(fortune),spiritSign:signIndex(spirit)};
  }
  function sevenHermeticLots({asc,sun,moon,mercury,venus,mars,jupiter,saturn,sect='day'}){
    const base=hermeticLots(asc,sun,moon,sect),day=sect!=='night',F=base.fortune,S=base.spirit;
    const oriented=(plus,minus)=>mod(asc+(day?plus-minus:minus-plus));
    return {
      ...base,
      eros:oriented(venus,S),
      necessity:oriented(F,mercury),
      courage:oriented(F,mars),
      victory:oriented(jupiter,S),
      nemesis:oriented(F,saturn),
      convention:'Sete Lotes Herméticos na formulação planetária atribuída a Paulus Alexandrinus; os dois termos após o Ascendente são invertidos por seita.'
    };
  }

  function zrDurationDays(sign,level){
    if(level<1) throw new Error('Nível ZR inválido.');
    return ZR_YEARS[mod(sign,12)]*360/Math.pow(12,level-1);
  }

  function zrMarker(sign,fortuneSign){
    const d=mod(sign-fortuneSign,12);
    return {angular:[0,3,6,9].includes(d),peak:[0,3,6,9].includes(d),relation:d};
  }

  function zrFindL1(startSign,birthJD,refJD,fortuneSign=startSign){
    if(refJD<birthJD) throw new Error('A referência não pode preceder o nascimento.');
    let start=birthJD,sign=mod(startSign,12),guard=0;
    while(guard++<200){
      const end=start+zrDurationDays(sign,1);
      if(refJD<end-1e-9||guard===200) return {level:1,sign,startJD:start,endJD:end,isLoosing:false,...zrMarker(sign,fortuneSign)};
      start=end;sign=mod(sign+1,12);
    }
    throw new Error('ZR excedeu o limite interno.');
  }

  function zrFindChild(parent,refJD,level,fortuneSign){
    let start=parent.startJD;
    let sign=parent.sign;
    let steps=0;
    let lobUsed=false;
    let guard=0;
    while(start<parent.endJD-1e-10&&guard++<120){
      let isLoosing=false;
      if(steps===12&&!lobUsed){
        sign=mod(parent.sign+6,12);
        lobUsed=true;
        isLoosing=true;
      }
      const naturalEnd=start+zrDurationDays(sign,level);
      const end=Math.min(naturalEnd,parent.endJD);
      const item={level,sign,startJD:start,endJD:end,isLoosing,...zrMarker(sign,fortuneSign)};
      if(refJD<end-1e-9||end>=parent.endJD-1e-9) return item;
      start=end;
      sign=mod(sign+1,12);
      steps++;
    }
    throw new Error('Não foi possível localizar o subperíodo ZR.');
  }

  function zodiacalReleasing(startSign,birthJD,refJD,{fortuneSign=startSign,maxLevel=4}={}){
    const path=[];
    let current=zrFindL1(startSign,birthJD,refJD,fortuneSign);
    path.push(current);
    for(let level=2;level<=maxLevel;level++){
      current=zrFindChild(current,refJD,level,fortuneSign);
      path.push(current);
    }
    return {startSign:mod(startSign,12),fortuneSign:mod(fortuneSign,12),path,
      convention:'Valens/Brennan: ano de 360 dias; L2=30 dias por unidade; L3=2,5 dias; L4=5 horas; Loosing of the Bond no retorno subordinado ao signo-pai.'};
  }

  function midpoint(a,b){
    const delta=signed(b,a);
    const first=mod(a+delta/2);
    return {near:first,opposite:mod(first+180),separation:sep(a,b)};
  }
  const harmonic=(lon,n)=>mod(Number(lon)*Number(n));
  const antiscia=lon=>({antiscion:mod(180-Number(lon)),contraAntiscion:mod(360-Number(lon))});

  function triplicityRulers(lon,sect='day',school='dorothean'){
    const table=TRIPLICITY_SCHOOLS[school];
    if(!table)throw new Error('Escola de triplicidade inválida.');
    if(sect!=='day'&&sect!=='night')throw new Error('Seita deve ser day ou night.');
    const element=ELEMENTS[signIndex(lon)],trip=table[element];
    return {school,element,sect,primary:sect==='night'?trip.night:trip.day,
      secondary:sect==='night'?trip.day:trip.night,participating:trip.participating};
  }
  function termRuler(lon,school='ptolemaic'){
    const table=TERM_SCHOOLS[school];
    if(!table)throw new Error('Sistema de termos inválido.');
    const sign=signIndex(lon),degree=signDegree(lon);
    const entry=table[sign].find(([upper])=>degree<upper)||table[sign][table[sign].length-1];
    return {school,sign,degree,upper:entry[0],ruler:entry[1]};
  }
  function essentialDignity(planet,lon,sect='day',{triplicitySchool='dorothean',termSchool='ptolemaic'}={}){
    const sign=signIndex(lon),ruler=SIGN_RULERS[sign];
    const oppositeRuler=SIGN_RULERS[mod(sign+6,12)];
    const exaltSign=EXALTATIONS[planet];
    const fallSign=exaltSign===undefined?undefined:mod(exaltSign+6,12);
    const trip=triplicityRulers(lon,sect,triplicitySchool);
    const term=termRuler(lon,termSchool);
    const face=FACES[sign][Math.min(2,Math.floor(signDegree(lon)/10))];
    const dignity={
      domicile:ruler===planet,exaltation:exaltSign===sign,triplicity:trip.primary===planet,
      participatingTriplicityDignity:trip.participating===planet,
      term:term.ruler===planet,face:face===planet,
      detriment:oppositeRuler===planet,fall:fallSign===sign,ruler,
      triplicityLord:trip.primary,participatingTriplicity:trip.participating,
      termLord:term.ruler,faceLord:face,triplicitySchool,termSchool
    };
    dignity.peregrine=!(dignity.domicile||dignity.exaltation||dignity.triplicity||dignity.term||dignity.face);
    dignity.score=(dignity.domicile?5:0)+(dignity.exaltation?4:0)+(dignity.triplicity?3:0)+
      (dignity.term?2:0)+(dignity.face?1:0)-(dignity.detriment?5:0)-(dignity.fall?4:0);
    return dignity;
  }
  function solarCondition(planetLon,sunLon,{cazimi=17/60,combustion=8.5,underBeams=17}={}){
    for(const [name,value] of [['cazimi',cazimi],['combustion',combustion],['underBeams',underBeams]])
      if(!Number.isFinite(Number(value))||Number(value)<0)throw new Error(name+': orbe inválido.');
    if(cazimi>combustion||combustion>underBeams)
      throw new Error('Orbes solares devem obedecer cazimi ≤ combustão ≤ sob os raios.');
    const distance=sep(planetLon,sunLon);
    const state=distance<=cazimi?'cazimi':distance<=combustion?'combust':distance<=underBeams?'under-beams':'free';
    return {state,distance,cazimi,combustion,underBeams,
      convention:'Limites configuráveis em separação eclíptica absoluta do Sol.'};
  }
  const DEFAULT_BODY_ORBS={Sol:15,Lua:12,Mercúrio:7,Vênus:7,Marte:7.5,Júpiter:9,Saturno:9};
  function aspectState(first,second,angle,{aspectOrb=null,bodyOrbs=DEFAULT_BODY_ORBS,orbPolicy='minimum',probeDays=1/24}={}){
    if(!first||!second||!Number.isFinite(Number(first.lon))||!Number.isFinite(Number(second.lon)))
      throw new Error('Aspecto exige duas longitudes válidas.');
    const target=Number(angle);
    if(!Number.isFinite(target)||target<0||target>180)throw new Error('Ângulo de aspecto inválido.');
    const aBody=Number(bodyOrbs[first.name]),bBody=Number(bodyOrbs[second.name]);
    const bodyMoiety=Number.isFinite(aBody)&&Number.isFinite(bBody)?(aBody+bBody)/2:null;
    const explicit=aspectOrb===null?null:Number(aspectOrb);
    if(explicit!==null&&(!Number.isFinite(explicit)||explicit<0))throw new Error('Orbe do aspecto inválido.');
    let effectiveOrb;
    if(orbPolicy==='aspect')effectiveOrb=explicit;
    else if(orbPolicy==='body-moiety')effectiveOrb=bodyMoiety;
    else if(orbPolicy==='maximum')effectiveOrb=Math.max(explicit??0,bodyMoiety??0);
    else if(orbPolicy==='minimum'){
      const values=[explicit,bodyMoiety].filter(Number.isFinite);
      effectiveOrb=values.length?Math.min(...values):null;
    }else throw new Error('Política de orbe inválida.');
    if(effectiveOrb===null)throw new Error('Informe orbe do aspecto ou orbes dos corpos.');
    const separation=sep(first.lon,second.lon),deviation=Math.abs(separation-target);
    const aSpeed=Number(first.speed),bSpeed=Number(second.speed);
    let phase='unknown',futureDeviation=null;
    if(Number.isFinite(aSpeed)&&Number.isFinite(bSpeed)&&Number.isFinite(Number(probeDays))&&probeDays>0){
      futureDeviation=Math.abs(sep(Number(first.lon)+aSpeed*probeDays,Number(second.lon)+bSpeed*probeDays)-target);
      const tolerance=1e-9;
      phase=futureDeviation<deviation-tolerance?'applying':futureDeviation>deviation+tolerance?'separating':'exact-or-stationary';
    }
    return {angle:target,separation,deviation,aspectOrb:explicit,bodyMoiety,effectiveOrb,orbPolicy,
      inOrb:deviation<=effectiveOrb,phase,futureDeviation,probeDays};
  }
  function contextualDignity(planet,lon,sunLon,sect='day',options={}){
    const essential=essentialDignity(planet,lon,sect,options);
    const solar=planet==='Sol'?{state:'solar-center',distance:0}:solarCondition(lon,sunLon,options.solar||{});
    return {essential,solar,score:essential.score,
      note:'A pontuação 5/4/3/2/1 permanece essencial; condição solar e peregrinação são informadas separadamente para não misturar escolas silenciosamente.'};
  }

  function eclipticToEquatorial(lon,lat=0,obliquity=23.4392911){
    const r=Math.PI/180,L=mod(lon)*r,B=Number(lat)*r,e=Number(obliquity)*r;
    const y=Math.sin(L)*Math.cos(e)-Math.tan(B)*Math.sin(e),x=Math.cos(L);
    const ra=mod(Math.atan2(y,x)/r);
    const dec=Math.asin(Math.sin(B)*Math.cos(e)+Math.cos(B)*Math.sin(e)*Math.sin(L))/r;
    return {ra,dec};
  }
  function eclipticToRA(lon,lat=0,obliquity=23.4392911){return eclipticToEquatorial(lon,lat,obliquity).ra}

  function raToEclipticLongitude(ra,obliquity=23.4392911){
    const r=Math.PI/180,A=mod(ra)*r,e=Number(obliquity)*r;
    return mod(Math.atan2(Math.sin(A)/Math.cos(e),Math.cos(A))/r);
  }

  function progressedAngles({asc,mc,birthJD,refJD,sunLongitude,mode='solar-arc',obliquity=23.4392911}={}){
    if(!Number.isFinite(Number(asc))||!Number.isFinite(Number(mc)))
      throw new Error('Ascendente e MC natais são obrigatórios.');
    if(typeof sunLongitude!=='function')throw new Error('Função de longitude solar é obrigatória.');
    const solar=trueSolarArc(Number(birthJD),Number(refJD),sunLongitude);
    if(mode==='solar-arc'){
      return {
        mode,arc:solar.arc,age:solar.age,
        asc:mod(Number(asc)+solar.arc),mc:mod(Number(mc)+solar.arc),
        convention:'Arco solar verdadeiro eclíptico: soma-se ao ASC e MC natais a diferença entre Sol secundariamente progredido e Sol natal.'
      };
    }
    if(mode==='right-ascension'){
      const natalSunRA=eclipticToRA(solar.natalSun,0,obliquity);
      const progressedSunRA=eclipticToRA(solar.progressedSun,0,obliquity);
      const arc=mod(progressedSunRA-natalSunRA);
      const ascRA=mod(eclipticToRA(Number(asc),0,obliquity)+arc);
      const mcRA=mod(eclipticToRA(Number(mc),0,obliquity)+arc);
      return {
        mode,arc,age:solar.age,asc:raToEclipticLongitude(ascRA,obliquity),
        mc:raToEclipticLongitude(mcRA,obliquity),
        natalSunRA,progressedSunRA,ascRA,mcRA,
        convention:'Arco em ascensão reta: converte-se o deslocamento do Sol secundariamente progredido para AR, soma-se às AR natais dos ângulos e reconverte-se para longitude eclíptica com latitude zero.'
      };
    }
    throw new Error('Modo de progressão dos ângulos inválido.');
  }

  function zodiacalPrimaryDirection(promissorLon,significatorLon,{key=0.98564736,converse=false,obliquity=23.4392911}={}){
    const pRA=eclipticToRA(promissorLon,0,obliquity),sRA=eclipticToRA(significatorLon,0,obliquity);
    const arc=converse?mod(sRA-pRA):mod(pRA-sRA);
    return {method:'Direção primária zodiacal em ascensão reta, latitude eclíptica zero',pRA,sRA,arc,key,years:arc/key,
      warning:'Modalidade zodiacal simples em AR; para o método proporcional clássico use placidianSemiArcDirection.'};
  }

  function semiArcs(declination,geoLat){
    const r=Math.PI/180,v=Math.tan(Number(declination)*r)*Math.tan(Number(geoLat)*r);
    if(Math.abs(v)>1) throw new Error('Corpo circumpolar para esta latitude; semi-arco real não definido pela fórmula simples.');
    const ad=Math.asin(v)/r;
    return {ascensionalDifference:ad,diurnal:90+ad,nocturnal:90-ad};
  }
  function isAboveHorizonRA(ra,declination,mcRA,geoLat){
    const r=Math.PI/180,H=signed(mcRA,ra)*r,phi=Number(geoLat)*r,dec=Number(declination)*r;
    const sinAlt=Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(H);
    return sinAlt>=0;
  }
  function placidianSemiArcDirection(promissor,significator,{mcRA,geoLat,key=0.98564736,zodiacal=false,obliquity=23.4392911}={}){
    if(!Number.isFinite(Number(mcRA))||!Number.isFinite(Number(geoLat))) throw new Error('ARMC e latitude geográfica são obrigatórios.');
    const p=eclipticToEquatorial(promissor.lon,zodiacal?0:(promissor.lat||0),obliquity);
    const s=eclipticToEquatorial(significator.lon,zodiacal?0:(significator.lat||0),obliquity);
    const pa=semiArcs(p.dec,geoLat),sa=semiArcs(s.dec,geoLat),above=isAboveHorizonRA(s.ra,s.dec,mcRA,geoLat);
    const meridian=mod(Number(mcRA)+(above?0:180));
    const pArc=above?pa.diurnal:pa.nocturnal,sArc=above?sa.diurnal:sa.nocturnal;
    let pDist=signed(p.ra,meridian),sDist=signed(s.ra,meridian);
    if(pDist<sDist)pDist+=360;
    const sProp=sDist/(sArc/2),pProp=pDist/(pArc/2);
    const arc=(pProp-sProp)*(pArc/2);
    return {method:'Placidus semi-arco proporcional direto',zodiacal,arc,pRA:p.ra,pDecl:p.dec,sRA:s.ra,sDecl:s.dec,
      promissorSemiArc:pArc,significatorSemiArc:sArc,meridianRA:meridian,significatorAboveHorizon:above,key,years:arc/key,
      warning:zodiacal?'Direção zodiacal: latitudes eclípticas zeradas.':'Direção in-mundo: latitudes eclípticas informadas são preservadas.'};
  }

  function prenatalSyzygy(birthJD,calcBody){
    let jd=Number(birthJD);
    const phase=mod(calcBody(jd,1).lon-calcBody(jd,0).lon),target=phase<180?0:180;
    for(let i=0;i<18;i++){
      const sun=calcBody(jd,0),moon=calcBody(jd,1),error=signed(moon.lon-sun.lon,target);
      if(Math.abs(error)<1e-9)break;
      const rel=(Number(moon.speed)-Number(sun.speed))||12.19075;
      jd-=error/rel;
    }
    if(jd>birthJD+1e-7)jd-=29.530588/2;
    const sun=calcBody(jd,0),moon=calcBody(jd,1);
    return {jd,type:target===0?'Lua Nova':'Lua Cheia',target,phaseError:Math.abs(signed(moon.lon-sun.lon,target)),sunLon:mod(sun.lon),moonLon:mod(moon.lon)};
  }

  function mutualReceptions(positions){
    const list=positions.filter(x=>x&&SIGN_RULERS.includes(x.name));
    const out=[];
    for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
      const a=list[i],b=list[j],aSign=signIndex(a.lon),bSign=signIndex(b.lon);
      const domicile=SIGN_RULERS[aSign]===b.name&&SIGN_RULERS[bSign]===a.name;
      const exaltation=EXALTATIONS[b.name]===aSign&&EXALTATIONS[a.name]===bSign;
      if(domicile||exaltation)out.push({first:a.name,second:b.name,type:domicile&&exaltation?'domicílio e exaltação':domicile?'domicílio':'exaltação'});
    }
    return out;
  }

  function fixedStarConjunctions(lon,year,orb=1){
    const shift=(Number(year)-2000)*50.29/3600;
    return FIXED_STARS.map(([name,j2000,mag])=>({name,magnitude:mag,longitude:mod(j2000+shift),distance:sep(lon,j2000+shift)}))
      .filter(x=>x.distance<=orb).sort((a,b)=>a.distance-b.distance);
  }

  function bisectRoot(a,b,fn,iterations=52){
    let fa=fn(a),fb=fn(b);
    if(!Number.isFinite(fa)||!Number.isFinite(fb)) throw new Error('Função não finita no intervalo.');
    for(let i=0;i<iterations;i++){
      const m=(a+b)/2,fm=fn(m);
      if(Math.abs(fm)<1e-10) return m;
      if(fa===0)return a;if(fb===0)return b;
      if(fa*fm<=0){b=m;fb=fm}else{a=m;fa=fm}
    }
    return (a+b)/2;
  }

  function findPlanetReturn(body,target,startJD,endJD,calcBody,step=.25){
    if(!Number.isFinite(startJD)||!Number.isFinite(endJD)||endJD<=startJD||
       !Number.isFinite(step)||step<1e-4||step>10||
       !Number.isFinite(target)||typeof calcBody!=='function')
      throw new Error('Retorno: início, fim, passo, alvo e motor válidos são obrigatórios.');
    const roots=[];let a=startJD,fa=signed(calcBody(a,body).lon,target);
    for(let b=Math.min(a+step,endJD);b>a+1e-10;b=Math.min(a+step,endJD)){
      const fb=signed(calcBody(b,body).lon,target);
      if((fa===0||fb===0||fa*fb<0)&&Math.abs(fb-fa)<180){
        const root=bisectRoot(a,b,j=>signed(calcBody(j,body).lon,target));
        if(!roots.length||Math.abs(root-roots[roots.length-1])>.02)roots.push(root);
      }
      a=b;fa=fb;
    }
    return roots;
  }

  function planetaryRevolutions({kind,birthJD,startJD,endJD,calcBody,
    precession='none',precessionArcsecPerYear=50.29,step}={}){
    if(kind!=='solar'&&kind!=='lunar')throw new Error('Revolução deve ser solar ou lunar.');
    if(!Number.isFinite(birthJD)||typeof calcBody!=='function')
      throw new Error('Revolução exige nascimento JD e motor astronômico.');
    if(!['none','equinox-approximate'].includes(precession)||
       !Number.isFinite(precessionArcsecPerYear)||precessionArcsecPerYear<0||
       precessionArcsecPerYear>100)
      throw new Error('Convenção de precessão inválida.');
    const body=kind==='solar'?0:1,natal=mod(calcBody(birthJD,body).lon);
    const correction=jd=>precession==='equinox-approximate'?
      (jd-birthJD)/TROPICAL_YEAR*precessionArcsecPerYear/3600:0;
    const adjusted=(jd,b)=>{
      const p=calcBody(jd,b);
      return {...p,lon:mod(p.lon-correction(jd))};
    };
    const roots=findPlanetReturn(body,natal,startJD,endJD,adjusted,
      step===undefined?(kind==='lunar'?.125:.5):step);
    return roots.map(jd=>({
      kind,jd,body,natalLongitude:natal,
      longitude:mod(calcBody(jd,body).lon),
      targetLongitude:mod(natal+correction(jd)),
      precession,correctionDegrees:correction(jd),
      convention:precession==='none'?
        'Retorno de longitude tropical geocêntrica ao valor natal no mesmo referencial.':
        'Retorno à longitude natal acrescida de precessão aproximada dos equinócios, taxa constante '+precessionArcsecPerYear+' segundos de arco/ano; NÃO equivale a correção rigorosa por precessão tridimensional.'
    }));
  }

  function findAspectsToTarget(body,target,startJD,endJD,calcBody,aspectList=[0,60,90,120,180],step=.25){
    const out=[];
    for(const aspect of aspectList){
      const branches=aspect===0||aspect===180?[aspect]:[aspect,-aspect];
      for(const branch of branches){
        let a=startJD,fa=signed(calcBody(a,body).lon,target+branch);
        for(let b=a+step;b<=endJD+1e-9;b+=step){
          const fb=signed(calcBody(b,body).lon,target+branch);
          if((fa===0||fb===0||fa*fb<0)&&Math.abs(fb-fa)<180){
            const root=bisectRoot(b-step,b,j=>signed(calcBody(j,body).lon,target+branch));
            const lon=mod(calcBody(root,body).lon),duplicate=out.some(x=>Math.abs(x.jd-root)<.01&&x.aspect===Math.abs(aspect));
            if(!duplicate)out.push({jd:root,aspect:Math.abs(aspect),branch:branch<0?'dexter':'sinister',longitude:lon,target:mod(target)});
          }
          a=b;fa=fb;
        }
      }
    }
    return out.sort((a,b)=>a.jd-b.jd);
  }

  function findStations(body,startJD,endJD,calcBody,step=.25){
    if(!Number.isFinite(startJD)||!Number.isFinite(endJD)||endJD<startJD||!Number.isFinite(step)||step<=0)
      throw new Error('Intervalo ou passo inválido para busca de estações.');
    const out=[];let a=startJD,fa=calcBody(a,body).speed;
    for(let b=Math.min(a+step,endJD);b>a;b=Math.min(a+step,endJD)){
      const fb=calcBody(b,body).speed;
      if(Number.isFinite(fa)&&Number.isFinite(fb)&&(fa===0||fb===0||fa*fb<0)){
        const root=bisectRoot(a,b,j=>calcBody(j,body).speed);
        const before=calcBody(root-.02,body).speed,after=calcBody(root+.02,body).speed;
        const type=before<0&&after>0?'Direto':before>0&&after<0?'Retrógrado':null;
        // A zero exactly on two adjacent sample windows represents one station.
        // A tangency without reversal is not a direct/retrograde station.
        if(type&&!out.some(x=>x.type===type&&Math.abs(x.jd-root)<1e-5))
          out.push({jd:root,type,longitude:mod(calcBody(root,body).lon)});
      }
      a=b;fa=fb;
    }
    return out;
  }

  function findIngresses(body,startJD,endJD,calcBody,step=.25){
    const out=[];let a=startJD,pa=calcBody(a,body),sa=signIndex(pa.lon);
    for(let b=a+step;b<=endJD+1e-9;b+=step){
      const pb=calcBody(b,body),sb=signIndex(pb.lon);
      if(sb!==sa){
        const candidates=[];
        for(let k=0;k<12;k++){
          const boundary=k*30;
          const f1=signed(pa.lon,boundary),f2=signed(pb.lon,boundary);
          if((f1===0||f2===0||f1*f2<0)&&Math.abs(f2-f1)<180) candidates.push(boundary);
        }
        for(const boundary of candidates){
          const root=bisectRoot(b-step,b,j=>signed(calcBody(j,body).lon,boundary));
          const before=signIndex(calcBody(root-.01,body).lon),after=signIndex(calcBody(root+.01,body).lon);
          out.push({jd:root,boundary,from:before,to:after,direction:calcBody(root,body).speed>=0?'direto':'retrógrado'});
        }
      }
      a=b;pa=pb;sa=sb;
    }
    return out.filter((x,i,a)=>!i||Math.abs(x.jd-a[i-1].jd)>.01||x.boundary!==a[i-1].boundary);
  }

  return {
    DAY,TROPICAL_YEAR,SIGN_NAMES,SIGN_RULERS,ZR_YEARS,CHALDEAN,FIRDAR_DAY,FIRDAR_NIGHT,FIRDAR_YEARS,
    TRIPLICITY,TRIPLICITY_SCHOOLS,TERMS,EGYPTIAN_TERMS,TERM_SCHOOLS,FACES,FIXED_STARS,DEFAULT_BODY_ORBS,TRADITIONAL_SOURCES,
    mod,parseLongitude,sep,signed,signIndex,signDegree,jdFromDate,isoFromJD,ageYears,civilAnniversaryJD,completedCivilYears,trueSolarArc,annualProfection,monthlyProfection,firdaria,hermeticLots,sevenHermeticLots,
    zrDurationDays,zodiacalReleasing,midpoint,harmonic,antiscia,triplicityRulers,termRuler,essentialDignity,solarCondition,aspectState,contextualDignity,eclipticToEquatorial,eclipticToRA,raToEclipticLongitude,progressedAngles,zodiacalPrimaryDirection,semiArcs,isAboveHorizonRA,placidianSemiArcDirection,prenatalSyzygy,
    mutualReceptions,fixedStarConjunctions,findPlanetReturn,planetaryRevolutions,findAspectsToTarget,findStations,findIngresses
  };
});