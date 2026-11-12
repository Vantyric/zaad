import { defineConfig } from '@playwright/test'

const appPath = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    channel: 'chromium',
    baseURL: 'http://127.0.0.1:4173',
    locale: 'ar-IQ',
    timezoneId: 'Asia/Baghdad',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: `http://127.0.0.1:4173${appPath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
