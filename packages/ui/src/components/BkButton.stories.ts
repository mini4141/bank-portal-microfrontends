import type { Meta, StoryObj } from '@storybook/vue3'
import BkButton from './BkButton.vue'

const meta: Meta<typeof BkButton> = {
  title: 'Components/BkButton',
  component: BkButton,
  tags: ['autodocs'],
  argTypes: { variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] } },
  render: (args) => ({
    components: { BkButton },
    setup: () => ({ args }),
    template: '<BkButton v-bind="args">Send</BkButton>',
  }),
}
export default meta

export const Primary: StoryObj<typeof BkButton> = { args: { variant: 'primary' } }
export const Secondary: StoryObj<typeof BkButton> = { args: { variant: 'secondary' } }
export const Loading: StoryObj<typeof BkButton> = { args: { loading: true } }
