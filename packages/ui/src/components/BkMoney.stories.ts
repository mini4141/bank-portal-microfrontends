import type { Meta, StoryObj } from '@storybook/vue3'
import BkMoney from './BkMoney.vue'

const meta: Meta<typeof BkMoney> = {
  title: 'Components/BkMoney',
  component: BkMoney,
  tags: ['autodocs'],
  args: { amount: 1234567, currency: 'JPY' },
  argTypes: { tone: { control: 'select', options: ['neutral', 'positive', 'negative'] } },
}
export default meta

export const Neutral: StoryObj<typeof BkMoney> = {}
export const Positive: StoryObj<typeof BkMoney> = { args: { tone: 'positive' } }
export const Negative: StoryObj<typeof BkMoney> = { args: { amount: -4980, tone: 'negative' } }
