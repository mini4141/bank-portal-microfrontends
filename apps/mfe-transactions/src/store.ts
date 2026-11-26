import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readPaginationFromUrl } from '@bank/ui'
import { api, type Page, type Transaction } from '@bank/utility'

export const useTransactionsStore = defineStore('transactions', () => {
  const initial = readPaginationFromUrl()
  const items = ref<Transaction[]>([])
  const total = ref(0)
  const page = ref(initial.page)
  const size = ref(initial.size)
  const accountId = ref(new URLSearchParams(window.location.search).get('account') ?? 'acc-001')
  const type = ref('')
  const from = ref('')
  const to = ref('')
  const loading = ref(true)

  async function fetch() {
    loading.value = true
    const q = new URLSearchParams({
      accountId: accountId.value,
      page: String(page.value),
      size: String(size.value),
    })
    if (type.value) q.set('type', type.value)
    if (from.value) q.set('from', from.value)
    if (to.value) q.set('to', to.value)
    try {
      const res = await api<Page<Transaction>>(`/transactions?${q}`)
      items.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  return { items, total, page, size, accountId, type, from, to, loading, fetch }
})
