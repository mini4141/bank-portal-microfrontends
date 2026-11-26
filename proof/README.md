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

See the section appended after the deploy.

## Phase 3: destroy (`phase3-destroy/`)

See the section appended after the destroy.
