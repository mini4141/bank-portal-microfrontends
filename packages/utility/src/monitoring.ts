import type { App } from 'vue'
import { track } from './analytics'
import { getConfig } from './config'

type SentryVue = typeof import('@sentry/vue')

/** Initialises Sentry for a Vue MFE. No-op without a DSN; errors are still reported as analytics events. */
export function initSentry(app: App, mfe: string): void {
  const dsn = getConfig().sentryDsn
  let sentry: SentryVue | undefined
  if (dsn) {
    // lazy chunk: the Sentry SDK is only downloaded when a DSN is configured
    import('@sentry/vue').then((s) => {
      sentry = s
      s.init({ app, dsn, initialScope: { tags: { mfe } }, tracesSampleRate: 0.1 })
    })
  }
  const previous = app.config.errorHandler
  app.config.errorHandler = (err, instance, info) => {
    track('mfe_error', { mfe, message: err instanceof Error ? err.message : String(err) })
    sentry?.withScope((scope) => {
      scope.setTag('mfe', mfe)
      sentry?.captureException(err)
    })
    if (previous) previous(err, instance, info)
    else console.error(`[${mfe}]`, err)
  }
}

/** Dev-only affordance: visible in non-production builds or with ?debug=1. */
export const isDebug = () =>
  process.env.NODE_ENV !== 'production' || new URLSearchParams(location.search).has('debug')
