# AI usage

This repository was built with an AI coding agent (Claude Code) working from `SPECS.md` and `CLAUDE.md`.

**What the agent did:** scaffolded the workspaces, wrote the BFF, JSP app, Vue/React micro-frontends, shared UI library, Terraform and scripts, and captured the proof.

**How the output was reviewed and tested**

- Every feature has a test or proof artifact: Jest (pagination component, Pinia store, React form), JUnit for the servlet, Playwright for the full demo story, Storybook build + test-runner, Lighthouse CI.
- ESLint, Prettier and `tsc`/`vue-tsc` run in CI and in `scripts/test-all.sh`; nothing is merged red.
- The migration claim (JSP and Vue show the same totals) is asserted by a test that reads the JSP HTML, not by eye.
- Cloud work is reproducible from `infra/` and the deploy script, and was verified by running tests against the live CloudFront URL, then destroyed and checked with `scripts/verify-destroyed.sh`.
- Decisions the agent made on its own are logged one line each in `docs/DECISIONS.md` so a human reviewer can challenge them.
