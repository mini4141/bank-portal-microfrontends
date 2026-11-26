import { track } from '@bank/utility'

/** React MFE error reporting goes through the shared analytics adapter (Sentry covers the Vue MFEs). */
export function trackWindowErrors(): void {
  window.addEventListener('error', (e) =>
    track('mfe_error', { mfe: 'transfer', message: e.message }),
  )
}
