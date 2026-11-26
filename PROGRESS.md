# PROGRESS

Resume from here after a restart. Phases run strictly in order (see `CLAUDE.md` §5).

## Phase 0: scaffold

- [x] Repo layout from `SPECS.md` §4
- [x] `README.md`, `PROGRESS.md`, `docs/DECISIONS.md`
      rchitecture.svg/ s/- [ ]/- [x]/
- [x] `.gitignore`, `.gitattributes`, `.env.example`
- [x] CI workflow `.github/workflows/ci.yml`

## Phase 1: local (`SPECS.md` §5, §9)

Features

- [x] F1 Shell, login and navigation
- [x] F2 Accounts MFE (Vue)
- [x] F3 Transactions MFE (Vue) + pagination standard
- [x] F4 Transfer MFE (React)
- [x] F5 Legacy statements (JSP) and migrated statements (Vue)
- [x] F6 Monitoring and analytics
- [x] F7 Shared UI library + Storybook
- [x] F8 Performance (Lighthouse CI)

Proof (`proof/phase1-local/`)

- [ ] `tests/`: Jest JUnit, Playwright report, Lighthouse report, Storybook test-runner log, JUnit (JSP servlet)
- [ ] `screenshots/01-login.png`
- [ ] `screenshots/02-accounts-en.png`
- [ ] `screenshots/03-accounts-ja.png`
- [ ] `screenshots/04-transactions-page2.png`
- [ ] `screenshots/05-transfer-react.png`
- [ ] `screenshots/06-statements-legacy-jsp.png`
- [ ] `screenshots/07-statements-v2-vue.png`
- [ ] `screenshots/08-storybook-pagination.png`
- [ ] `logs/analytics-console.log`
      nalytics/ s/- [ ]/- [x]/
- [ ] `logs/flag-toggle.log`
      nalytics/ s/- [ ]/- [x]/
- [ ] `docs/architecture.svg` (rendered PlantUML)
      rchitecture.svg/ s/- [ ]/- [x]/
- [x] `scripts/test-all.sh` green, CI on `main` green, `proof/README.md` index complete

## Requirement coverage matrix (`SPECS.md` §2)

- [x] Design and implement frontend with Vue.js and TypeScript: 3 Vue MFEs + UI library (screenshots, Jest)
- [x] Legacy JSP modernisation, step-by-step migration (before/after screenshots)
- [x] Align API requirements with backend: `docs/api-contract.md` + OpenAPI, typed client
      rchitecture.svg/ s/- [ ]/- [x]/
- [x] Code reviews / best practices / standards: ESLint/Prettier, PR template, `CONTRIBUTING.md`, pagination standard
- [x] Monitor released features, resolve prod issues: Sentry + RUM + error-boundary demo
- [x] Tech stack: Vue, React, single-spa, JSP, AWS, GH Actions, Terraform, Webpack, Jest, i18n, Storybook, Sentry, RUM/AppConfig
- [x] Secure web frontend: cookie auth, CSP, audit in CI (headers log)
- [x] Frontend performance monitoring/optimisation: code splitting, Lighthouse budget, RUM web vitals
- [ ] CDN / web hosting infra: CloudFront behaviours, cache policies (`resources.txt`)
- [x] RESTful API design: BFF + OpenAPI
- [x] AI/LLM tools in development: `docs/AI_USAGE.md`
      rchitecture.svg/ s/- [ ]/- [x]/

## Phase 2: AWS (`SPECS.md` §10)

- [ ] `aws sts get-caller-identity` OK
- [ ] `scripts/deploy.sh` runs end to end
- [ ] `screenshots/01-cf-accounts.png`, `02-cf-statements-legacy.png`, `03-cf-statements-v2.png`, `04-cf-ja.png`
- [ ] `logs/curl-headers-csp.txt`, `logs/rum-events.json`, `logs/appconfig-deploy.log`, `resources.txt`
      nalytics/ s/- [ ]/- [x]/
- [ ] `tests/playwright-cloud/`

## Phase 3: destroy (`SPECS.md` §11)

- [ ] `scripts/destroy.sh` completed
- [ ] `scripts/verify-destroyed.sh` clean; output in `proof/phase3-destroy/verify-destroyed.txt`

## Phase 4: write-up

- [ ] `docs/PORTFOLIO.md`
      rchitecture.svg/ s/- [ ]/- [x]/
- [ ] `README.md` final, `proof/README.md` index complete, everything pushed

## Definition of done (`CLAUDE.md` §12)

- [ ] Every stack item in §2 is used in running code (coverage matrix ticked)
- [ ] Phase 1 proof complete, tests green locally and in CI
- [ ] Phase 2 proof complete
- [ ] Phase 3 everything destroyed, `verify-destroyed.txt` clean
- [ ] `docs/PORTFOLIO.md` and `README.md` written, committed and pushed
      rchitecture.svg/ s/- [ ]/- [x]/
