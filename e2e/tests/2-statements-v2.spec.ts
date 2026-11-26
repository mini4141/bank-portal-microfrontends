import { expect, test } from '@playwright/test'
import { digits, login, setFlag } from './helpers'

const keys = ['opening', 'debit', 'credit', 'closing'] as const

test('flag statements.v2 swaps the JSP parcel for the Vue page with matching totals; JA is complete', async ({
  page,
}) => {
  await setFlag(page, true)
  await login(page)

  // Reference totals straight from the legacy JSP (same session cookie).
  const html = await (
    await page.request.get('/legacy/statements?account=acc-001&month=2026-10')
  ).text()
  const legacyTotals = Object.fromEntries(
    keys.map((k) => [k, digits(new RegExp(`data-total="${k}">([^<]*)<`).exec(html)?.[1] ?? '')]),
  )

  await page.goto('/statements?account=acc-001&month=2026-10')
  await expect(page.getByText('Migrated statement (v2)')).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)
  for (const k of keys) {
    await expect(page.locator(`[data-total="${k}"]`)).toBeVisible()
    expect(digits(await page.locator(`[data-total="${k}"]`).innerText())).toBe(legacyTotals[k])
  }

  await page.getByRole('button', { name: '日本語' }).click()
  await expect(page.getByTestId('user-name')).toContainText('山田 太郎 様')
  await expect(page.getByRole('heading', { name: /月次取引明細書/ })).toBeVisible()

  await setFlag(page, false)
})
