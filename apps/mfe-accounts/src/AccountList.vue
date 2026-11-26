<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { BkMoney } from '@bank/ui'
import { useAccountsStore } from './store'

const { t, locale } = useI18n()
const store = useAccountsStore()
onMounted(() => store.fetch())
</script>

<template>
  <section class="accounts">
    <h1>{{ t('accounts.title') }}</h1>
    <p v-if="store.loading && !store.accounts.length">{{ t('common.loading') }}</p>
    <div class="accounts__grid">
      <RouterLink
        v-for="a in store.accounts"
        :key="a.id"
        :to="`/accounts/${a.id}`"
        class="card"
        :data-testid="`account-${a.id}`"
      >
        <span class="card__type">{{ t(`accounts.type.${a.type}`) }}</span>
        <strong>{{ locale === 'ja' ? a.nameJa : a.name }}</strong>
        <span class="card__number">{{ t('accounts.number') }} •••• {{ a.number.slice(-3) }}</span>
        <span class="card__balance"><BkMoney :amount="a.balance" /></span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
.accounts {
  padding: var(--bk-spacing-lg);
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--bk-spacing-md);
  }
}
.card {
  display: grid;
  gap: var(--bk-spacing-xs);
  padding: var(--bk-spacing-md);
  background: var(--bk-color-surface);
  border: 1px solid var(--bk-color-border);
  border-radius: var(--bk-radius-md);
  color: inherit;
  text-decoration: none;

  &:hover {
    border-color: var(--bk-color-primary);
  }
  &__type {
    color: var(--bk-color-primary);
    font-size: 13px;
    font-weight: 600;
  }
  &__number {
    color: var(--bk-color-textMuted);
  }
  &__balance {
    font-size: 24px;
    font-weight: 700;
  }
}
</style>
