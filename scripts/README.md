# Scripts Directory

Utility scripts for template setup, deployment, and verification.

## Client factory scripts

### `bootstrap-client.mjs`
Creates a new client setup from required flags and writes:
- `config/client.config.json`
- `src/data/site-settings.json`
- `src/data/page-modules/home.json`
- `docs/client/onboarding-checklist.md`
- generated `public/admin/config.yml` and `public/_headers`

Usage:
```bash
npm run client:bootstrap -- --client-id my-client --brand-name "My Client" --repo-owner your-org --repo-name my-client-site --prod-domain myclient.no --dev-domain my-client-dev.pages.dev --cms-proxy-domain decap.myclient.no --language-mode single --default-locale no --theme-preset wellness
```

### `render-client-config.mjs`
Renders generated files from `config/client.config.json`.

Usage:
```bash
npm run client:render
npm run client:validate
```

### `onboard-client.mjs`
Interactive meeting-mode onboarding wizard.

Writes:
- `config/intake/<client-id>.json`
- standard bootstrap outputs (config/data/rendered templates)
- `docs/client/generated/<client-id>-onboarding.md`

Usage:
```bash
# Interactive
npm run client:onboard

# Replay from a saved intake
npm run client:onboard -- --from-file config/intake/<client-id>.json --force

# Dry run
npm run client:onboard -- --from-file config/intake/<client-id>.json --dry-run
```

### `build-dispatch-intake.mjs`
Builds or updates `config/intake/<client-id>.json` from GitHub `workflow_dispatch` inputs.

Modes:
- `onboard`: create a fresh intake from form fields
- `go_live`: update technical domains in an existing intake

Usage:
```bash
npm run client:intake:dispatch -- --mode onboard --client-id my-client --brand-name "My Client"
npm run client:intake:dispatch -- --mode go_live --client-id my-client --production-domain myclient.no
```

### `apply-intake-domains.mjs`
Copies technical domain fields from intake to `config/client.config.json` without regenerating content modules.

Usage:
```bash
npm run client:apply-intake-domains -- --client-id my-client
```

### `set-cms-origins.mjs`
Sets `cms.siteOrigin`, `cms.displayOrigin`, and target publish mode in `config/client.config.json`.

Usage:
```bash
npm run client:cms-origin -- --target dev
npm run client:cms-origin -- --target production
```

## Deployment scripts

### `deploy-dev.sh`
Builds and deploys to DEV Pages project.

Config resolution order:
1. `CF_PAGES_DEV_PROJECT` env var
2. `config/client.config.json -> cloudflare.pagesProjectDev`
3. if missing, script fails preflight (no hardcoded customer fallback)

Deploy branch resolution order:
1. `CF_PAGES_DEPLOY_BRANCH` env var
2. `config/client.config.json -> cloudflare.pagesBranchDev`
3. fallback `main`

Safety guardrails:
- Script verifies generated `public/admin/config.yml` matches current `config/client.config.json` before deploy.

### `deploy-main.sh`
Builds and deploys to production/main candidate Pages project.

Config resolution order:
1. `CF_PAGES_PROD_PROJECT` env var
2. `config/client.config.json -> cloudflare.pagesProjectProd`
3. if missing, script fails preflight (no hardcoded customer fallback)

Deploy branch resolution order:
1. `CF_PAGES_DEPLOY_BRANCH` env var
2. `config/client.config.json -> cloudflare.pagesBranchProd`
3. fallback `main`

## Verification scripts

### `verify-deployment.sh`
Verifies:
- production routes: `/`, `/about`, `/blog/welcome`, `/admin/`
- DEV routes: `/`, `/about`, `/blog/welcome`, `/admin/`
- OAuth worker `/health`
- DNS resolution for production/dev/proxy domains

Domain defaults come from `config/client.config.json` unless overridden.

### `diagnose-cms-oauth.sh`
Runs strict OAuth diagnostics for CMS login:
- analyzes HAR for expected login chain (`/auth` -> GitHub authorize -> `/callback`)
- tests live proxy endpoints and prints `cf-ray`/status/body summary
- validates strict-origin behavior (`403` for unknown origin)

Usage:
```bash
npm run cms:diagnose-oauth
# Optional custom HAR path:
./scripts/diagnose-cms-oauth.sh /absolute/path/to/capture.har
```

### `smoke-test-client.sh`
Runs a full onboarding smoke test:
1. `npm run client:validate`
2. `npm run build`
3. `./scripts/deploy-dev.sh`
4. `./scripts/verify-deployment.sh`

### `onboard-smoke.sh`
Runs full meeting-intake onboarding + deploy verification in one command:
1. `npm run client:onboard -- --from-file <intake-file> --force`
2. `npm run client:validate`
3. `npm run build`
4. `./scripts/deploy-dev.sh`
5. `./scripts/verify-deployment.sh`

Usage:
```bash
npm run client:onboard:smoke -- config/intake/example.json
```
