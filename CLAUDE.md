# CLAUDE.md — bank-portal-microfrontends

These are the engineering rules for Claude Code on this repository. You work **fully autonomously**. Don't stop to ask the user questions. When something is ambiguous, pick the simplest option that keeps every stack item in §2 covered. Record it in `docs/DECISIONS.md` (one line: date, decision, reason) and keep going. Read `SPECS.md` end to end before writing any code. It is the source of truth for features, architecture and proof.

## 1. Project at a glance

| | |
|---|---|
| Project | Bank Portal Microfrontends: migrating a legacy JSP banking portal to Vue 3 micro-frontends step by step |
| Repo | public GitHub repo `bank-portal-microfrontends`. `origin` is already configured and the default branch is `main` |
| Target role | Frontend Engineer, digital banking (Vue.js, TypeScript, legacy modernisation) |
| Pitch | A bank's customer portal still runs on JSP. A single-spa shell gradually replaces legacy pages with Vue 3 micro-frontends, with a feature flag deciding legacy vs new per route. It shares a company-wide pagination standard, is fully i18n'd (EN/JA), monitored, and served from a CDN. |
| Priority | **Breadth of the tech stack beats depth of business logic.** Every technology in §2 must appear in running code and be visible in the proof. Full validation, edge cases and complete domain rules are out of scope. |

## 2. Mandatory tech stack

| Area | Technology |
|---|---|
| Languages | TypeScript, JavaScript, HTML/CSS (SCSS) |
| Frameworks | **Vue 3** (Composition API, Pinia, Vue Router) for most micro-frontends, **React 19** for one micro-frontend, **single-spa** (root config + layout engine + import maps) |
| Legacy | **JSP** on Tomcat 10 (Jakarta EE, Java 21, Maven) representing the legacy statements & profile pages |
| Build / tooling | npm workspaces, **Webpack 5** (single-spa webpack configs), ESLint, Prettier, **Jest** (+ `@vue/vue3-jest`, Testing Library), **Storybook** (Vue 3) for the shared UI library, Playwright e2e, Lighthouse CI |
| i18n | vue-i18n (EN/JA) + shared message catalogs, `Intl` date/currency formatting |
| Monitoring / analytics | **Sentry** (`@sentry/vue`, no-op without DSN); analytics adapter with **Amazon CloudWatch RUM** (the AWS equivalent of Google Analytics/Firebase Analytics) and a console adapter locally |
| Remote config | **AWS AppConfig** feature flags (the AWS equivalent of Firebase Remote Config) delivered through the BFF; local JSON file |
| BFF / API | Node 24 + TypeScript Fastify BFF (mock banking API: accounts, transactions with pagination, transfers, flags) → AWS Lambda (function URL) in the cloud |
| AWS | S3 + **CloudFront** (CDN, import-map hosting, path behaviours), Lambda, ECS Fargate + ALB for the legacy Tomcat, AppConfig, CloudWatch RUM (+ Cognito identity pool created by RUM) |
| IaC / CI | **Terraform** · **GitHub Actions** (lint, Jest, Storybook build, Playwright, Lighthouse CI) |
| Docs | **PlantUML** architecture diagrams (`docs/*.puml` → SVG in CI) and a design-tokens JSON (Figma Tokens format) in `packages/ui/tokens` |

Don't swap an item for an alternative. If a library is unavailable or broken, use the closest equivalent and log the swap in `docs/DECISIONS.md`.

## 3. Environment

- The host is a **Windows 11 PC**. Claude Code's shell is Git Bash, and the container runtime is Docker Desktop (WSL2 backend). Write automation as POSIX `bash` scripts under `scripts/` and use forward-slash paths. Add a `.gitattributes` with `* text=auto eol=lf` so scripts keep LF line endings.
- Prerequisites: Node.js 24 LTS + npm, Java 21 + Maven, Docker Desktop, Terraform, AWS CLI v2, PlantUML via Docker (`plantuml/plantuml` image). If one is missing, install it with `winget` or the official installer and record the version in `docs/DECISIONS.md`.
- The `gh` CLI is logged in to the owner's GitHub account, and AWS CLI v2 is installed.
- Don't use Bitnami charts or images (their free catalogue has been retired). Use official upstream images and charts.

## 4. AWS account rules

- Profile: **`bank-portal-microfrontends-deployer`**. Always pass it explicitly, either as `--profile bank-portal-microfrontends-deployer` or by exporting `AWS_PROFILE=bank-portal-microfrontends-deployer` inside the scripts. Never use the default profile or any other profile.
- Region: **`ap-southeast-2`** for everything except global services such as CloudFront and IAM.
- The profile has `PowerUserAccess` + `IAMFullAccess`. Start Phase 2 with `aws sts get-caller-identity --profile bank-portal-microfrontends-deployer`. If that fails, stop and write the reason at the top of `PROGRESS.md`.
- Use AWS only. Where a requirement names Azure, GCP or another hyperscaler, use the AWS equivalent stated in `SPECS.md`.
- IaC: Terraform (`infra/`). Don't create resources by hand in the console: every cloud resource comes from code in `infra/`. Keep IaC state local and gitignored.
- Tag every resource with `Project=bank-portal-microfrontends`, `Ephemeral=true`, `ManagedBy=<tool>` and `Owner=alvieirvansyah`.
- Deployment runs **from this PC via scripts** (`scripts/deploy.sh`, `scripts/destroy.sh`). GitHub Actions only builds and tests, and never holds AWS credentials.

## 5. Phases and gates

Work strictly in order. A phase is done only when its proof exists (§8) and its items are ticked in `PROGRESS.md`. Commit and push at the end of every phase.

1. **Phase 0, scaffold.** Set up the repo layout from `SPECS.md` §4. Create `README.md`, `PROGRESS.md` (copy every checklist item from `SPECS.md` §2 and §9–§11 into it), `docs/DECISIONS.md`, `.gitignore`, `.gitattributes`, `.env.example` and the CI workflow.
2. **Phase 1, local.** Build every feature in `SPECS.md` §5. Everything runs on this PC with Docker and local tooling, and makes **no AWS calls**: use the local stand-ins listed in `SPECS.md`. Run the full test suite, then capture proof into `proof/phase1-local/`. Phase 1 counts as "ready for next" only when `scripts/test-all.sh` is green, the CI run on `main` is green, and the proof index is complete.
3. **Phase 2, AWS showcase.** Deploy with `scripts/deploy.sh`, run the smoke/e2e tests against the cloud endpoints and capture proof into `proof/phase2-cloud/`. Keep the stack alive only as long as capturing takes, with a target of **under 2 hours**.
4. **Phase 3, destroy.** Right after capturing, run `scripts/destroy.sh` and then `scripts/verify-destroyed.sh`, and save the output to `proof/phase3-destroy/`. This phase is **mandatory even if Phase 2 partly failed**. Never end a session with cloud resources running.
5. **Phase 4, write-up.** Write `docs/PORTFOLIO.md`. It needs the problem, an architecture diagram (Mermaid), a stack → requirement table, the key screenshots (relative links into `proof/`), what was hard, the approximate AWS cost and how to reproduce. This file becomes a technical page on alvieirvansyah.com.

## 6. Engineering rules

- Keep it simple and conventional: idiomatic layout for each language, small modules, no premature abstraction, no dead code.
- Configure through environment variables, with a committed `.env.example`. Real `.env` files are gitignored.
- **Never commit secrets.** That includes credentials, IaC state, `.terraform/`, `cdk.out/`, kubeconfigs, private keys and certificates. Generate local dev keys and certs into a gitignored `.local/` folder.
- Every HTTP service exposes a health endpoint (`/healthz` or the framework idiom) and logs structured JSON to stdout.
- Pin versions: commit lockfiles and pin container images to at least a minor tag.
- Use one command for each job:
  - `scripts/dev-up.sh` starts everything locally and `scripts/dev-down.sh` stops it.
  - `scripts/seed.sh` loads demo data. Start-up may run it automatically so that demos never start empty.
  - `scripts/test-all.sh` runs every test layer.
  - `scripts/capture-proof.sh <phase>` captures the proof for a phase.
- Keep `README.md` current. It covers what the project is, the architecture diagram, a quickstart, deploy/destroy, a link to `proof/README.md` and `docs/PORTFOLIO.md`, and the CI badge.
- Don't put the hiring company's name anywhere in the repo. Describe the target role generically.
- `docs/AI_USAGE.md`: briefly note how AI coding tools were used and how their output was reviewed and tested.

## 7. Testing rules

- Tests are **shallow by design**: one happy-path test per feature or flow is enough. Don't write exhaustive validation or edge-case tests.
- Required layers: Jest (Pagination component, a Pinia store, a React MFE component), Storybook build + test-runner smoke, Playwright e2e (login → accounts → transactions page 2 → transfer (React) → legacy statement (JSP) → toggle flag → migrated statement (Vue)), Lighthouse CI budget on the accounts route, one JUnit test for the JSP servlet.
- `scripts/test-all.sh` runs every local layer and exits non-zero on failure. CI runs every layer that doesn't need the cloud.
- Save test output as files (JUnit XML, an HTML report or a plain log) under the current phase's `proof/.../tests/`.

## 8. Proof rules

Proof is the deliverable. Use this folder layout:

```
proof/
  README.md                 # index: each artifact on one line, with what it proves
  phase1-local/
    screenshots/            # PNG, named NN-what-it-shows.png
    logs/                   # captured service logs and CLI output
    tests/                  # test reports
  phase2-cloud/
    screenshots/  logs/  tests/
    resources.txt           # deployed AWS resources (from IaC outputs / describe calls)
  phase3-destroy/
    verify-destroyed.txt
```

- Capture screenshots with a script (`scripts/capture-proof.sh`, driving Playwright headless), never by hand, so they can be reproduced. The screenshots listed in `SPECS.md` are the minimum.
- There is no AWS console login, so render AWS-side visuals from the CLI. For example, `aws cloudwatch get-metric-widget-image` renders a metrics graph as a PNG. Otherwise save CLI `describe`/`get` output as logs.
- Before saving logs or CLI output, redact 12-digit AWS account IDs (`sed -E 's/[0-9]{12}/<ACCOUNT_ID>/g'`), access keys, tokens, passwords and the deployer's public IP.
- Proof must show the system **working**, with real data flowing through it, and not just "deployed".

## 9. Cost and safety guardrails (AWS)

- Use the smallest viable sizes: Lambda 256 MB, ECS Fargate 0.25 vCPU / 0.5 GB × 1 for Tomcat, one ALB, CloudFront PriceClass_100, RUM app monitor with sampling 100% (short-lived).
- **No NAT gateways.** Also no multi-AZ databases, provisioned IOPS, reserved capacity or Savings Plans, Route 53 domains, or Marketplace subscriptions.
- Databases: `deletion_protection = false`, skip the final snapshot and keep backup retention minimal. S3 buckets are force-destroyable and ECR repos force-deletable. CloudWatch log groups get 1-day retention and are created by IaC, so they get destroyed with it.
- Public app endpoints are fine for the showcase. Keep databases private: their security groups admit only the app tier. Don't open SSH or database ports to `0.0.0.0/0` and don't use SSH at all. Use SSM if you need a shell.
- Don't send real emails or SMS, and don't call paid third-party APIs. Anything external is mocked unless `SPECS.md` says otherwise.
- `scripts/destroy.sh` must be idempotent and safe to re-run. It first deletes anything that would block the IaC destroy: empty the S3 bucket, delete the ECR image; the CloudFront distribution must be disabled before deletion (Terraform handles this; allow ~15 minutes).
- `scripts/verify-destroyed.sh` lists anything still tagged `Project=bank-portal-microfrontends` (`aws resourcegroupstaggingapi get-resources`) and runs the specific checks in `SPECS.md` §11. It exits non-zero if anything billable remains. The tagging API can show resources for a few minutes after deletion, so confirm each hit with a direct describe call before failing.

## 10. Git and CI

- Use Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `infra:`, `chore:`). Commit small and often, and push to `origin main` at least at the end of every phase.
- `.github/workflows/ci.yml` runs build, lint and the cloud-free tests on every push and pull request. Keep it green.
- Never force-push `main`. Never commit build output, dependency folders (`node_modules`, `target`, `bin`, `obj`, `.venv`) or state files.

## 11. Project-specific rules

- **Strangler-fig migration is the story.** Every legacy page has a route in the root config. AppConfig flag `statements.v2` decides whether `/statements` mounts the legacy JSP parcel (iframe parcel to the Tomcat origin) or the new Vue MFE. Document the business rules extracted from the JSP in `docs/migration/statements.md` (kept / improved / removed).
- One shared UI library `packages/ui` (Vue 3) contains `BkPagination` (the company-wide pagination standard: page size options, total count, keyboard nav, i18n labels, URL-synced `?page=&size=`), plus `BkTable`, `BkButton` and `BkMoney`. Every MFE that lists data uses `BkPagination`, and its Storybook page documents the standard.
- MFEs are independently built and deployed artifacts (`mfe-accounts`, `mfe-transactions`, `mfe-transfer-react`, `mfe-statements`), each with its own Webpack config and path in S3. The import map (`importmap.json`) is the only coupling point. Utilities shared by MFEs (auth, i18n, analytics, flags) live in a `@bank/utility` single-spa utility module.
- Secure frontend: no tokens in localStorage (HttpOnly cookie from the BFF), CSP headers set by CloudFront response headers policy, output encoding, dependency audit in CI.
- Sentry and RUM initialise only when their config is present. Locally the analytics adapter logs events to the console so tests stay hermetic.
- Japanese and English must both be complete for every visible string (the bank serves Japanese users and this is a business-level-English role).

## 12. Definition of done

- [ ] Every stack item in §2 is used in running code. Cross-check with the coverage matrix in `SPECS.md` §2 and tick each row in `PROGRESS.md`.
- [ ] Phase 1 proof is complete, and all tests are green locally and in CI.
- [ ] Phase 2 proof is complete: cloud screenshots, a cloud test run and the resource list.
- [ ] Phase 3: everything is destroyed and `verify-destroyed.txt` shows nothing billable left.
- [ ] `docs/PORTFOLIO.md` and `README.md` are written, and everything is committed and pushed.
