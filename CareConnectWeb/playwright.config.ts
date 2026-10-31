import { defineConfig, devices } from '@playwright/test'

// End-to-end tests: the production build, served by `vite preview`, driven in a real browser
const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // The PWA service worker would cache pages between tests
    serviceWorkers: 'block',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /responsive\.spec\.ts/ },
    { name: 'phone-chromium', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec\.ts/ },
    // Cross-browser: Firefox (Gecko), Safari (WebKit), and the installed Chrome and Edge
    // (npm run test:e2e:browsers; Chrome/Edge must be installed on the machine)
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /responsive\.spec\.ts/ },
    // Playwright's WebKit build for Windows occasionally stalls inside an axe scan when
    // several instances run at once (about 1 run in 20); one retry, reported as "flaky"
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /responsive\.spec\.ts/, retries: 1 },
    { name: 'phone-webkit', use: { ...devices['iPhone 14'] }, testMatch: /responsive\.spec\.ts/, retries: 1 },
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' }, testIgnore: /responsive\.spec\.ts/ },
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' }, testIgnore: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    // Always build and serve fresh: a leftover preview server would test an old dist/
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
