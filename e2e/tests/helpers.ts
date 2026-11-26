import { expect, type Page } from '@playwright/test'

export const digits = (s: string | null) => (s ?? '').replace(/[^\d-]/g, '')

export async function login(page: Page) {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('Customer ID').fill('taro')
  await page.getByLabel('Password').fill('demo1234')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByTestId('user-name')).toContainText('Yamada Taro')
}

/** Local runs flip the flag through the BFF; cloud runs flip it in AppConfig and set FLAG_MODE=external. */
export const flagIsLocal = () => (process.env.FLAG_MODE ?? 'local') === 'local'

export async function setFlag(page: Page, enabled: boolean) {
  if (!flagIsLocal()) return
  const res = await page.request.put('/api/flags/statements.v2', { data: { enabled } })
  expect(res.ok()).toBeTruthy()
}
