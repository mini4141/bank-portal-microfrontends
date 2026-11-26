import { createPinia } from 'pinia'
import singleSpaVue from 'single-spa-vue'
import { createApp, h, type App, type Component } from 'vue'
import { createI18n } from 'vue-i18n'
import { getLocale, initSentry, messages, onLocaleChange } from '@bank/utility'
import './styles/tokens.css'

/** Bootstraps a Vue 3 micro-frontend: Pinia, vue-i18n (shared EN/JA catalogs), Sentry, optional extras. */
export function createVueMfe(name: string, Root: Component, extra?: (app: App) => void) {
  return singleSpaVue({
    createApp,
    appOptions: { render: () => h(Root) },
    handleInstance(app) {
      const i18n = createI18n({
        legacy: false,
        locale: getLocale(),
        fallbackLocale: 'en',
        messages,
      })
      onLocaleChange((locale) => {
        i18n.global.locale.value = locale
      })
      app.use(createPinia())
      app.use(i18n)
      initSentry(app, name)
      extra?.(app)
    },
  })
}
