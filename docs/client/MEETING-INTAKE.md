# Meeting Intake (v1)

This document describes the input contract used by `npm run client:onboard`.

## Purpose
Capture all high-signal onboarding decisions live in customer meetings so the template can be generated immediately with minimal manual work.

## Data contract
The canonical schema is:
- `config/intake.schema.json`

The wizard writes to:
- `config/intake/<client-id>.json`
- `docs/client/generated/<client-id>-onboarding.md`

## Required sections
- `client`
: Contact and identity data.
- `technical`
: Repo/domain/language/theme setup.
- `design`
: Direction, visual weight, notes.
- `timeline`
: Go-live target and milestones.
- `modules`
: Active module list + self-editing level.
- `social.taggbox`
: Taggbox activation and embed details.

## Commands
Interactive meeting mode:
```bash
npm run client:onboard
```

Replay from saved intake:
```bash
npm run client:onboard -- --from-file config/intake/<client-id>.json --force
```

Dry-run:
```bash
npm run client:onboard -- --from-file config/intake/<client-id>.json --dry-run
```

GitHub form (no local CLI):
- Use workflow `.github/workflows/client-onboard-form.yml`.
- It generates/updates the same intake contract via `client:intake:dispatch`.

## Validation rules
- Hostnames must not include protocol/path.
- Language mode must be `single` or `bilingual`.
- Own-editing level must be `low`, `medium`, or `high`.
- Module names must be from the allowed module set.
- If Taggbox is enabled, `widgetId` must be present and valid.

## Default assumptions
- DEV onboarding uses `publish_mode=simple` by default.
- Go-live switches to `publish_mode=editorial_workflow`.
- Own-editing level defaults to `medium`.
- If go-live target is not specified, the default expectation is DEV readiness within 24 hours.
