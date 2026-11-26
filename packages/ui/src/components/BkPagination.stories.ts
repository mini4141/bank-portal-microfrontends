import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BkPagination from './BkPagination.vue'

const meta: Meta<typeof BkPagination> = {
  title: 'Components/BkPagination',
  component: BkPagination,
  tags: ['autodocs'],
  args: { total: 120, page: 1, size: 10, sizeOptions: [10, 25, 50], syncUrl: false },
}
export default meta

export const Default: StoryObj<typeof BkPagination> = {
  render: (args) => ({
    components: { BkPagination },
    setup() {
      const page = ref(args.page)
      const size = ref(args.size)
      return { args, page, size }
    },
    template: '<BkPagination v-bind="args" v-model:page="page" v-model:size="size" />',
  }),
}

export const MiddlePage: StoryObj<typeof BkPagination> = { ...Default, args: { page: 6 } }
export const Compact: StoryObj<typeof BkPagination> = { ...Default, args: { total: 8, size: 10 } }
