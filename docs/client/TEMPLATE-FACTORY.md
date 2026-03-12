# Template Factory v1

## Core concepts
- One reusable Astro template repo.
- One shared Decap OAuth Worker.
- One bootstrap script for deterministic customer setup.
- One meeting-mode onboarding wizard for live intake.
- One CMS model with core settings + modular homepage sections.

## Config contract
- `config/client.config.json` is the source of truth for:
  - repository owner/name/branch
  - production/dev/cms domains
  - Cloudflare Pages project names
  - CMS publish mode/media folders
  - localization mode/locales
  - theme preset + tokens

## Rendering flow
- `npm run client:render` generates:
  - `public/admin/config.yml` from `public/admin/config.template.yml`
  - `public/_headers` from `public/_headers.template`
- CSP is Taggbox-aware:
  - If `social_feed` with a valid Taggbox widget is enabled, required Taggbox CSP domains are included.
  - If disabled, CSP stays strict.

## Bootstrap flow
- `npm run client:bootstrap -- ...` generates:
  - `config/client.config.json`
  - `src/data/site-settings.json`
  - `src/data/page-modules/home.json`
  - `docs/client/onboarding-checklist.md`
  - rendered CMS/CSP files

## Meeting-mode onboarding flow
- `npm run client:onboard` asks questions interactively and writes:
  - `config/intake/<client-id>.json`
  - bootstrap outputs (`client.config.json`, `site-settings.json`, `home.json`, rendered templates)
  - `docs/client/generated/<client-id>-onboarding.md`
- `npm run client:onboard -- --from-file config/intake/<client-id>.json --force` replays onboarding deterministically.

## No-CLI onboarding flow (GitHub form)
- Workflows:
  - `.github/workflows/client-onboard-form.yml` (Onboard DEV)
  - `.github/workflows/client-go-live.yml` (Go-live)
- Trigger via `workflow_dispatch` from GitHub Actions (no local terminal needed).
- Uses existing scripts internally:
  1. `client:intake:dispatch` (builds/updates intake from form fields)
  2. `client:onboard -- --from-file ... --force` (onboard only)
  3. `client:apply-intake-domains` (go-live only)
  4. `client:cms-origin -- --target dev|production`
  5. `client:validate`, `build`, `deploy-dev.sh`
- Auto-commits generated onboarding files to `dev`.
- Onboard flow keeps CMS on DEV with `publish_mode=simple`.
- Go-live flow updates technical domains and flips CMS to production with `publish_mode=editorial_workflow`.
- Operational guides:
  - `docs/client/BRUKSANVISNING-INTERNT.md`
  - `docs/client/BRUKSANVISNING-KUNDE.md`

## Full smoke flow
- `npm run client:onboard:smoke -- config/intake/<client-id>.json`
- Runs:
  1. onboarding replay
  2. validation
  3. build
  4. DEV deploy
  5. deployment verification

## Shared OAuth worker ops routine
1. Keep explicit production origins in `ALLOWED_ORIGINS`.
2. Let `DEV_ORIGIN_REGEX` handle `*-dev.pages.dev` origins.
3. Deploy worker: `cd decap-proxy && npm run deploy`.
4. Verify:
   - `/health`
   - `/auth?origin=https://<customer-domain>`
5. Reject unknown origins by default.
