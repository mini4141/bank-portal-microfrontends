# Proof index

Every artifact below was produced by a script (`scripts/test-all.sh`, `scripts/capture-proof.sh`, `scripts/deploy.sh`, `scripts/verify-destroyed.sh`), not by hand. Secrets, AWS account ids and session cookies are redacted.

## Phase 1: local (`phase1-local/`)

### Screenshots (headless Playwright, `e2e/capture.mjs`)

| File                                                                                      | Proves                                                                       |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [01-login.png](phase1-local/screenshots/01-login.png)                                     | Login page rendered by the navbar MFE                                        |
| [02-accounts-en.png](phase1-local/screenshots/02-accounts-en.png)                         | Three seeded accounts with JPY formatting, English                           |
| [03-accounts-ja.png](phase1-local/screenshots/03-accounts-ja.png)                         | Same page in Japanese (all strings from the shared catalog)                  |
| [04-transactions-page2.png](phase1-local/screenshots/04-transactions-page2.png)           | `BkPagination` on page 2, server-side paging, `?page=2&size=10`              |
| [05-transfer-react.png](phase1-local/screenshots/05-transfer-react.png)                   | Completed transfer in the React 19 MFE                                       |
| [06-statements-legacy-jsp.png](phase1-local/screenshots/06-statements-legacy-jsp.png)     | Flag off: the legacy JSP (era dates, `▲`) inside the iframe parcel           |
| [07-statements-v2-vue.png](phase1-local/screenshots/07-statements-v2-vue.png)             | Flag on: migrated Vue page with the same totals                              |
| [08-storybook-pagination.png](phase1-local/screenshots/08-storybook-pagination.png)       | Storybook "Pagination standard" docs page                                    |
| [09-storybook-bkpagination-story.png](phase1-local/screenshots/09-storybook-bkpagination-story.png) | The `BkPagination` story                                          |

### Tests (`phase1-local/tests/`)

| File                                                                    | Proves                                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [lint.log](phase1-local/tests/lint.log), [typecheck.log](phase1-local/tests/typecheck.log) | ESLint + Prettier + `tsc`/`vue-tsc` clean                    |
| [jest.log](phase1-local/tests/jest.log), [jest/jest-junit.xml](phase1-local/tests/jest/jest-junit.xml) | Jest: pagination component, Pinia store, React transfer form |
| [junit-servlet/](phase1-local/tests/junit-servlet) | JUnit for the JSP statement servlet                                                   |
| [npm-audit.log](phase1-local/tests/npm-audit.log)                       | Dependency audit (no critical findings)                                      |
| [storybook-build.log](phase1-local/tests/storybook-build.log), [storybook-test-runner.log](phase1-local/tests/storybook-test-runner.log) | Storybook build + test-runner smoke |
| [playwright.log](phase1-local/tests/playwright.log), [playwright/](phase1-local/tests/playwright) | Playwright e2e: login, accounts, transactions p2, React transfer, JSP, flag, Vue, JA |
| [lighthouse/](phase1-local/tests/lighthouse)                            | Lighthouse CI report for `/accounts` (budget: performance >= 85)             |

### Logs (`phase1-local/logs/`)

| File                                                          | Proves                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [analytics-console.log](phase1-local/logs/analytics-console.log) | Console analytics adapter: page views, `locale_changed`, `mfe_error`, `transfer_submitted` |
| [flag-toggle.log](phase1-local/logs/flag-toggle.log)          | `statements.v2` flipped through the flags API                                   |
| [curl-headers-csp.txt](phase1-local/logs/curl-headers-csp.txt) | CSP and security headers on the shell                                          |
| [bff.log](phase1-local/logs/bff.log), [tomcat.log](phase1-local/logs/tomcat.log), [frontend.log](phase1-local/logs/frontend.log) | Structured JSON service logs |
| [../../docs/architecture.svg](../docs/architecture.svg)       | PlantUML architecture diagram rendered in CI/locally                            |

## Phase 2: cloud (`phase2-cloud/`)

Deployed with `scripts/deploy.sh` (Terraform, S3 + CloudFront, Lambda BFF, ECS Fargate Tomcat behind an ALB, AppConfig, CloudWatch RUM) and exercised through the CloudFront URL..

| File | Proves |
| --- | --- |
| [screenshots/01-cf-accounts.png](phase2-cloud/screenshots/01-cf-accounts.png) | Accounts rendered from the CDN with data from the Lambda BFF |
| [screenshots/02-cf-statements-legacy.png](phase2-cloud/screenshots/02-cf-statements-legacy.png) | Flag off: JSP from ECS Fargate through the ALB, inside the parcel |
| [screenshots/03-cf-statements-v2.png](phase2-cloud/screenshots/03-cf-statements-v2.png) | After the AppConfig deployment: migrated Vue page, same totals |
| [screenshots/04-cf-ja.png](phase2-cloud/screenshots/04-cf-ja.png) | Japanese UI in the cloud |
| [tests/playwright-cloud/](phase2-cloud/tests/playwright-cloud) | Cloud Playwright: full demo story (flag off), incl. RUM requests sent |
| [tests/playwright-cloud-v2/](phase2-cloud/tests/playwright-cloud-v2) | Cloud Playwright after the flag flip: Vue totals equal JSP totals, JA |
| [logs/appconfig-deploy.log](phase2-cloud/logs/appconfig-deploy.log) | Hosted configuration version + deployment via `aws appconfig`, flag seen by the BFF |
| [logs/rum-events.json](phase2-cloud/logs/rum-events.json) | `aws rum get-app-monitor-data`: page views, web vitals, sessions from the run |
| [logs/curl-headers-csp.txt](phase2-cloud/logs/curl-headers-csp.txt) | CSP, HSTS, X-Frame-Options and cache headers from CloudFront |
| [logs/playwright-cloud-flag-off.log](phase2-cloud/logs/playwright-cloud-flag-off.log), [logs/playwright-cloud-flag-on.log](phase2-cloud/logs/playwright-cloud-flag-on.log) | Cloud test output |
| [resources.txt](phase2-cloud/resources.txt) | Deployed resources and the CloudFront path behaviours |

## Phase 3: destroy (`phase3-destroy/`)

Run with `scripts/destroy.sh`, then `scripts/verify-destroyed.sh`.

| File | Proves |
| --- | --- |
| [verify-destroyed.txt](phase3-destroy/verify-destroyed.txt) | No CloudFront distribution, S3 bucket, Lambda, ECS cluster, ALB, RUM monitor, AppConfig application, Cognito pool, IAM role or tagged resource remains |
