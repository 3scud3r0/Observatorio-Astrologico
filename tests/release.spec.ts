import {test, expect} from '@playwright/test';

test('public homepage retains the original Observatório interface', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('aside h2')).toContainText('Observatório');
  await expect(page.locator('#dados')).toHaveClass(/active/);
  await expect(page.locator('#guideForm')).toBeAttached();
  await expect(page.locator('#mapform')).toBeAttached();
  await expect(page.locator('#appFrame')).toHaveCount(0);
  await expect(page.locator('nav button[data-tab="dados"]')).toBeVisible();
  await expect(page.getByRole('button',{name:'Mapa',exact:true})).toBeVisible();
});

test('legacy navigation keeps the original main sections', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Mapa',exact:true}).click();
  await expect(page.locator('#mapa')).toHaveClass(/active/);
  await page.locator('nav button[data-tab="dados"]').click();
  await expect(page.locator('#dados')).toHaveClass(/active/);
});

test('experimental entry is optional and does not replace the homepage', async ({page}) => {
  await page.goto('/entrada.html');
  await expect(page.getByRole('button',{name:'Começar'})).toBeVisible();
  await expect(page.locator('#appFrame')).not.toHaveAttribute('src',/.+/);
  await page.getByRole('button',{name:'Começar'}).click();
  await expect(page.locator('#appFrame')).toHaveAttribute('src','./app.html');
  await expect(page.frameLocator('#appFrame').locator('#dados')).toHaveClass(/active/,{timeout:45_000});
});

test('restored homepage fits mobile portrait and landscape', async ({page}) => {
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('#dados')).toHaveClass(/active/);
    await expect(page.locator('nav button[data-tab="dados"]')).toBeVisible();
  }
});

test('explicit offline cache keeps the original homepage', async ({page, context, browserName}) => {
  test.skip(browserName!=='chromium','Offline integration runs in Chromium; layout checks use all browsers.');
  test.setTimeout(180_000);
  await page.goto('/');
  await page.locator('#oa-o-toggle').click();
  await page.locator('#oa-o-prepare').click();
  await expect(page.locator('#oa-o-status')).toContainText('PREPARADO',{timeout:150_000});
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),{timeout:15_000}).toBeTruthy();
  await context.setOffline(true);
  try{
    await page.reload();
    await expect(page.locator('#dados')).toHaveClass(/active/);
    await expect(page.locator('#appFrame')).toHaveCount(0);
  }finally{await context.setOffline(false)}
});

test('retrospective rectification uses the real Swiss engine and discloses the objective', async ({page,browserName}) => {
  test.skip(browserName!=='chromium','Verify the astronomy integration in Chromium; the entry shell runs in all three engines.');
  await page.goto('/');
  const app=page;
  for(const root of ['oa-research','oa-vault','oa-biwheel','oa-clock','oa-guide',
    'oa-missions','oa-ref','oa-offline','oa-scan','oa-rect']){
    await expect(app.locator('#'+root)).toBeVisible({timeout:30_000});
  }
  await expect(app.locator('#oa-rect-open')).toBeVisible({timeout:30_000});
  await app.locator('#oa-rect-open').click();
  await expect(app.locator('#oa-rect-panel')).toBeVisible();
  await app.locator('#oa-rect-birth').fill('1990-01-01');
  await app.locator('#oa-rect-offset').fill('-3');
  await app.locator('#oa-rect-lat').fill('-22.9');
  await app.locator('#oa-rect-lon').fill('-43.2');
  await app.locator('#oa-rect-from').fill('08:00');
  await app.locator('#oa-rect-to').fill('09:00');
  await app.locator('#oa-rect-step').fill('15');
  await app.locator('#oa-rect-events').fill(
    '2020-05-10T15:00:00Z|Sol|ASC|0|1|Registro A\n'+
    '2021-06-20T10:30:00Z|Lua|MC|90|1|Registro B'
  );
  await expect(app.locator('#swissEngineState')).toContainText(/Swiss Ephemeris pronto|WASM pronto/, {timeout:40_000});
  await app.locator('#oa-rect-run').click();
  await expect(app.locator('#oa-rect-output')).toContainText('Melhor ajuste na grade:',{timeout:40_000});
  await expect(app.locator('#oa-rect-output')).toContainText('NÃO é intervalo de confiança');
  await expect(app.locator('#oa-rect-export')).toBeEnabled();
});

test('Swiss tropical and named sidereal frames produce distinct reproducible coordinates', async ({page,browserName}) => {
  test.skip(browserName!=='chromium','Verify the Swiss zodiac frame in Chromium.');
  await page.goto('/');
  const app=page;
  await expect(app.locator('#swissEngineState')).toContainText(/Swiss Ephemeris pronto|WASM pronto/,{timeout:40_000});
  const values=await app.locator('body').evaluate(() => {
    const w=window as unknown as {
      calc:(jd:number,body:number)=>{lon:number;engine:string;flags:number;ayanamsha:number|null};
      houseGeometry:(jd:number,lat:number,lon:number,system:string)=>{asc:number;mc:number;ayanamsha:number|null};
    };
    const zodiac=document.getElementById('zodiacMode') as HTMLSelectElement;
    const ayanamsha=document.getElementById('siderealMode') as HTMLSelectElement;
    const jd=2451545;
    zodiac.value='tropical';
    const tropical=w.calc(jd,0),tropicalHouses=w.houseGeometry(jd,0,0,'E');
    zodiac.value='sidereal';ayanamsha.value='lahiri';
    const sidereal=w.calc(jd,0),siderealHouses=w.houseGeometry(jd,0,0,'E');
    zodiac.value='tropical';
    return {tropical,sidereal,tropicalHouses,siderealHouses,
      debug:{
        obsSwiss:(window as unknown as {obsSwiss?:{ready?:boolean;fullSwiss?:boolean;error?:string}}).obsSwiss,
        calcSource:String(w.calc).slice(0,450),
        houseSource:String(w.houseGeometry).slice(0,450),
        lexicalCalcSource:String(eval('calc')).slice(0,300),
        lexicalHouseSource:String(eval('houseGeometry')).slice(0,300),
        hasZodiac:Boolean((window as unknown as {OAZodiacMode?:unknown}).OAZodiacMode)
      }};
  });
  console.log('SWISS_ZODIAC_DIAGNOSTIC '+JSON.stringify(values));
  expect(values.tropical.engine).toBe('Swiss Ephemeris/WASM');
  expect(values.sidereal.engine).toBe('Swiss Ephemeris/WASM');
  expect(values.sidereal.flags & 65536).toBeTruthy();
  const wrapped=(v:number)=>((v%360)+360)%360;
  const planetShift=wrapped(values.tropical.lon-values.sidereal.lon);
  const angleShift=wrapped(values.tropicalHouses.asc-values.siderealHouses.asc);
  expect(planetShift).toBeGreaterThan(15);
  expect(planetShift).toBeLessThan(35);
  expect(Math.abs(planetShift-angleShift)).toBeLessThan(0.1);
  expect(values.siderealHouses.ayanamsha).not.toBeNull();
});
