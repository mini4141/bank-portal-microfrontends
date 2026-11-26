export * from './api'
export * from './auth'
export * from './i18n'
export * from './analytics'
export * from './config'
export * from './flags'
export * from './monitoring'

/** In-app navigation without a page reload (single-spa listens to history changes). */
export function navigate(url: string): void {
  window.history.pushState(null, '', url)
}

/** Fired after a transfer so other MFEs (accounts) can refetch balances. */
export const BALANCE_EVENT = 'bank:balance-changed'
