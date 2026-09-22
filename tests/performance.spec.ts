import {test, expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';

test('record browser performance with an explicit mobile viewport', async ({page, browserName}) => {
  test.skip(browserName !== 'chromium','Performance APIs differ; record one disclosed Chromium runner profile.');
  await page.setViewportSize({width:390,height:844});
  const navigatedAt=Date.now();
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#dados')).toHaveClass(/active/);
  const shell=await page.evaluate(()=>({
    domContentLoadedMs:performance.getEntriesByType('navigation')[0] instanceof PerformanceNavigationTiming?
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).domContentLoadedEventEnd:null,
    firstContentfulPaintMs:performance.getEntriesByType('paint')
      .find(entry=>entry.name==='first-contentful-paint')?.startTime??null,
    resourceCount:performance.getEntriesByType('resource').length
  }));
  const clickedAt=Date.now();
  const app=page;
  await expect(app.locator('#swissEngineState'))
    .toContainText(/Swiss Ephemeris pronto|WASM pronto/,{timeout:45_000});
  const map=await app.locator('body').evaluate(()=>{
    const w=window as unknown as {makeMap:()=>void;obsSwiss?:{fullSwiss?:boolean}};
    const start=performance.now();
    w.makeMap();
    const renderMs=performance.now()-start;
    const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
    const fcp=performance.getEntriesByType('paint').find(x=>x.name==='first-contentful-paint');
    return {
      makeMapMs:renderMs,
      positionRows:document.querySelectorAll('#positions tr').length,
      domContentLoadedMs:navigation?.domContentLoadedEventEnd??null,
      firstContentfulPaintMs:fcp?.startTime??null,
      fullSwissEphemerides:Boolean(w.obsSwiss?.fullSwiss)
    };
  });
  expect(map.positionRows).toBeGreaterThan(0);
  await expect(app.locator('#wheel svg')).toHaveCount(1);
  const session=await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  const measurements=await session.send('Performance.getMetrics');
  await session.detach();
  const metrics=new Map<string,number>(measurements.metrics.map(x=>[x.name,x.value]));
  const result={
    schema:'oa-browser-benchmark/v1',
    environment:'GitHub Actions Linux headless Chromium; desktop runner, 390x844 viewport, no CPU/network throttling',
    browser:browserName,
    viewport:{width:390,height:844},
    capturedAt:new Date(navigatedAt).toISOString(),
    home:shell,
    firstMapFromClickMs:Date.now()-clickedAt,
    app:map,
    jsHeapUsedBytes:metrics.get('JSHeapUsedSize')??null,
    jsHeapTotalBytes:metrics.get('JSHeapTotalSize')??null,
    note:'The original Observatório is served at the public URL; this single synthetic map on CI hardware is not representative of a physical mid-range phone or an independent astronomy certificate.'
  };
  writeFileSync('_site/browser-benchmark.json',JSON.stringify(result,null,2)+'\n');
  console.log('Browser benchmark (descriptive, synthetic map):',JSON.stringify(result));
});
