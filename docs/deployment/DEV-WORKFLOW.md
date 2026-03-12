# DEV Workflow (Client Feedback Before Production)

This project now uses a separate DEV environment so you can share progress safely before production release.

## Environments

- **Production:** `https://soundofsimone.no`
- **DEV:** `https://dev.sound-of-simone-dev.pages.dev`

## Daily Workflow

1. Work on a `dev` or `develop` branch.
2. Push branch changes to GitHub.
3. GitHub Action `Deploy DEV to Cloudflare Pages` deploys automatically to `sound-of-simone-dev`.
4. Share `https://dev.sound-of-simone-dev.pages.dev` with client for review.
5. Apply feedback on `dev/develop` until approved.
6. Merge approved changes to `main`.
7. Deploy production only when approved.

## Manual DEV Deploy (Local)

From repo root:

```bash
./scripts/deploy-dev.sh
```

This builds the Astro site and deploys to the DEV Pages project.

## Optional: Custom DEV Domain

If you want a branded DEV URL (recommended):

1. Cloudflare Dashboard -> Workers & Pages -> `sound-of-simone-dev`
2. `Custom domains` -> `Set up a custom domain`
3. Add `dev.soundofsimone.no`
4. Wait for TLS to become active

Then share:

- `https://dev.soundofsimone.no`
