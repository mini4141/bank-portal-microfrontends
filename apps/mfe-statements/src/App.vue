<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BkMoney, BkPagination, BkTable, writePaginationToUrl } from '@bank/ui'
import { api, formatDate, type Account, type Locale } from '@bank/utility'
import { useStatementStore } from './store'

const { t, locale } = useI18n()
const store = useStatementStore()
const accounts = ref<Account[]>([])
const months = ['2026-09', '2026-10', '2026-11']

const columns = computed(() => [
  { key: 'date', label: t('statements.date') },
  { key: 'description', label: t('statements.description') },
  { key: 'debit', label: t('statements.withdrawal'), align: 'right' as const },
  { key: 'credit', label: t('statements.deposit'), align: 'right' as const },
  { key: 'balance', label: t('statements.balance'), align: 'right' as const },
])

onMounted(async () => {
  accounts.value = await api<Account[]>('/accounts')
  await store.fetch()
})
watch(
  () => [store.page, store.size],
  () => store.fetch(),
)

function applySelection() {
  store.page = 1
  writePaginationToUrl({ page: 1, size: store.size })
  store.fetch()
}
</script>

<template>
  <section class="st">
    <h1>
      {{ t('statements.title') }} <small class="st__badge">{{ t('statements.migrated') }}</small>
    </h1>

    <form class="st__filters" @change="applySelection" @submit.prevent>
      <label>
        {{ t('statements.account') }}
        <select v-model="store.accountId">
          <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.id }}</option>
        </select>
      </label>
      <label>
        {{ t('statements.month') }}
        <select v-model="store.month">
          <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
        </select>
      </label>
    </form>

    <dl v-if="store.statement" class="st__totals" data-testid="totals">
      <div>
        <dt>{{ t('statements.opening') }}</dt>
        <dd data-total="opening"><BkMoney :amount="store.statement.totals.opening" /></dd>
      </div>
      <div>
        <dt>{{ t('statements.debit') }}</dt>
        <dd data-total="debit">
          <BkMoney :amount="store.statement.totals.debit" tone="negative" />
        </dd>
      </div>
      <div>
        <dt>{{ t('statements.credit') }}</dt>
        <dd data-total="credit">
          <BkMoney :amount="store.statement.totals.credit" tone="positive" />
        </dd>
      </div>
      <div>
        <dt>{{ t('statements.closing') }}</dt>
        <dd data-total="closing"><BkMoney :amount="store.statement.totals.closing" /></dd>
      </div>
    </dl>

    <BkTable :columns="columns" :rows="store.statement?.items ?? []" :loading="store.loading">
      <template #cell-date="{ row }">{{ formatDate(String(row.date), locale as Locale) }}</template>
      <template #cell-description="{ row }">{{
        locale === 'ja' ? row.descriptionJa : row.description
      }}</template>
      <template #cell-debit="{ row }">
        <BkMoney v-if="row.debit" :amount="Number(row.debit)" tone="negative" />
        <span v-else>–</span>
      </template>
      <template #cell-credit="{ row }">
        <BkMoney v-if="row.credit" :amount="Number(row.credit)" tone="positive" />
        <span v-else>–</span>
      </template>
      <template #cell-balance="{ row }"><BkMoney :amount="Number(row.balance)" /></template>
    </BkTable>

    <BkPagination
      v-model:page="store.page"
      v-model:size="store.size"
      :total="store.statement?.total ?? 0"
    />
  </section>
</template>

<style scoped lang="scss">
.st {
  padding: var(--bk-spacing-lg);
  display: grid;
  gap: var(--bk-spacing-md);

  &__badge {
    font-size: 12px;
    background: var(--bk-color-positive);
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
    vertical-align: middle;
  }
  &__filters {
    display: flex;
    gap: var(--bk-spacing-md);
    label {
      display: grid;
      gap: var(--bk-spacing-xs);
      font-size: 13px;
    }
    select {
      height: 36px;
    }
  }
  &__totals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--bk-spacing-md);
    margin: 0;
    div {
      padding: var(--bk-spacing-md);
      background: var(--bk-color-surface);
      border: 1px solid var(--bk-color-border);
      border-radius: var(--bk-radius-md);
    }
    dt {
      color: var(--bk-color-textMuted);
      font-size: 13px;
    }
    dd {
      margin: 0;
      font-weight: 700;
    }
  }
}
</style>
