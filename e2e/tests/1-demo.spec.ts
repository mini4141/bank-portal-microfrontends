import { expect, test } from '@playwright/test'
import { flagIsLocal, login, setFlag } from './helpers'

test('demo story: login, accounts, transactions page 2, transfer (React), legacy statement', async ({
  page,
}) => {
  await setFlag(page, false)
  const consoleLines: string[] = []
  page.on('console', (m) => consoleLines.push(m.text()))
  const rumRequests: string[] = []
  page.on('request', (r) => r.url().includes('dataplane.rum') && rumRequests.push(r.url()))

  await test.step('login', async () => {
    await login(page)
    await expect(page).toHaveURL(/\/accounts/)
  })

  let balanceBefore = ''
  await test.step('accounts render with JPY formatting', async () => {
    await expect(page.getByTestId(/^account-/)).toHaveCount(3)
    balanceBefore = (await page.getByTestId('account-acc-001').innerText()) ?? ''
    expect(balanceBefore).toMatch(/¥/)
  })

  await test.step('transactions: page 2 differs, URL updates, reload keeps the page', async () => {
    await page.getByRole('link', { name: 'Transactions' }).click()
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()
    const page1First = (await firstRow.textContent()) ?? ''
    const next = page.waitForResponse(
      (r) => r.url().includes('/api/transactions') && r.url().includes('page=2'),
    )
    await page.getByRole('button', { name: 'Next page' }).click()
    await next
    await expect(page).toHaveURL(/page=2/)
    await expect(firstRow).not.toHaveText(page1First)
    const page2First = (await firstRow.textContent()) ?? ''
    await page.reload()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.locator('tbody tr').first()).toHaveText(page2First)
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible()
  })

  await test.step('transfer in the React MFE updates the accounts balance', async () => {
    await page.getByRole('link', { name: 'Transfer' }).click()
    await page.getByLabel('Amount (JPY)').fill('1000')
    await page.getByRole('button', { name: 'Review' }).click()
    await page.getByRole('button', { name: 'Confirm and send' }).click()
    await expect(page.getByText('Transfer completed')).toBeVisible()
    await page.getByRole('link', { name: 'Accounts' }).click()
    await expect(page.getByTestId('account-acc-001')).not.toHaveText(balanceBefore)
  })

  await test.step('statements: legacy JSP inside the parcel', async () => {
    await page.getByRole('link', { name: 'Statements' }).click()
    const legacy = page.frameLocator('iframe[title="Legacy statements"]')
    await expect(legacy.locator('.badge')).toHaveText('LEGACY JSP')
    await expect(legacy.locator('[data-total="closing"]')).toBeVisible()
  })

  if (flagIsLocal()) {
    // Local: the console analytics adapter logs the event.
    expect(
      consoleLines.some((l) => l.includes('[analytics] event transfer_submitted')),
    ).toBeTruthy()
  } else {
    // Cloud: the CloudWatch RUM client sends batched events to its data plane.
    await expect.poll(() => rumRequests.length, { timeout: 30_000 }).toBeGreaterThan(0)
  }
})
