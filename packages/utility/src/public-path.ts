// SystemJS executes this module without document.currentScript, so webpack's automatic publicPath would
// resolve lazy chunks (RUM, Sentry) against the site root. Derive it from the module's own URL instead.
declare const __system_context__: { meta: { url: string } } | undefined
declare let __webpack_public_path__: string

if (typeof __system_context__ !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- webpack reads this global at runtime
  __webpack_public_path__ = __system_context__.meta.url.replace(/[^/]*$/, '')
}
