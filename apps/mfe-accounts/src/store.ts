import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, type Account } from '@bank/utility'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      accounts.value = await api<Account[]>('/accounts')
    } finally {
      loading.value = false
    }
  }

  return { accounts, loading, fetch }
})
