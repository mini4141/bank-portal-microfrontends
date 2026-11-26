<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { BkMoney } from '@bank/ui'
import { navigate } from '@bank/utility'
import { useAccountsStore } from './store'

const props = defineProps<{ id: string }>()
const { t, locale } = useI18n()
const store = useAccountsStore()
onMounted(() => store.fetch())

const account = computed(() => store.accounts.find((a) => a.id === props.id))
</script>

<template>
  <section class="detail">
    <RouterLink to="/accounts">← {{ t('accounts.back') }}</RouterLink>
    <template v-if="account">
      <h1>{{ locale === 'ja' ? account.nameJa : account.name }}</h1>
      <dl>
        <dt>{{ t('accounts.number') }}</dt>
        <dd>{{ account.number }}</dd>
        <dt>{{ t('accounts.balance') }}</dt>
        <dd><BkMoney :amount="account.balance" /></dd>
        <dt>{{ t('accounts.openingBalance') }}</dt>
        <dd><BkMoney :amount="account.openingBalance" /></dd>
      </dl>
      <a
        :href="`/transactions?account=${account.id}`"
        @click.prevent="navigate(`/transactions?account=${account.id}`)"
      >
        {{ t('accounts.viewTransactions') }}
      </a>
    </template>
    <p v-else>{{ t('common.loading') }}</p>
  </section>
</template>

<style scoped lang="scss">
.detail {
  padding: var(--bk-spacing-lg);
  display: grid;
  gap: var(--bk-spacing-md);
  justify-items: start;

  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--bk-spacing-sm) var(--bk-spacing-lg);
    margin: 0;
    padding: var(--bk-spacing-md);
    background: var(--bk-color-surface);
    border: 1px solid var(--bk-color-border);
    border-radius: var(--bk-radius-md);
  }
  dt {
    color: var(--bk-color-textMuted);
  }
  dd {
    margin: 0;
    font-weight: 600;
  }
}
</style>
