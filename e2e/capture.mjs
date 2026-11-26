// Reproducible proof capture (headless Playwright). Usage:
//   node e2e/capture.mjs <mode> <baseUrl> <outDir>
// modes: local | cloud-legacy | cloud-v2 | storybook
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const [mode, base, out] = process.argv.slice(2)
const shots = join(out, 'screenshots')
const logs = join(out, 'logs')
mkdirSync(shots, { recursive: true })
mkdirSync(logs, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'en-US',
  baseURL: base,
})
const page = await context.newPage()
const analytics = []
page.on('console', (m) => m.text().startsWith('[analytics]') && analytics.push(m.text()))
const shot = (name) => page.screenshot({ path: join(shots, name), fullPage: true })

async function login() {
  await page.goto('/')
  await page.getByLabel('Customer ID').waitFor()
  await page.getByLabel('Customer ID').fill('taro')
  await page.getByLabel('Password').fill('demo1234')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByTestId('user-name').waitFor()
}

async function legacyStatements() {
  await page.goto('/statements?account=acc-001&month=2026-10')
  await page
    .frameLocator('iframe[title="Legacy statements"]')
    .locator('[data-total="closing"]')
    .waitFor()
}

if (mode === 'local') {
  await page.goto('/')
  await page.getByLabel('Customer ID').waitFor()
  await shot('01-login.png')
  await login()
  await page.getByTestId('account-acc-001').waitFor()
  await shot('02-accounts-en.png')

  await page.getByRole('button', { name: '日本語' }).click()
  await page.getByText('ご利用口座').waitFor()
  await shot('03-accounts-ja.png')
  await page.getByRole('button', { name: 'EN' }).click()

  await page.goto('/transactions?page=2&size=10&debug=1')
  await page.locator('tbody tr').first().waitFor()
  await shot('04-transactions-page2.png')
  // F6: the dev-only "Report a problem" button throws inside the MFE; Sentry (DSN set) or the analytics adapter records it.
  await page.getByRole('button', { name: 'Report a problem (dev)' }).click()
  await page.waitForTimeout(300)

  await page.goto('/transfer')
  await page.getByLabel('Amount (JPY)').fill('2500')
  await page.getByLabel('Memo').fill('Lunch')
  await page.getByRole('button', { name: 'Review' }).click()
  await page.getByRole('button', { name: 'Confirm and send' }).click()
  await page.getByText('Transfer completed').waitFor()
  await shot('05-transfer-react.png')

  const flag = (enabled) =>
    page.request
      .put('/api/flags/statements.v2', { data: { enabled } })
      .then(
        async (r) =>
          `${new Date().toISOString()} PUT /api/flags/statements.v2 {"enabled":${enabled}} -> ${r.status()} ${await r.text()}\n`,
      )
  const flagLog = join(logs, 'flag-toggle.log')
  writeFileSync(flagLog, await flag(false))
  appendFileSync(
    flagLog,
    `GET /api/flags -> ${await (await page.request.get('/api/flags')).text()}\n`,
  )
  await legacyStatements()
  await shot('06-statements-legacy-jsp.png')

  appendFileSync(flagLog, await flag(true))
  appendFileSync(
    flagLog,
    `GET /api/flags -> ${await (await page.request.get('/api/flags')).text()}\n`,
  )
  await page.goto('/statements?account=acc-001&month=2026-10')
  await page.getByText('Migrated statement (v2)').waitFor()
  await page.locator('[data-total="closing"]').waitFor()
  await shot('07-statements-v2-vue.png')
  appendFileSync(flagLog, await flag(false))
  writeFileSync(join(logs, 'analytics-console.log'), analytics.join('\n') + '\n')
} else if (mode === 'cloud-legacy') {
  await login()
  await page.getByTestId('account-acc-001').waitFor()
  await shot('01-cf-accounts.png')
  await legacyStatements()
  await shot('02-cf-statements-legacy.png')
} else if (mode === 'cloud-v2') {
  await login()
  await page.goto('/statements?account=acc-001&month=2026-10')
  await page.getByText('Migrated statement (v2)').waitFor()
  await page.locator('[data-total="closing"]').waitFor()
  await shot('03-cf-statements-v2.png')
  await page.getByRole('button', { name: '日本語' }).click()
  await page.getByText('月次取引明細書').waitFor()
  await shot('04-cf-ja.png')
  await page.getByTestId('user-name').waitFor()
  writeFileSync(join(logs, 'analytics-console.log'), analytics.join('\n') + '\n')
} else if (mode === 'storybook') {
  await page.goto('/iframe.html?id=standards-pagination-standard--docs&viewMode=docs')
  await page.getByRole('heading', { name: 'Pagination standard' }).waitFor()
  await shot('08-storybook-pagination.png')
  await page.goto('/iframe.html?id=components-bkpagination--default&viewMode=story')
  await page.getByRole('navigation').waitFor()
  await shot('09-storybook-bkpagination-story.png')
} else {
  throw new Error(`unknown mode ${mode}`)
}

await browser.close()
console.log(`captured ${mode} into ${out}`)
