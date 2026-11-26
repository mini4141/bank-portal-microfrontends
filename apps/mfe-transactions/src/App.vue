<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BkButton, BkMoney, BkPagination, BkTable, writePaginationToUrl } from '@bank/ui'
import { api, formatDate, isDebug, type Account, type Locale } from '@bank/utility'
import { useTransactionsStore } from './store'

const { t, locale } = useI18n()
const store = useTransactionsStore()
const accounts = ref<Account[]>([])
const debug = isDebug()

const columns = computed(() => [
  { key: 'date', label: t('transactions.date') },
  { key: 'description', label: t('transactions.description') },
  { key: 'amount', label: t('transactions.amount'), align: 'right' as const },
])

onMounted(async () => {
  accounts.value = await api<Account[]>('/accounts')
  await store.fetch()
})
watch(
  () => [store.page, store.size],
  () => store.fetch(),
)

function applyFilters() {
  store.page = 1
  writePaginationToUrl({ page: 1, size: store.size })
  store.fetch()
}

function reportProblem() {
  throw new Error('Demo error thrown inside the transactions MFE')
}
</script>

<template>
  <section class="tx">
    <h1>{{ t('transactions.title') }}</h1>

    <form class="tx__filters" @change="applyFilters" @submit.prevent>
      <label>
        {{ t('transactions.account') }}
        <select v-model="store.accountId" data-testid="account-select">
          <option v-for="a in accounts" :key="a.id" :value="a.id">
            {{ locale === 'ja' ? a.nameJa : a.name }}
          </option>
        </select>
      </label>
      <label>
        {{ t('transactions.type') }}
        <select v-model="store.type">
          <option value="">{{ t('transactions.all') }}</option>
          <option value="credit">{{ t('transactions.credit') }}</option>
          <option value="debit">{{ t('transactions.debit') }}</option>
        </select>
      </label>
      <label>{{ t('transactions.from') }} <input v-model="store.from" type="date" /></label>
      <label>{{ t('transactions.to') }} <input v-model="store.to" type="date" /></label>
      <BkButton v-if="debug" variant="ghost" @click="reportProblem">{{
        t('transactions.reportProblem')
      }}</BkButton>
    </form>

    <BkTable
      :columns="columns"
      :rows="store.items"
      :loading="store.loading"
      :empty="t('transactions.empty')"
    >
      <template #cell-date="{ row }">{{ formatDate(String(row.date), locale as Locale) }}</template>
      <template #cell-description="{ row }">{{
        locale === 'ja' ? row.descriptionJa : row.description
      }}</template>
      <template #cell-amount="{ row }">
        <BkMoney
          :amount="Number(row.amount)"
          :tone="row.type === 'credit' ? 'positive' : 'negative'"
        />
      </template>
    </BkTable>

    <BkPagination v-model:page="store.page" v-model:size="store.size" :total="store.total" />
  </section>
</template>

<style scoped lang="scss">
.tx {
  padding: var(--bk-spacing-lg);
  display: grid;
  gap: var(--bk-spacing-md);

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--bk-spacing-md);
    align-items: end;

    label {
      display: grid;
      gap: var(--bk-spacing-xs);
      font-size: 13px;
    }
    select,
    input {
      height: 36px;
    }
  }
}
</style>
