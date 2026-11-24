# SPECS.md: Bank Portal Microfrontends

## 1. Summary

A modernisation of a bank's customer website. The legacy portal is JSP pages on Tomcat. A **single-spa** shell now owns routing and hosts new **Vue 3 + TypeScript** micro-frontends (and one React MFE, to show framework independence). Legacy pages are wrapped as parcels until their Vue replacement is ready.

An **AppConfig feature flag** switches each route from legacy to new, so the migration happens step by step without disrupting banking operations. A shared pagination standard keeps the back-office and customer screens consistent. The app is bilingual (EN/JA), monitored with Sentry + CloudWatch RUM, and delivered from S3 + CloudFront.

**Demo story:**
1. Log in and browse accounts in Vue.
2. Page through transactions with the standard paginator.
3. Make a transfer in the React MFE.
4. Open statements: first the legacy JSP page.
5. Flip `statements.v2`, and the same URL is now the migrated Vue page with the same data.
6. Switch to Japanese.

## 2. Requirement coverage matrix

| Requirement | Covered by | Proof |
|---|---|---|
| Design and implement frontend with Vue.js and TypeScript | 3 Vue MFEs + the UI library | Screenshots, Jest |
| Legacy JSP modernisation, step-by-step migration | JSP app + strangler routing + flag + migration doc | Before/after screenshots |
| Align API requirements with backend | `docs/api-contract.md` + OpenAPI for the BFF, typed client | Doc |
| Code reviews / best practices / engineering standards | ESLint/Prettier, PR template, `CONTRIBUTING.md`, shared pagination standard | Repo |
| Monitor released features, resolve prod issues | Sentry + RUM + error-boundary demo | Logs/screenshots |
| Tech stack: Vue, React, single-spa, JSP, AWS, GH Actions, Terraform, Webpack, Jest, i18n, Storybook, Sentry, GA/Firebase (→ RUM/AppConfig) | All used | CI + proof |
| Secure web frontend | Cookie auth, CSP, audit in CI | Headers log |
| Frontend performance monitoring/optimisation (desired) | Code splitting, Lighthouse CI budget, RUM web vitals | Lighthouse report |
| CDN / web hosting infra (desired) | CloudFront behaviours, cache policies | resources.txt |
| RESTful API design (desired) | BFF | OpenAPI |
| AI/LLM tools in development | `docs/AI_USAGE.md` | Doc |

## 3. Architecture

```mermaid
flowchart TB
  cf[CloudFront] -->|/ , /mfe/*| s3[(S3: root-config, importmap, MFE bundles)]
  cf -->|/api/*| bff[Lambda BFF Fastify]
  cf -->|/legacy/*| alb[ALB] --> tomcat[ECS Fargate Tomcat JSP]
  subgraph browser[Browser]
    root[single-spa root config] --> nav[@bank/navbar Vue]
    root --> acc[@bank/accounts Vue]
    root --> tx[@bank/transactions Vue]
    root --> tr[@bank/transfer React]
    root --> st{statements.v2?}
    st -- off --> legacy[legacy JSP parcel]
    st -- on --> stv[@bank/statements Vue]
    util[@bank/utility: auth, i18n, analytics, flags]
  end
  bff --> appconfig[AppConfig flags]
  browser --> rum[CloudWatch RUM] & sentry[Sentry]
```

## 4. Repository layout

```
apps/root-config/        single-spa root + layout + importmap (webpack)
apps/mfe-navbar/  apps/mfe-accounts/  apps/mfe-transactions/  apps/mfe-statements/   (Vue 3)
apps/mfe-transfer-react/ (React)
packages/ui/             Vue component library + Storybook + tokens
packages/utility/        @bank/utility (auth, i18n, analytics adapter, flags client)
bff/                     Fastify BFF (local server + Lambda handler)
legacy/                  Maven Tomcat JSP app (Dockerfile)
infra/                   Terraform
e2e/                     Playwright
docs/                    *.puml, migration/, api-contract.md, DECISIONS.md, PORTFOLIO.md
```

## 5. Features (end-to-end)

### F1: Shell, login and navigation
- The root config registers the apps by route, and the navbar MFE is always mounted. Login uses a mock BFF `/api/session` that sets an HttpOnly cookie. There's a language switcher (EN/JA, persisted) and logout.
- **Accept:** after login the navbar shows the customer's name in the chosen language.

### F2: Accounts MFE (Vue)
- Account cards (type, masked number, balance via `BkMoney`) and an account detail panel.
- **Accept:** 3 seeded accounts render with JPY formatting in JA and EN.

### F3: Transactions MFE (Vue) + pagination standard
- `BkTable` + `BkPagination` (URL-synced, page sizes 10/25/50) plus a date-range and type filter. The BFF paginates server-side (`?page&size&from&to&type`).
- **Accept:** page 2 shows different rows, the URL updates, and a reload keeps the page.

### F4: Transfer MFE (React)
- A React form (from-account, payee, amount, memo) → confirm → result. It's mounted by single-spa-react and shares auth and i18n through `@bank/utility`.
- **Accept:** a transfer succeeds, and the balance shown in the Accounts MFE updates via a custom event or a refetch.

### F5: Legacy statements (JSP) and migrated statements (Vue)
- The legacy JSP renders the monthly statement with server-side pagination and quirky rules (rounding, Japanese era dates). The migrated Vue version reproduces the kept rules, improves the date display and uses `BkPagination`. `statements.v2` comes from AppConfig through `GET /api/flags`.
- **Accept:** with the flag off, `/statements` shows the JSP inside the parcel; with it on, it shows the Vue page with matching totals.

### F6: Monitoring and analytics
- A "Report a problem" dev-only button throws inside the Transactions MFE, and Sentry captures it with an MFE tag when a DSN is set. RUM records page views and web vitals per route. The analytics adapter sends `transfer_submitted`.
- **Accept:** locally, the console adapter logs the events. In the cloud, `aws rum get-app-monitor-data` returns events.

### F7: Shared UI library + Storybook
- Stories for each component (with controls), an a11y addon and a "Pagination standard" docs page.
- **Accept:** `storybook build` succeeds and the test-runner smoke passes.

### F8: Performance
- MFEs are lazy-loaded with split chunks, and Lighthouse CI runs on `/accounts` with a budget (performance ≥ 85 on desktop preset).
- **Accept:** the Lighthouse report is saved.

## 6. Data model (BFF mock)

The seeded customer `Yamada Taro` has 3 accounts and about 120 transactions over 3 months, and has payees. Data is held in memory and loaded from a JSON fixture.

## 7. Interfaces (BFF)

- `POST /api/session`
- `DELETE /api/session`
- `GET /api/me`
- `GET /api/accounts`
- `GET /api/accounts/:id`
- `GET /api/transactions?accountId&page&size&from&to&type`
- `POST /api/transfers`
- `GET /api/statements/:accountId/:yyyymm?page&size`
- `GET /api/flags`
- `PUT /api/flags/:name` (local only)
- `GET /healthz`

The JSP app serves `/legacy/statements?account=&month=&page=`.

## 8. Test plan

| Layer | Test |
|---|---|
| Jest | `BkPagination` emits page change + URL sync; transactions Pinia store fetch; React transfer form submit |
| Storybook | Build + test-runner smoke |
| JUnit | Statement servlet renders totals |
| Playwright | The full demo story in EN, plus one JA assertion |
| Lighthouse CI | Budget on `/accounts` |

## 9. Phase 1: Local

`scripts/dev-up.sh` starts the BFF (:3000), Tomcat (Docker, :8081), each MFE's webpack dev server and the root config (:9000) with a local import map.

- [ ] `tests/`: Jest JUnit, Playwright report, Lighthouse report, Storybook test-runner log
- [ ] `screenshots/01-login.png`, `02-accounts-en.png`, `03-accounts-ja.png`, `04-transactions-page2.png`, `05-transfer-react.png`, `06-statements-legacy-jsp.png`, `07-statements-v2-vue.png`, `08-storybook-pagination.png`
- [ ] `logs/analytics-console.log`, `logs/flag-toggle.log`, `docs/architecture.svg` (rendered PlantUML)

## 10. Phase 2: AWS

| Local | AWS |
|---|---|
| webpack dev servers | Production bundles in S3 under `/mfe/<name>/<version>/`, plus `importmap.json` |
| root config :9000 | CloudFront default behaviour → S3 (OAC) |
| BFF :3000 | Lambda + function URL, CloudFront behaviour `/api/*` |
| Tomcat Docker | ECS Fargate + ALB, CloudFront behaviour `/legacy/*` |
| flags JSON | AppConfig feature-flag profile (BFF reads it via the AppConfig data API) |
| console analytics | CloudWatch RUM app monitor (snippet injected into root index.html) |

`scripts/deploy.sh`:
1. `terraform apply`.
2. Build all MFEs with versioned paths.
3. Upload to S3, plus the import map.
4. Invalidate CloudFront.
5. Playwright against the CloudFront domain.
6. Toggle the flag through `aws appconfig` (create a hosted configuration version + start a deployment) and re-run the statements test.

- [ ] `screenshots/01-cf-accounts.png`, `02-cf-statements-legacy.png`, `03-cf-statements-v2.png`, `04-cf-ja.png`
- [ ] `logs/curl-headers-csp.txt`, `logs/rum-events.json`, `logs/appconfig-deploy.log`, `resources.txt`
- [ ] `tests/playwright-cloud/`

## 11. Phase 3: Destroy

`terraform destroy` (CloudFront disable + delete can take ~15 minutes, so wait).

`verify-destroyed.sh` checks for no CloudFront distribution with the project tag, no S3 bucket, no Lambda, no ECS cluster/ALB, no RUM app monitor and no AppConfig application.

## 12. Out of scope

Real core-banking integration, mobile apps, real identity provider, Kibana, and a Figma file (tokens JSON only).
