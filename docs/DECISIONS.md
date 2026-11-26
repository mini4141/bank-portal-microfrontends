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
- 2026-11-26: AppConfig profile type is AWS.Freeform (same JSON document as the feature-flag format). Reason: the FeatureFlags type rejects names with a dot, and the spec names the flag `statements.v2`.
- 2026-11-26: Transfers are stored in the signed HttpOnly session cookie, not in BFF memory (supersedes the in-memory note above). Reason: separate Lambda instances showed different balances; the cookie makes every instance consistent without a database.
- 2026-11-26: The RUM Cognito identity pool and guest role are created by Terraform (not by RUM itself) with allow_classic_flow = true. Reason: they are destroyed with the stack, and aws-rum-web uses the classic flow.
- 2026-11-26: CloudFront SPA fallback is a CloudFront Function on the default behaviour only (not custom error responses). Reason: custom error pages are global and would turn real 404s from the API and legacy origins into index.html.
- 2026-11-26: Lambda runtime nodejs22.x (the BFF bundle targets node22). Reason: widely available in the provider and runtime lists; Node 24 is used locally.
- 2026-11-26: Content-Security-Policy connect-src also allows the STS regional endpoint. Reason: CloudWatch RUM exchanges the Cognito token for credentials through STS.
