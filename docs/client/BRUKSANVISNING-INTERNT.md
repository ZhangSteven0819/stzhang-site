# Bruksanvisning (Internt) - Factory Lite (No-CLI) + CMS

Mål: onboarde og levere en ny kunde uten lokal terminal, via GitHub Actions + Decap CMS.

## 1. Forberedelser (engangs)
1. Bekreft at `dev`-branch finnes.
2. Bekreft secrets i GitHub (helst org-level):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Bekreft delt OAuth worker er oppe:
   - `https://<cms-proxy-domain>/health`
4. Opprett Cloudflare Pages prosjekt manuelt for kunden (semi-auto), normalt:
   - DEV: `<client-id>-dev`
   - PROD: `<client-id>-main`

## 2. Onboard ny kunde (uten domene)
1. Gå til GitHub -> **Actions** -> **Onboard DEV (Factory Lite)**.
2. Fyll felter:
   - `client_id`, `brand_name`
   - `dev_domain`, `cms_proxy_domain`
   - språk/theme/moduler
3. Send workflow.

Forventet resultat:
- `config/intake/<client-id>.json` opprettes/oppdateres.
- `config/client.config.json`, CMS config og CSP genereres.
- Build + DEV deploy kjøres.
- CMS settes til DEV med `publish_mode=simple`.
- Filer commits automatisk til `dev`.

## 3. Kvalitetssjekk etter onboarding
1. Verifiser DEV site: `https://<dev-domain>/`
2. Verifiser CMS: `https://<dev-domain>/admin/`
3. Verifiser proxy: `https://<cms-proxy-domain>/health`
4. Kontroller onboarding-rapport:
   - `docs/client/generated/<client-id>-onboarding.md`

## 4. Go-live (når kunden har domene)
1. Kjør workflow **Client Go-live (Factory Lite)**.
2. Sett:
   - samme `client_id`
   - `production_domain`
   - ev. oppdatert `dev_domain` og `cms_proxy_domain`
3. Send workflow.

Forventet resultat:
- Intake tekniske domener oppdateres.
- Klientkonfig oppdateres uten å regenerere innholdsmoduler.
- CMS origin settes til produksjonsdomene og `publish_mode=editorial_workflow`.
- Build/deploy/commit kjøres på `dev`.

## 5. Drift: OAuth allowlist
Ved go-live eller domeneendring, oppdater `ALLOWED_ORIGINS` i worker:
- `https://<production-domain>`
- `https://www.<production-domain>`
- `http://localhost:4321`

DEV-origins (`*-dev.pages.dev`) håndteres av worker `DEV_ORIGIN_REGEX`.

Deretter:
1. Redeploy worker.
2. Verifiser:
   - `/health`
   - `/auth?origin=https://<production-domain>`

## 6. Feilsøking (kort)
- **Workflow feiler på deploy**: sjekk at riktig Pages-prosjekt finnes i Cloudflare.
- **CMS login feiler**: sjekk `ALLOWED_ORIGINS` + worker secrets (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`).
- **/admin laster, men kan ikke publisere**: sjekk repo/branch i generert `public/admin/config.yml`.

## 7. Ansvarsdeling
- Internt (deg): onboarding-flow, deploy, domene/origin, worker-oppsett.
- Kunde: tekst, bilder, modulinnhold i CMS.
