<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DEFAULT_SIZE_OPTIONS,
  readPaginationFromUrl,
  writePaginationToUrl,
} from '../pagination-url'

const props = withDefaults(
  defineProps<{
    total: number
    page: number
    size: number
    sizeOptions?: number[]
    /** Keep `?page=&size=` in the address bar in sync (company-wide standard). */
    syncUrl?: boolean
  }>(),
  { sizeOptions: () => DEFAULT_SIZE_OPTIONS, syncUrl: true },
)
const emit = defineEmits<{ 'update:page': [page: number]; 'update:size': [size: number] }>()
const { t } = useI18n()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.size)))

const window5 = computed(() => {
  const start = Math.max(1, Math.min(props.page - 2, totalPages.value - 4))
  const end = Math.min(totalPages.value, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function goTo(page: number) {
  const next = Math.min(totalPages.value, Math.max(1, page))
  if (next === props.page) return
  if (props.syncUrl) writePaginationToUrl({ page: next, size: props.size })
  emit('update:page', next)
}

function changeSize(event: Event) {
  const size = Number((event.target as HTMLSelectElement).value)
  if (props.syncUrl) writePaginationToUrl({ page: 1, size })
  emit('update:size', size)
  emit('update:page', 1)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') goTo(props.page - 1)
  else if (e.key === 'ArrowRight') goTo(props.page + 1)
  else if (e.key === 'Home') goTo(1)
  else if (e.key === 'End') goTo(totalPages.value)
  else return
  e.preventDefault()
}

function onPopState() {
  const { page, size } = readPaginationFromUrl(window.location.search, props.sizeOptions)
  if (size !== props.size) emit('update:size', size)
  if (page !== props.page) emit('update:page', page)
}

onMounted(() => props.syncUrl && window.addEventListener('popstate', onPopState))
onBeforeUnmount(() => window.removeEventListener('popstate', onPopState))
</script>

<template>
  <nav class="bk-pagination" :aria-label="t('pagination.label')" @keydown="onKey">
    <span class="bk-pagination__total">{{ t('pagination.total', { total }) }}</span>

    <label class="bk-pagination__size">
      {{ t('pagination.rows') }}
      <select :value="size" @change="changeSize">
        <option v-for="o in sizeOptions" :key="o" :value="o">{{ o }}</option>
      </select>
    </label>

    <div class="bk-pagination__pages">
      <button
        type="button"
        :disabled="page <= 1"
        :aria-label="t('pagination.first')"
        @click="goTo(1)"
      >
        «
      </button>
      <button
        type="button"
        :disabled="page <= 1"
        :aria-label="t('pagination.prev')"
        @click="goTo(page - 1)"
      >
        ‹
      </button>
      <button
        v-for="p in window5"
        :key="p"
        type="button"
        :aria-current="p === page ? 'page' : undefined"
        :class="{ active: p === page }"
        @click="goTo(p)"
      >
        {{ p }}
      </button>
      <button
        type="button"
        :disabled="page >= totalPages"
        :aria-label="t('pagination.next')"
        @click="goTo(page + 1)"
      >
        ›
      </button>
      <button
        type="button"
        :disabled="page >= totalPages"
        :aria-label="t('pagination.last')"
        @click="goTo(totalPages)"
      >
        »
      </button>
    </div>

    <span class="bk-pagination__status" aria-live="polite">{{
      t('pagination.pageOf', { page, total: totalPages })
    }}</span>
  </nav>
</template>

<style scoped lang="scss">
.bk-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--bk-spacing-md);
  padding: var(--bk-spacing-sm) 0;
  color: var(--bk-color-textMuted);
  font-size: 14px;

  &__pages {
    display: flex;
    gap: var(--bk-spacing-xs);

    button {
      min-width: 36px;
      height: 36px;
      border: 1px solid var(--bk-color-border);
      border-radius: var(--bk-radius-md);
      background: var(--bk-color-surface);
      color: var(--bk-color-text);
      cursor: pointer;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &.active {
        background: var(--bk-color-primary);
        border-color: var(--bk-color-primary);
        color: #fff;
      }

      &:focus-visible {
        outline: 2px solid var(--bk-color-primary);
        outline-offset: 2px;
      }
    }
  }

  &__size select {
    margin-left: var(--bk-spacing-xs);
    height: 32px;
  }
}
</style>
