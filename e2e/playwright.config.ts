import { defineConfig } from '@playwright/test'

const out = process.env.PW_OUT ?? 'test-results'

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60_000,
  reporter: [
    ['list'],
    ['junit', { outputFile: `${out}/playwright-junit.xml` }],
    ['html', { outputFolder: `${out}/html`, open: 'never' }],
  ],
  outputDir: `${out}/artifacts`,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:9000',
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
})
