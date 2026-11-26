import en from './messages.en.json'
import ja from './messages.ja.json'

export type Locale = 'en' | 'ja'
export const messages = { en, ja }

const KEY = 'bk.locale'
const EVENT = 'bank:locale'

export function getLocale(): Locale {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'ja') return saved
  } catch {
    // storage unavailable: fall through to the browser language
  }
  return navigator.language.startsWith('ja') ? 'ja' : 'en'
}

export function setLocale(locale: Locale): void {
  try {
    localStorage.setItem(KEY, locale)
  } catch {
    // non-fatal: the choice just will not persist
  }
  document.documentElement.lang = locale
  window.dispatchEvent(new CustomEvent(EVENT, { detail: locale }))
}

export function onLocaleChange(cb: (locale: Locale) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<Locale>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}

const tag = (l: Locale) => (l === 'ja' ? 'ja-JP' : 'en-US')

export const formatCurrency = (amount: number, locale: Locale = getLocale(), currency = 'JPY') =>
  new Intl.NumberFormat(tag(locale), { style: 'currency', currency }).format(amount)

export const formatDate = (iso: string, locale: Locale = getLocale()) =>
  new Intl.DateTimeFormat(tag(locale), { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(iso),
  )

/** Minimal `t()` for non-Vue consumers (the React MFE): dotted keys + {placeholders}. */
export function t(
  key: string,
  params: Record<string, string | number> = {},
  locale: Locale = getLocale(),
): string {
  const found = key
    .split('.')
    .reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], messages[locale])
  const text = typeof found === 'string' ? found : key
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''))
}
