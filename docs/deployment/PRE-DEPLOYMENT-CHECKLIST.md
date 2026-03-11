# 📋 Pre-Deployment Checklist

Use this checklist to ensure all prerequisites are in place before deploying to production.

## Local Development Setup

- [ ] Node.js (v18 or higher) installed
  ```bash
  node -v
  ```

- [ ] Dependencies installed
  ```bash
  npm install
  cd decap-proxy && npm install
  ```

- [ ] Build succeeds locally
  ```bash
  npm run build
  ```

- [ ] Dev server runs without errors
  ```bash
  npm run dev
  # Visit http://localhost:4321
  ```

## GitHub Configuration

- [ ] Repository is accessible
  - Repository: `allisson79/sound-of-simone`
  - Branch: `main`

- [ ] GitHub OAuth Application created
  - [ ] Go to https://github.com/settings/developers/new
  - [ ] Application name: `Sound of Simone CMS`
  - [ ] Homepage URL: `https://soundofsimone.no`
  - [ ] Authorization callback URL: `https://decap.soundofsimone.no/callback`
  - [ ] Save Client ID and Client Secret (you'll need these later)

## Cloudflare Account Setup

- [ ] Cloudflare account created (free tier is sufficient)
- [ ] Domain added to Cloudflare
  - Domain: `soundofsimone.no`
  - [ ] Nameservers updated at registrar
  - [ ] DNS active in Cloudflare

- [ ] Cloudflare API Token created
  - [ ] Go to https://dash.cloudflare.com/profile/api-tokens
  - [ ] Click "Create Token"
  - [ ] Use "Edit Cloudflare Workers" template
  - [ ] Add permissions: "Cloudflare Pages" - Edit
  - [ ] Copy token and save securely

- [ ] Cloudflare Account ID retrieved
  - [ ] Go to https://dash.cloudflare.com
  - [ ] Select your domain
  - [ ] Account ID is shown in the sidebar
  - [ ] Copy and save

## For Automated Deployment (Recommended)

- [ ] GitHub Secrets configured
  - [ ] Go to `https://github.com/allisson79/sound-of-simone/settings/secrets/actions`
  - [ ] Add secret: `CLOUDFLARE_API_TOKEN`
  - [ ] Add secret: `CLOUDFLARE_ACCOUNT_ID`

## For Manual Deployment

If not using automated deployment via GitHub Actions:

### OAuth Proxy Worker

- [ ] Wrangler CLI authenticated
  ```bash
  cd decap-proxy
  npx wrangler login
  ```

- [ ] Worker deployed
  ```bash
  npm run deploy
  ```

- [ ] Worker secrets configured in Cloudflare Dashboard
  - [ ] Go to Workers & Pages → decap-oauth-proxy → Settings → Variables
  - [ ] Add encrypted variable: `GITHUB_CLIENT_ID` (from GitHub OAuth App)
  - [ ] Add encrypted variable: `GITHUB_CLIENT_SECRET` (from GitHub OAuth App)
  - [ ] Click "Save and deploy"

- [ ] Worker custom domain configured
  - [ ] Go to Workers & Pages → decap-oauth-proxy → Settings → Domains & Routes
  - [ ] Click "Add Custom Domain"
  - [ ] Enter: `decap.soundofsimone.no`
  - [ ] Wait 2-5 minutes for DNS propagation
  - [ ] Test: `curl https://decap.soundofsimone.no`

### Main Site (Cloudflare Pages)

- [ ] Cloudflare Pages project created
  - [ ] Go to Cloudflare Dashboard → Pages
  - [ ] Click "Create a project" → "Connect to Git"
  - [ ] Select repository: `allisson79/sound-of-simone`
  - [ ] Configure build settings:
    - Framework preset: `Astro`
    - Build command: `npm run build`
    - Build output directory: `dist`
  - [ ] Click "Save and Deploy"

- [ ] Pages custom domain configured
  - [ ] Go to Pages project → Custom domains
  - [ ] Click "Set up a custom domain"
  - [ ] Enter: `soundofsimone.no`
  - [ ] Follow DNS instructions if needed
  - [ ] Wait for SSL certificate (~5 minutes)

## Verification

- [ ] Main site is accessible
  ```bash
  curl -I https://soundofsimone.no
  # Should return: HTTP/2 200
  ```

- [ ] About page loads
  ```bash
  curl -I https://soundofsimone.no/about
  ```

- [ ] Blog post loads
  ```bash
  curl -I https://soundofsimone.no/blog/welcome
  ```

- [ ] CMS admin interface loads
  ```bash
  curl -I https://soundofsimone.no/admin/
  ```

- [ ] OAuth proxy responds
  ```bash
  curl https://decap.soundofsimone.no
  # Should return: "OAuth Proxy for Decap CMS"
  ```

- [ ] Run full verification script
  ```bash
  ./scripts/verify-deployment.sh
  ```

## CMS Functionality Test

- [ ] CMS login works
  - [ ] Visit `https://soundofsimone.no/admin`
  - [ ] Click "Login with GitHub"
  - [ ] Authorize the application
  - [ ] CMS interface loads successfully

- [ ] Can edit content
  - [ ] Open "About Page" in CMS
  - [ ] Make a small change
  - [ ] Click "Save"
  - [ ] Check GitHub repository for new commit

- [ ] Changes appear on site
  - [ ] Wait 1-2 minutes for Pages rebuild
  - [ ] Visit the page you edited
  - [ ] Verify changes are visible

## Post-Deployment Tasks

- [ ] Update README with actual deployment URLs
- [ ] Document any custom configuration changes
- [ ] Set up monitoring (optional)
  - Cloudflare Analytics
  - GitHub Actions notifications
- [ ] Share admin access with team members (if applicable)
- [ ] Back up OAuth credentials securely

## Troubleshooting Reference

If you encounter issues, refer to:

- **Detailed troubleshooting**: See `DEPLOYMENT-QUICKSTART.md` section "Troubleshooting"
- **Deployment status**: Check `DEPLOYMENT-STATUS.md`
- **DNS issues**: See `decap-proxy/DNS-SETUP.md`
- **Worker setup**: See `decap-proxy/README.md`

## Common Issues

### "Client ID not configured" error
- ✅ Verify both secrets are added in Cloudflare Workers settings
- ✅ Redeploy the worker: `cd decap-proxy && npm run deploy`

### Worker domain not responding
- ✅ Use "Add Custom Domain" in Workers dashboard (not manual DNS)
- ✅ Wait 5 minutes for DNS propagation
- ✅ Check DNS: `dig decap.soundofsimone.no`

### Site not building
- ✅ Check build logs in Cloudflare Dashboard
- ✅ Verify build command is `npm run build`
- ✅ Verify output directory is `dist`

### CMS can't access repository
- ✅ Check GitHub OAuth callback URL is correct
- ✅ Verify OAuth app is authorized
- ✅ Check repository name in `public/admin/config.yml`

---

## Ready to Deploy?

Once all items in the relevant checklist sections are complete:

### For Automated Deployment:
```bash
git push origin main
```

### For Manual Deployment:
Follow the steps in [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md)

---

**Estimated Time:** 35-45 minutes for complete deployment  
**Cost:** Free (on Cloudflare Free plan)
