import {test, expect} from '@playwright/test';

test('entry shell is lazy, keyboard reachable and task oriented', async ({page}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Observatório Astrológico/);
  await expect(page.getByRole('button',{name:'Começar'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Investigar'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Aprender'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Especialista'})).toBeVisible();
  await expect(page.locator('#appFrame')).not.toHaveAttribute('src',/.+/);

  const loadedLegacy=await page.evaluate(() =>
    performance.getEntriesByType('resource').some(entry => entry.name.includes('/app.html'))
  );
  expect(loadedLegacy).toBeFalsy();

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);

  const unnamed=await page.locator('button').evaluateAll(nodes =>
    nodes.filter(node => !(node.textContent||'').trim() && !node.getAttribute('aria-label')).length
  );
  expect(unnamed).toBe(0);
});

test('task buttons lazy-load the full app and switch its legacy section', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Começar'}).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#appFrame')).toHaveAttribute('src','./app.html');
  const app=page.frameLocator('#appFrame');
  await expect(app.locator('#dados')).toHaveClass(/active/,{timeout:45_000});

  await page.getByRole('button',{name:'Fechar aplicativo'}).click();
  await expect(page.locator('#workspace')).toBeHidden();
  await page.getByRole('button',{name:'Especialista'}).click();
  await expect(app.locator('#mapa')).toHaveClass(/active/);
});

test('entry shell stays inside portrait and landscape mobile viewports', async ({page}) => {
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    await page.goto('/');
    const geometry=await page.evaluate(() => ({
      scrollWidth:document.documentElement.scrollWidth,
      width:document.documentElement.clientWidth
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width+1);
    await expect(page.getByRole('button',{name:'Começar'})).toBeVisible();
  }
});

test('explicit preparation serves the shell and local app without network', async ({page, context, browserName}) => {
  test.skip(browserName!=='chromium','One offline control-path test is sufficient; navigation/layout runs in all three engines.');
  await page.goto('/');
  await page.getByRole('button',{name:'Preparar arquivos para uso offline'}).click();
  await expect(page.locator('#status')).toContainText('Offline PREPARADO',{timeout:90_000});
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),{timeout:15_000}).toBeTruthy();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button',{name:'Começar'})).toBeVisible();
  await page.getByRole('button',{name:'Começar'}).click();
  await expect(page.locator('#appFrame')).toHaveAttribute('src','./app.html');
  await expect(page.frameLocator('#appFrame').locator('#dados')).toBeVisible({timeout:30_000});
  await context.setOffline(false);
});
