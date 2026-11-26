import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { api } from '@bank/utility'
import TransferApp from './TransferApp'

jest.mock('@bank/utility', () => ({
  api: jest.fn(),
  ApiError: class extends Error {},
  BALANCE_EVENT: 'bank:balance-changed',
  getLocale: () => 'en',
  onLocaleChange: () => () => undefined,
  formatCurrency: (n: number) => `¥${n}`,
  track: jest.fn(),
  t: (key: string) => key,
}))

const data: Record<string, unknown> = {
  '/accounts': [{ id: 'acc-001', name: 'Ordinary', nameJa: '普通', balance: 500000 }],
  '/payees': [{ id: 'pay-001', name: 'Sato', nameJa: '佐藤' }],
}

describe('TransferApp', () => {
  it('submits a transfer after the confirm step', async () => {
    ;(api as jest.Mock).mockImplementation(
      async (path: string) => data[path] ?? { status: 'completed' },
    )
    render(<TransferApp />)
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Ordinary/ })).toBeInTheDocument(),
    )

    await userEvent.type(screen.getByLabelText('transfer.amount'), '1000')
    await userEvent.click(screen.getByRole('button', { name: 'transfer.review' }))
    await userEvent.click(screen.getByRole('button', { name: 'transfer.confirm' }))

    expect(api).toHaveBeenCalledWith('/transfers', {
      method: 'POST',
      body: { fromAccountId: 'acc-001', payeeId: 'pay-001', amount: 1000, memo: '' },
    })
    expect(await screen.findByText('transfer.success')).toBeInTheDocument()
  })
})
