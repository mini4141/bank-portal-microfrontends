<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{ amount: number; currency?: string; tone?: 'neutral' | 'positive' | 'negative' }>(),
  { currency: 'JPY', tone: 'neutral' },
)
const { locale } = useI18n()

const text = computed(() =>
  new Intl.NumberFormat(locale.value === 'ja' ? 'ja-JP' : 'en-US', {
    style: 'currency',
    currency: props.currency,
  }).format(props.amount),
)
</script>

<template>
  <span class="bk-money" :class="`bk-money--${tone}`">{{ text }}</span>
</template>

<style scoped lang="scss">
.bk-money {
  font-variant-numeric: tabular-nums;
  &--positive {
    color: var(--bk-color-positive);
  }
  &--negative {
    color: var(--bk-color-negative);
  }
}
</style>
