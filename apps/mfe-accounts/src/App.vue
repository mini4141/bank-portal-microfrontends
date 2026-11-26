<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { BALANCE_EVENT } from '@bank/utility'
import { useAccountsStore } from './store'

const store = useAccountsStore()
const refetch = () => store.fetch()
onMounted(() => window.addEventListener(BALANCE_EVENT, refetch))
onBeforeUnmount(() => window.removeEventListener(BALANCE_EVENT, refetch))
</script>

<template>
  <RouterView />
</template>
