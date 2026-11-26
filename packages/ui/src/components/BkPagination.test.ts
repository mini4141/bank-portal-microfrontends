import { fireEvent, render, screen } from '@testing-library/vue'
import { createI18n } from 'vue-i18n'
import en from '../../../utility/src/messages.en.json'
import BkPagination from './BkPagination.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function setup(props = {}) {
  return render(BkPagination, {
    props: { total: 120, page: 1, size: 10, ...props },
    global: { plugins: [i18n] },
  })
}

describe('BkPagination', () => {
  beforeEach(() => window.history.replaceState(null, '', '/transactions'))

  it('emits the new page and syncs ?page=&size= into the URL', async () => {
    const { emitted } = setup()
    await fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(emitted()['update:page']).toEqual([[2]])
    expect(window.location.search).toBe('?page=2&size=10')
  })

  it('supports keyboard navigation with the arrow keys', async () => {
    const { emitted } = setup({ page: 3 })
    await fireEvent.keyDown(screen.getByRole('navigation'), { key: 'ArrowLeft' })
    expect(emitted()['update:page']).toEqual([[2]])
  })

  it('resets to page 1 when the page size changes', async () => {
    const { emitted } = setup({ page: 4 })
    await fireEvent.update(screen.getByRole('combobox'), '25')
    expect(emitted()['update:size']).toEqual([[25]])
    expect(emitted()['update:page']).toEqual([[1]])
    expect(window.location.search).toBe('?page=1&size=25')
  })
})
