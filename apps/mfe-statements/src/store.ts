import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readPaginationFromUrl } from '@bank/ui'
import { api, type Statement } from '@bank/utility'

export const useStatementStore = defineStore('statement', () => {
  const q = new URLSearchParams(window.location.search)
  const initial = readPaginationFromUrl()
  const accountId = ref(q.get('account') ?? 'acc-001')
  const month = ref(q.get('month') ?? '2026-10')
  const page = ref(initial.page)
  const size = ref(initial.size)
  const statement = ref<Statement | null>(null)
  const loading = ref(true)

  async function fetch() {
    loading.value = true
    try {
      const yyyymm = month.value.replace('-', '')
      statement.value = await api<Statement>(
        `/statements/${accountId.value}/${yyyymm}?page=${page.value}&size=${size.value}`,
      )
    } finally {
      loading.value = false
    }
  }

  return { accountId, month, page, size, statement, loading, fetch }
})
