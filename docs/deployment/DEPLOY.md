# 🚀 Quick Deployment Guide

This is a quick reference for deploying Sound of Simone. For detailed instructions, see [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md).

## Prerequisites ✅

- [x] Dependencies installed (`npm install`)
- [x] Build system working (`npm run build`)
- [x] GitHub Actions workflows configured
- [x] Deployment verification script ready

## Choose Your Deployment Method

### Option 1: Automated Deployment (Recommended) ⚡

**Setup once:**
1. Add GitHub Secrets:
   - Go to: https://github.com/allisson79/sound-of-simone/settings/secrets/actions
   - Add `CLOUDFLARE_API_TOKEN`
   - Add `CLOUDFLARE_ACCOUNT_ID`

2. Complete manual prerequisites:
   - Create GitHub OAuth App
   - Configure Worker secrets in Cloudflare
   - Set up custom domains

**Deploy:**
```bash
git push origin main
```

GitHub Actions will automatically:
- Build the site
- Deploy to Cloudflare Pages
- Deploy OAuth proxy (if changed)

### Option 2: Manual Deployment 🔧

Follow the complete guide: [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md)

**Quick steps:**
```bash
# 1. Deploy OAuth Proxy
cd decap-proxy
npx wrangler login
npm run deploy

# 2. Deploy via Cloudflare Dashboard
# - Connect GitHub repo to Cloudflare Pages
# - Configure build: npm run build, output: dist

# 3. Configure domains and secrets in Cloudflare Dashboard
```

## Verification

After deployment:
```bash
./scripts/verify-deployment.sh
```

## Documentation

- 📋 [Pre-Deployment Checklist](./PRE-DEPLOYMENT-CHECKLIST.md) - Ensure prerequisites are ready
- 🚀 [Deployment Quick Start](./DEPLOYMENT-QUICKSTART.md) - Step-by-step manual deployment (35 min)
- 📊 [Deployment Status](./DEPLOYMENT-STATUS.md) - Current status and architecture
- 📖 [README](./README.md) - Complete setup and documentation

## Architecture

```
GitHub Repo (allisson79/sound-of-simone)
    ├── GitHub Actions (Auto Deploy)
    │   ├── .github/workflows/deploy.yml → Cloudflare Pages
    │   └── .github/workflows/deploy-worker.yml → Cloudflare Workers
    │
    ├── Main Site
    │   ├── Build: npm run build
    │   ├── Output: dist/
    │   └── Deploy to: soundofsimone.no
    │
    └── OAuth Proxy (decap-proxy/)
        ├── Deploy: npm run deploy
        └── Deploy to: decap.soundofsimone.no
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm install` and check Node.js version |
| Worker deployment fails | Check `CLOUDFLARE_API_TOKEN` has correct permissions |
| CMS login fails | Verify OAuth app callback URL and Worker secrets |
| DNS not resolving | Use Cloudflare "Add Custom Domain" feature, wait 5 min |

See full troubleshooting guide in [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md)

## Quick Commands

```bash
# Development
npm run dev                          # Start dev server (localhost:4321)

# Build
npm run build                        # Build for production
npm run preview                      # Preview production build

# Deploy (manual)
cd decap-proxy && npm run deploy     # Deploy OAuth proxy

# Verify
./scripts/verify-deployment.sh      # Test deployed components
```

## Support

For detailed help:
- See [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md) for step-by-step instructions
- Check [DEPLOYMENT-STATUS.md](./DEPLOYMENT-STATUS.md) for current status
- Review [PRE-DEPLOYMENT-CHECKLIST.md](./PRE-DEPLOYMENT-CHECKLIST.md) for prerequisites

---

**Ready to deploy?** Start with [PRE-DEPLOYMENT-CHECKLIST.md](./PRE-DEPLOYMENT-CHECKLIST.md)
