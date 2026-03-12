# Onboarding Summary - Kunde Utkast

Generated: 2026-03-10

## Decision Summary
- Client ID: `kunde-utkast`
- Brand: `Kunde Utkast`
- Repo: `allisson79/kunde-utkast-site`
- Domains:
  - Production: `pending-domain.example`
  - DEV: `kunde-utkast-dev.pages.dev`
  - CMS proxy: `decap.soundofsimone.no`
- Language mode: `single`
- Theme preset: `wellness`
- Own-editing level: `medium`
- Selected modules: hero, proof_strip, service_cards, rich_text, gallery, contact_block, cta_band

## Technical Status
- Client config generated: `kunde-utkast`
- DEV Pages project: `kunde-utkast-dev`
- PROD Pages project: `kunde-utkast-main`
- Files generated:
- `config/client.config.json`
- `src/data/site-settings.json`
- `src/data/page-modules/home.json`
- `docs/client/onboarding-checklist.md`
- `public/admin/config.yml`
- `public/_headers`

## Design Direction
- Style direction: Editorial and clean
- Visual weight: balanced
- Notes: Bruk tydelig typografi, varme toner og rolig uttrykk.

## Timeline
- Go-live target: DEV klart innen 24 timer fra onboarding
- Milestones:
- DEV preview: TBD
- Production launch: TBD

## Social Feed / Taggbox
- Enabled: No
- Provider: taggbox
- Widget ID: Not set
- Profile sources: None
- Refresh cadence: daily

## TODO - You
- Set GitHub variables: `CF_PAGES_DEV_PROJECT`, `CF_PAGES_PROD_PROJECT`.
- Ensure shared OAuth worker has origins for production, www, and DEV.
- Run `npm run client:onboard:smoke -- config/intake/kunde-utkast.json`.

## TODO - Customer
- Provide final logo/image assets.
- Confirm approved module set and textual copy.
- Confirm Taggbox widget ID and social sources if social feed is enabled.

## Missing Clarifications
- None
