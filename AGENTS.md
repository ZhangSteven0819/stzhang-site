# AGENTS.md

## Scope
Operational guide for contributors and coding agents working in this repository.

DEV-first policy for this repo:
- DEV is the default deploy target for all code/content changes.
- After each implementation change, deploy to `https://sound-of-simone-dev.pages.dev/`.
- Do not deploy to production unless explicitly requested by the user.

## Stack Summary
- Static site: Astro (`astro@5.15.9`)
- Hosting: Cloudflare Pages
- CMS auth proxy: Cloudflare Worker in `decap-proxy/`
- CI/CD: GitHub Actions workflows in `.github/workflows/`

## Command Reference

### Root site commands
```bash
npm ci                 # Install dependencies from lockfile
npm run dev            # Start Astro dev server (default: http://localhost:4321)
npm run build          # Build production output into dist/
npm run preview        # Preview built site locally
```

### Deployment helper scripts
```bash
./scripts/deploy-dev.sh
# Builds and deploys dist/ to Cloudflare Pages project: sound-of-simone-dev

./scripts/verify-deployment.sh
# Verifies site, CMS admin route, worker health, and DNS using default domains

MAIN_DOMAIN=soundofsimone.no PROXY_DOMAIN=decap.soundofsimone.no ./scripts/verify-deployment.sh
# Same verification with explicit domains
```

### OAuth proxy worker commands
```bash
cd decap-proxy
npm ci
npm run dev            # Local worker via wrangler dev (default: http://localhost:8787)
npm run deploy         # Deploy worker to Cloudflare
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret list
```

## Mandatory DEV Deploy Checklist
Apply this sequence after every code/content implementation change:
1. Run `npm run build`.
2. Run `./scripts/deploy-dev.sh`.
3. Verify DEV is reachable at `https://sound-of-simone-dev.pages.dev/`.
4. Report deploy status in the response (success/failure + short reason).

## Workflows

### 1) Local feature workflow
1. Install deps: `npm ci`
2. Run app: `npm run dev`
3. Validate production build: `npm run build`
4. Deploy to DEV: `./scripts/deploy-dev.sh`
5. Confirm DEV URL: `https://sound-of-simone-dev.pages.dev`
6. Changes are not complete until DEV deploy is successful.

### 2) Client feedback (DEV environment) workflow
1. Work on `dev` or `develop`.
2. Implement and test locally.
3. Immediately deploy using `./scripts/deploy-dev.sh` (default behavior for quick review).
4. Share preview URL: `https://sound-of-simone-dev.pages.dev`
5. Push branch changes.
6. GitHub Action `Deploy DEV to Cloudflare Pages` may redeploy automatically to `sound-of-simone-dev`.
7. Iterate until approved, then merge to `main`.

### 3) Production site workflow
1. Production deploy is blocked by default.
2. Production deploy only on explicit user request.
3. If explicitly requested, merge approved changes to `main` and run the production flow.
4. If needed, run manual fallback GitHub workflow: `Deploy to Cloudflare Pages` (`workflow_dispatch`).
5. Validate production endpoints with `./scripts/verify-deployment.sh`.

### 4) OAuth proxy change workflow
1. Modify files under `decap-proxy/`.
2. Commit and push to `main` to trigger `Deploy OAuth Proxy to Cloudflare Workers`.
3. For manual deploys:
   - `cd decap-proxy`
   - `npm run deploy`
4. Ensure worker secrets exist:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
5. Confirm health endpoint: `https://decap.soundofsimone.no/health`

### 5) Post-deploy verification workflow
1. Run `./scripts/verify-deployment.sh`
2. Check:
   - Main site: `/`
   - About page: `/about`
   - Blog page: `/blog/welcome`
   - CMS route: `/admin/`
   - Worker health: `/health`
   - DNS resolution for main and proxy domains

## Failure Handling
- If `npm run build` fails:
  - Stop.
  - Fix errors.
  - Re-run `npm run build` before any deploy attempt.
- If `./scripts/deploy-dev.sh` fails:
  - Report the relevant error excerpt.
  - Propose the next corrective step.
  - Do not report completion.
- If deploy succeeds but DEV URL is not responding:
  - Run `./scripts/verify-deployment.sh`.
  - Report findings and likely root cause.

## Response Contract
After each implementation response, include:
1. Build result (`npm run build`): success/failure.
2. DEV deploy result (`./scripts/deploy-dev.sh`): success/failure.
3. Confirmed URL status for `https://sound-of-simone-dev.pages.dev/`.

Recommended response format:
- `Build: SUCCESS|FAIL` (+ short reason if fail)
- `DEV Deploy: SUCCESS|FAIL` (+ short reason if fail)
- `DEV URL: REACHABLE|UNREACHABLE` (+ short note)

## CI/CD Trigger Map
- `.github/workflows/deploy-dev.yml`
  - Triggers: push to `dev` or `develop`, plus manual dispatch
  - Ignores: `decap-proxy/**`, `docs/**`
- `.github/workflows/deploy-worker.yml`
  - Triggers: push to `main` when `decap-proxy/**` or workflow file changes, plus manual dispatch
- `.github/workflows/deploy.yml`
  - Trigger: manual dispatch only (fallback Pages deploy)

## Guardrails
- Use `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` secret names for worker auth.
- Do not manually create DNS records for the worker hostname; use Cloudflare Worker "Add Custom Domain".
- Keep `ALLOWED_ORIGINS` in `decap-proxy/wrangler.toml` aligned with active site domains.
