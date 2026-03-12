# Client Onboarding Checklist (Kunde Utkast)

## Generated Setup
- Client ID: `kunde-utkast`
- Repo: `allisson79/kunde-utkast-site`
- Production domain: `pending-domain.example`
- DEV domain: `kunde-utkast-dev.pages.dev`
- CMS proxy domain: `decap.soundofsimone.no`
- Cloudflare DEV project: `kunde-utkast-dev`
- Cloudflare PROD project: `kunde-utkast-main`

## Required Cloudflare/GitHub Variables
- GitHub Actions variable: `CF_PAGES_DEV_PROJECT=kunde-utkast-dev`
- GitHub Actions variable: `CF_PAGES_PROD_PROJECT=kunde-utkast-main`
- Worker secret: `GITHUB_CLIENT_ID`
- Worker secret: `GITHUB_CLIENT_SECRET`
- Worker var `ALLOWED_ORIGINS` must include:
  - `https://pending-domain.example`
  - `https://www.pending-domain.example`
  - `https://kunde-utkast-dev.pages.dev`
  - `http://localhost:4321`

## New Client Smoke Test
1. `npm run client:validate`
2. `npm run build`
3. `./scripts/deploy-dev.sh`
4. `DEV_DOMAIN=kunde-utkast-dev.pages.dev PROXY_DOMAIN=decap.soundofsimone.no ./scripts/verify-deployment.sh`
5. Check URLs:
   - `https://kunde-utkast-dev.pages.dev/`
   - `https://kunde-utkast-dev.pages.dev/admin/`
   - `https://decap.soundofsimone.no/health`
   - `https://decap.soundofsimone.no/auth?origin=https://pending-domain.example`

## Ops Routine for Shared OAuth Worker
1. Add customer origins to `ALLOWED_ORIGINS`.
2. Redeploy worker: `cd decap-proxy && npm run deploy`.
3. Verify `/health` and `/auth?origin=...`.
