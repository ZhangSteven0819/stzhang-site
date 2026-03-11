# CMS DEV-First Runbook (Sound of Simone)

Dette dokumentet er den operative standarden frem til publisering.

## 1) Prelaunch lås (må alltid være sann)

- CMS admin brukes kun på: `https://dev.sound-of-simone-dev.pages.dev/admin/#/`
- CMS backend repo/branch: `allisson79/sound-of-simone` + `dev`
- CMS `site_url`/`display_url`: `https://dev.sound-of-simone-dev.pages.dev`
- OAuth allowlist (Worker): kun `https://dev.sound-of-simone-dev.pages.dev` + localhost
- DEV deploy branch (Cloudflare Pages): `dev`

## 2) Daglig redaktørflyt (Simone)

1. Simone logger inn i DEV-admin med GitHub-konto.
2. Endringer lagres/publiseres via `editorial_workflow` i CMS.
3. Endringer havner i `dev`-branch.
4. Teknisk ansvarlig QA-er visuelt på DEV-URL.
5. Godkjente endringer merges fra `dev` til `main` via PR.

Krav for tilgang:
- Simone må ha write-tilgang til repo `allisson79/sound-of-simone`.

## 3) Lanseringsdag (cutover)

1. Frys innhold 24 timer før lansering.
2. Kjør siste release-PR: `dev -> main`.
3. Sett CMS-origin til produksjon:
   - `npm run client:cms-origin -- --target production`
4. Sett CMS-branch til `main` i `config/client.config.json`.
5. Utvid Worker `ALLOWED_ORIGINS` med produksjonsdomene(r).
6. Deploy:
   - `npm run build`
   - `./scripts/deploy-main.sh` (kun når prod-deploy er eksplisitt besluttet)
   - `cd decap-proxy && npm run deploy`
7. Kjør verifisering:
   - `./scripts/verify-deployment.sh`
   - `npm run cms:diagnose-oauth`

## 4) Rollback ved feil

1. Reverter siste release-commit på `main`.
2. Sett CMS-origin tilbake til DEV:
   - `npm run client:cms-origin -- --target dev`
3. Sett CMS-branch tilbake til `dev`.
4. Fjern prod-origin fra Worker allowlist og redeploy Worker.
5. Deploy DEV på nytt:
   - `./scripts/deploy-dev.sh`

## 5) Akseptansekriterier

- Prelaunch:
  - Login i DEV fungerer.
  - Login fra produksjonsadmin blokkeres av OAuth (`403`).
- Launch:
  - Login i produksjon fungerer.
  - Redigering og lagring i CMS fungerer på `main`.
