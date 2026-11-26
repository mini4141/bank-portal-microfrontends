# Decisions

One line each: date, decision, reason.

- 2026-11-26: Installed nothing new; used Node 24.12, Java 21, Docker 29.7, Terraform 1.17, AWS CLI 2.42 as found. Maven is not installed, so Maven runs inside the `maven:3.9-eclipse-temurin-21` image (also used by `legacy/Dockerfile`). Reason: avoids a host install and keeps builds reproducible.
- 2026-11-26: Vue and React are bundled into each MFE instead of being externalised through the import map. Only `@bank/utility` is a shared System module. Reason: SystemJS cannot load the ESM builds of Vue; the import map stays the single coupling point and the MFEs stay independently deployable.
- 2026-11-26: The login form lives in `@bank/navbar` (shown on `/login`). Reason: SPECS lists no login MFE and the navbar is always mounted.
- 2026-11-26: Local production-like runs use `scripts/stage.sh` (CDN layout in `.stage/`) served by `scripts/serve-stage.mjs`, which proxies `/api` and `/legacy` and sets the same security headers as the CloudFront response-headers policy. Reason: one layout for local e2e, Lighthouse and the S3 upload.
- 2026-11-26: Storybook 8.6 with `@storybook/vue3-vite` and test-runner 0.22. Reason: the Vue 3 Storybook builder is Vite based; the MFEs still use Webpack 5. Test-runner 0.26 needs Storybook 10.
- 2026-11-26: `@bank/ui` exports `createVueMfe` (single-spa-vue + Pinia + vue-i18n + Sentry wiring) so the four Vue MFEs share one bootstrap. Reason: no copy-pasted setup.
- 2026-11-26: The React MFE reports errors through the shared analytics adapter; Sentry (`@sentry/vue`) covers the Vue MFEs. Reason: spec names `@sentry/vue`.
- 2026-11-26: Session cookie is HMAC-signed (stateless) so it survives Lambda cold starts. Transfers live in Lambda memory and reset on cold start. Reason: demo scale, no database.
- 2026-11-26: Statement totals use integer yen; the legacy `Math.round` rule is therefore a no-op and documented as removed in `docs/migration/statements.md`.
- 2026-11-26: Jest uses ts-jest + `@vue/vue3-jest` with the `node` export conditions and transforms `pinia` (ESM only). Reason: Pinia 4 ships ESM only.
