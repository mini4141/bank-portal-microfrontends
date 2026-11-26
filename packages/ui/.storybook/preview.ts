import { setup, type Preview } from '@storybook/vue3'
import { createI18n } from 'vue-i18n'
import en from '../../utility/src/messages.en.json'
import ja from '../../utility/src/messages.ja.json'
import '../src/styles/tokens.css'

const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en, ja } })
setup((app) => app.use(i18n))

const preview: Preview = {
  globalTypes: {
    locale: {
      description: 'Locale',
      toolbar: { icon: 'globe', items: ['en', 'ja'], dynamicTitle: true },
    },
  },
  initialGlobals: { locale: 'en' },
  decorators: [
    (story, context) => {
      i18n.global.locale.value = context.globals.locale === 'ja' ? 'ja' : 'en'
      return story()
    },
  ],
}
export default preview
