import { createPinia, setActivePinia } from 'pinia'
import { api } from '@bank/utility'
import { useTransactionsStore } from './store'

jest.mock('@bank/utility', () => ({ api: jest.fn() }))
jest.mock('@bank/ui', () => ({ readPaginationFromUrl: () => ({ page: 2, size: 10 }) }))

describe('transactions store', () => {
  it('fetches the requested page from the BFF', async () => {
    setActivePinia(createPinia())
    ;(api as jest.Mock).mockResolvedValue({ items: [{ id: 'tx-1' }], total: 70 })
    const store = useTransactionsStore()

    await store.fetch()

    expect(api).toHaveBeenCalledWith('/transactions?accountId=acc-001&page=2&size=10')
    expect(store.items).toEqual([{ id: 'tx-1' }])
    expect(store.total).toBe(70)
  })
})
