# Bank Portal Microfrontends

[![CI](https://github.com/mini4141/bank-portal-microfrontends/actions/workflows/ci.yml/badge.svg)](https://github.com/mini4141/bank-portal-microfrontends/actions/workflows/ci.yml)

A bank's customer portal still runs on JSP. A **single-spa** shell gradually replaces legacy pages with **Vue 3** micro-frontends (plus one **React 19** MFE), and a feature flag decides legacy vs new per route (strangler-fig). The portal shares a company-wide pagination standard, is fully i18n'd (EN/JA), monitored (Sentry + CloudWatch RUM) and served from S3 + CloudFront.

- Proof of everything working: [`proof/README.md`](proof/README.md)
- Portfolio write-up: [`docs/PORTFOLIO.md`](docs/PORTFOLIO.md)
- Migration notes (JSP rules kept / improved / removed): [`docs/migration/statements.md`](docs/migration/statements.md)
- API contract and OpenAPI: [`docs/api-contract.md`](docs/api-contract.md), [`docs/openapi.yaml`](docs/openapi.yaml)

## Architecture

```mermaid
flowchart TB
  cf[CloudFront] -->|"/ , /mfe/*"| s3[(S3: root-config, importmap, MFE bundles)]
  cf -->|"/api/*"| bff[Lambda BFF Fastify]
  cf -->|"/legacy/*"| alb[ALB] --> tomcat[ECS Fargate Tomcat JSP]
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

PlantUML sources live in [`docs/`](docs) (`architecture.puml`, `strangler-flow.puml`) and are rendered to SVG with `scripts/render-docs.sh` and in CI.

## Layout

```
apps/root-config/      single-spa root + layout engine + import map (webpack)
apps/mfe-navbar|accounts|transactions|statements/   Vue 3 MFEs
apps/mfe-transfer-react/   React 19 MFE
packages/ui/           Vue component library, Storybook, design tokens
packages/utility/      @bank/utility (auth, i18n, analytics adapter, flags client)
bff/                   Fastify BFF (local server + Lambda handler)
legacy/                Maven Tomcat 10 JSP app (Dockerfile)
infra/                 Terraform
e2e/                   Playwright (tests + proof capture)
```

## Quickstart (local)

Prerequisites: Node 24, Docker Desktop, Java 21 only if you run Maven outside Docker.

```bash
npm ci
npx playwright install chromium
scripts/dev-up.sh              # BFF :3000, Tomcat :8081, MFE dev servers, shell on http://localhost:9000
```

Log in with `taro` / `demo1234`. Flip the strangler flag locally with
`curl -X PUT -H 'content-type: application/json' -d '{"enabled":true}' localhost:9000/api/flags/statements.v2`
and reload `/statements`.

| Command                                 | What it does                                                              |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `scripts/dev-up.sh` / `dev-down.sh`     | Start / stop everything (`MODE=prod` serves staged production bundles)    |
| `scripts/seed.sh`                       | Reset demo data and flags                                                 |
| `scripts/test-all.sh`                   | Lint, typecheck, Jest, audit, JUnit, Storybook, Playwright, Lighthouse CI |
| `scripts/capture-proof.sh phase1-local` | Screenshots and logs into `proof/`                                        |
| `npm run storybook -w @bank/ui`         | Storybook with the pagination standard page                               |

## Deploy and destroy (AWS, ap-southeast-2)

Deployment runs from a PC with the `bank-portal-microfrontends-deployer` AWS profile; GitHub Actions only builds and tests and never holds credentials.

```bash
scripts/deploy.sh           # terraform apply, upload, CloudFront invalidation, cloud Playwright, AppConfig flag flip
scripts/destroy.sh          # empties buckets, terraform destroy (CloudFront takes ~15 min)
scripts/verify-destroyed.sh # exits non-zero if anything billable remains
```

Everything is tagged `Project=bank-portal-microfrontends`, `Ephemeral=true`. The stack is meant to live for under two hours.
