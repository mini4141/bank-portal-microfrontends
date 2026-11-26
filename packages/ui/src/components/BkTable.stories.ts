import type { Meta, StoryObj } from '@storybook/vue3'
import BkTable from './BkTable.vue'

const meta: Meta<typeof BkTable> = {
  title: 'Components/BkTable',
  component: BkTable,
  tags: ['autodocs'],
  args: {
    caption: 'Recent transactions',
    empty: 'No rows',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount', align: 'right' },
    ],
    rows: [
      { id: 1, date: '2026-11-22', description: 'Supermarket', amount: 8948 },
      { id: 2, date: '2026-11-21', description: 'Gas bill', amount: 5785 },
    ],
  },
}
export default meta

export const Default: StoryObj<typeof BkTable> = {}
export const Empty: StoryObj<typeof BkTable> = { args: { rows: [] } }
