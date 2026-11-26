# Contributing

## Workflow

1. Branch from `main`, commit with Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `infra:`, `chore:`).
2. Run `scripts/test-all.sh` (or at least `npm run lint && npm run typecheck && npx jest`).
3. Open a pull request using the template; CI must be green.

## Code review checklist

- Lists of data use `BkPagination` (page sizes 10/25/50, `?page=&size=`, server-side paging).
- Every visible string exists in **both** `messages.en.json` and `messages.ja.json`.
- No tokens in `localStorage`; auth stays in the HttpOnly cookie. Output is encoded (no `v-html` / `dangerouslySetInnerHTML`).
- New HTTP behaviour is reflected in `docs/api-contract.md` and `docs/openapi.yaml`.
- A micro-frontend only talks to others through `@bank/utility` and browser events; the import map stays the only coupling point.
- Keep modules small; no dead code; no new dependency without a reason in the PR.

## Standards

- TypeScript strict mode, ESLint (flat config) and Prettier are enforced in CI.
- One happy-path test per feature is enough; don't write exhaustive edge-case suites.
- Design tokens live in `packages/ui/tokens/tokens.json` (Figma Tokens format); run `npm run tokens -w @bank/ui` after editing.
