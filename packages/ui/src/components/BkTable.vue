<script setup lang="ts">
export interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
}

defineProps<{
  columns: Column[]
  rows: Record<string, unknown>[]
  caption?: string
  loading?: boolean
  empty?: string
}>()
</script>

<template>
  <div class="bk-table-wrap" :aria-busy="loading">
    <table class="bk-table">
      <caption v-if="caption">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr>
          <th v-for="c in columns" :key="c.key" scope="col" :class="c.align">{{ c.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="String(row.id ?? i)">
          <td v-for="c in columns" :key="c.key" :class="c.align">
            <slot :name="`cell-${c.key}`" :row="row">{{ row[c.key] }}</slot>
          </td>
        </tr>
        <tr v-if="!rows.length && !loading">
          <td :colspan="columns.length" class="bk-table__empty">{{ empty }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.bk-table-wrap {
  overflow-x: auto;
}
.bk-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bk-color-surface);

  caption {
    text-align: left;
    padding: var(--bk-spacing-sm) 0;
    font-weight: 600;
  }
  th,
  td {
    padding: 10px var(--bk-spacing-md);
    border-bottom: 1px solid var(--bk-color-border);
    text-align: left;
  }
  th {
    background: var(--bk-color-background);
    color: var(--bk-color-textMuted);
    font-size: 13px;
  }
  .right {
    text-align: right;
  }
  &__empty {
    text-align: center;
    color: var(--bk-color-textMuted);
  }
}
</style>
