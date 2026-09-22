import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {timeout: 15_000},
  workers: 1,
  webServer: {
    command: 'python3 -m http.server 4173 --directory _site',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'firefox', use: {...devices['Desktop Firefox']}},
    {name: 'webkit', use: {...devices['Desktop Safari']}}
  ]
});
