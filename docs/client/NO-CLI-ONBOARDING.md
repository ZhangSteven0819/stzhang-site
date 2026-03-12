# No-CLI Onboarding (GitHub Form + CMS on DEV)

This runbook lets you onboard clients without local terminal commands.

## What this uses
- GitHub workflows:
  - `.github/workflows/client-onboard-form.yml` (Onboard DEV)
  - `.github/workflows/client-go-live.yml` (Go-live)
- Existing automation scripts:
  - `client:onboard`
  - `client:apply-intake-domains`
  - `client:validate`
  - `deploy-dev.sh`

## Prerequisites
- `dev` branch exists in the repo.
- Cloudflare secrets are set in GitHub (prefer org-level):
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- Cloudflare Pages DEV project is created manually (semi-auto model) and matches expected name (`<client-id>-dev`) or values in generated config.
- Shared OAuth worker stays active (set your shared proxy hostname, for example `decap.soundofsimone.no`).

## Onboard new client (without domain access)
1. Open **Actions** in GitHub.
2. Run workflow **Onboard DEV (Factory Lite)**.
3. Fill required fields:
   - `client_id`, `brand_name`
   - `dev_domain`, `cms_proxy_domain`
   - language/theme/module values
4. Submit workflow.

Workflow result:
- Generates intake + client config + CMS/CSP output.
- Sets CMS origins to DEV by default.
- Forces `publish_mode=simple` on DEV.
- Builds + deploys to DEV Pages.
- Commits generated files to `dev` branch.

## Go-live switch (separate workflow)
1. Run workflow **Client Go-live (Factory Lite)**.
2. Use same `client_id`.
3. Enter final `production_domain` (and `dev_domain`/`cms_proxy_domain` if changed).
4. Submit workflow.

Workflow result:
- Updates intake technical domains.
- Updates client domains without regenerating content modules.
- Sets CMS origin to production domain and `publish_mode=editorial_workflow`.
- Builds + deploys to DEV.
- Commits updates to `dev` branch.

## Day-to-day editing flow
- Do content/design editing in Decap CMS at:
  - `https://<dev-domain>/admin/`
- This is the default editing surface during onboarding.
- Move to production-domain editing only after go-live run and worker allowlist update.

## After domain is available
- Ensure shared worker `ALLOWED_ORIGINS` includes:
  - `https://<production-domain>`
  - `https://www.<production-domain>`
  - `http://localhost:4321`
- DEV pages domains are matched by worker `DEV_ORIGIN_REGEX`.
- Redeploy worker and verify:
  - `/health`
  - `/auth?origin=https://<production-domain>`

## Related guides
- Internal operations: `docs/client/BRUKSANVISNING-INTERNT.md`
- Customer-facing CMS guide: `docs/client/BRUKSANVISNING-KUNDE.md`
