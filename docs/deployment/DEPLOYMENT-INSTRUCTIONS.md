# 🚀 Deploy Your Site - Complete Guide

**Status:** ✅ All code is ready. Follow these steps to deploy to production.

**Time Required:** 30-40 minutes (one-time setup)

---

## What You're Deploying

This repository will deploy:
1. **Main Website** → `soundofsimone.no` (Cloudflare Pages)
2. **OAuth Proxy** → `decap.soundofsimone.no` (Cloudflare Workers)
3. **CMS Admin** → `soundofsimone.no/admin` (Decap CMS)

---

## Quick Deployment Options

### Option A: Automated Deployment (Recommended)

**One-time setup, then push to deploy automatically**

1. **Set up GitHub Secrets** (see detailed steps below)
2. **Set up Cloudflare** (see detailed steps below)
3. **Push to main branch** → Automatic deployment!

### Option B: Manual Deployment

Follow the step-by-step guide in [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md)

---

## Automated Deployment Setup

### Step 1: Get Your Cloudflare Credentials

1. **Log in to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/

2. **Get your Account ID**
   - Click on your domain (`soundofsimone.no`)
   - Look in the right sidebar
   - Copy the **Account ID**

3. **Create an API Token**
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click **"Create Token"**
   - Use template: **"Edit Cloudflare Workers"**
   - Add these permissions:
     - Account → Cloudflare Pages → Edit
     - Account → Workers Scripts → Edit
   - Click **"Continue to summary"**
   - Click **"Create Token"**
   - **COPY THE TOKEN** (you can't see it again!)

### Step 2: Add GitHub Secrets

1. **Go to Repository Settings**
   - Navigate to: https://github.com/allisson79/sound-of-simone/settings/secrets/actions

2. **Add Secrets**
   - Click **"New repository secret"**
   - Add these two secrets:

   **Secret 1:**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: [Your API token from Step 1]

   **Secret 2:**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: [Your Account ID from Step 1]

### Step 3: Create GitHub OAuth App

1. **Go to GitHub Developer Settings**
   - Navigate to: https://github.com/settings/developers

2. **Create New OAuth App**
   - Click **"New OAuth App"**
   - Fill in:
     - **Application name:** `Sound of Simone CMS`
     - **Homepage URL:** `https://soundofsimone.no`
     - **Authorization callback URL:** `https://decap.soundofsimone.no/callback`
   - Click **"Register application"**

3. **Save Credentials**
   - Copy **Client ID**
   - Click **"Generate a new client secret"**
   - Copy **Client Secret**
   - **Save both** - you'll need them in Step 4

### Step 4: Set Up Cloudflare Pages Project

1. **Go to Cloudflare Dashboard**
   - Navigate to: https://dash.cloudflare.com/
   - Click **"Workers & Pages"** in the sidebar

2. **Create Pages Project**
   - Click **"Create application"**
   - Select **"Pages"** tab
   - Click **"Connect to Git"**
   - Authorize Cloudflare to access GitHub
   - Select repository: `allisson79/sound-of-simone`

3. **Configure Build Settings**
   - **Project name:** `sound-of-simone`
   - **Production branch:** `main`
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Click **"Save and Deploy"**

4. **Set Up Custom Domain**
   - After first build completes, go to **"Custom domains"**
   - Click **"Set up a custom domain"**
   - Enter: `soundofsimone.no`
   - Follow instructions (usually auto-detected if domain is in Cloudflare)
   - Wait 5-10 minutes for SSL certificate

### Step 5: Deploy OAuth Proxy Worker

**Option A: Automatic (when you push changes to `decap-proxy/`)**

The GitHub Action will deploy automatically when you modify files in `decap-proxy/`.

**Option B: Manual Deploy**

```bash
cd decap-proxy
npm install
npx wrangler login
npm run deploy
```

### Step 6: Configure Worker Secrets

1. **Go to Cloudflare Dashboard**
   - Navigate to: **Workers & Pages** → **decap-oauth-proxy**

2. **Add Environment Variables**
   - Go to **"Settings"** → **"Variables"**
   - Click **"Add variable"** (select "Encrypt" for each)

   **Variable 1:**
   - Name: `GITHUB_CLIENT_ID`
   - Value: [GitHub Client ID from Step 3]

   **Variable 2:**
   - Name: `GITHUB_CLIENT_SECRET`
   - Value: [GitHub Client Secret from Step 3]

3. **Save and Deploy**
   - Click **"Save and deploy"**

### Step 7: Configure Worker Custom Domain

⚠️ **IMPORTANT:** Use Cloudflare's "Add Custom Domain" feature - DO NOT create DNS records manually!

1. **In Cloudflare Dashboard**
   - Go to: **Workers & Pages** → **decap-oauth-proxy**
   - Go to: **"Settings"** → **"Domains & Routes"**

2. **Add Custom Domain**
   - Click **"Add Custom Domain"**
   - Enter: `decap.soundofsimone.no`
   - Click **"Add Custom Domain"**
   - Wait 2-5 minutes for DNS propagation

3. **Verify**
   ```bash
   curl https://decap.soundofsimone.no
   # Should return: "OAuth Proxy for Decap CMS"
   ```

---

## Deploy! 🚀

### Trigger Automated Deployment

**Option 1: Push to main**
```bash
git push origin main
```

**Option 2: Manual trigger via GitHub Actions**
1. Go to: https://github.com/allisson79/sound-of-simone/actions
2. Select **"Deploy to Cloudflare Pages"**
3. Click **"Run workflow"**
4. Select branch: `main`
5. Click **"Run workflow"**

### Monitor Deployment

1. **GitHub Actions**
   - Go to: https://github.com/allisson79/sound-of-simone/actions
   - Watch the workflow progress

2. **Cloudflare Dashboard**
   - Go to: **Workers & Pages** → **sound-of-simone**
   - Check deployment status

---

## Verify Deployment

### Quick Test

```bash
# Test main site
curl -I https://soundofsimone.no
# Expected: HTTP/2 200

# Test OAuth proxy
curl https://decap.soundofsimone.no
# Expected: "OAuth Proxy for Decap CMS"
```

### Full Verification

```bash
./scripts/verify-deployment.sh
```

### Manual CMS Test

1. Visit: https://soundofsimone.no/admin
2. Click **"Login with GitHub"**
3. Authorize the application
4. You should see the CMS interface
5. Try editing the About page
6. Save changes
7. Check your GitHub repo for new commit
8. Wait 1-2 minutes for rebuild
9. Verify changes on site

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Main site loads: https://soundofsimone.no
- [ ] About page loads: https://soundofsimone.no/about
- [ ] Blog post loads: https://soundofsimone.no/blog/welcome
- [ ] Admin panel loads: https://soundofsimone.no/admin
- [ ] OAuth proxy responds: https://decap.soundofsimone.no
- [ ] CMS login works
- [ ] Can edit content in CMS
- [ ] Changes commit to GitHub
- [ ] Changes appear on site after rebuild

---

## Troubleshooting

### Build Fails

**Symptom:** GitHub Action fails or Cloudflare build fails

**Solutions:**
- Check Node.js version is 18+
- Verify build command: `npm run build`
- Verify output directory: `dist`
- Check build logs in Cloudflare Dashboard

### Worker Not Responding

**Symptom:** `curl https://decap.soundofsimone.no` fails

**Solutions:**
- Verify you used "Add Custom Domain" in Cloudflare (not manual DNS)
- Wait 5 minutes for DNS propagation
- Check DNS: `dig decap.soundofsimone.no`
- Verify worker is deployed

### CMS Login Fails

**Symptom:** "Error: Unable to access" or "Client ID not configured"

**Solutions:**
- Verify OAuth secrets are set in Cloudflare Workers
- Check GitHub OAuth callback URL: `https://decap.soundofsimone.no/callback`
- Verify repository name in `public/admin/config.yml`
- Clear browser cache and try again

### "Repo Not Found" in CMS

**Solutions:**
- Verify OAuth app is authorized
- Check repository name format: `allisson79/sound-of-simone`
- Ensure GitHub user has access to repository

---

## Updating Content

Once deployed, you can:

1. **Edit via CMS**
   - Visit: https://soundofsimone.no/admin
   - Login with GitHub
   - Edit pages/posts
   - Changes commit automatically

2. **Edit via Git**
   - Edit files in repository
   - Commit and push
   - Site rebuilds automatically

---

## Further Customization

After successful deployment:

- **Customize design:** Edit `src/pages/index.astro`
- **Add collections:** Edit `public/admin/config.yml`
- **Add team members:** Share repository access
- **Monitor analytics:** Use Cloudflare Analytics

---

## Need More Help?

- 📖 **Detailed Guide:** [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md)
- 📋 **Prerequisites:** [PRE-DEPLOYMENT-CHECKLIST.md](./PRE-DEPLOYMENT-CHECKLIST.md)
- 📊 **Status:** [DEPLOYMENT-STATUS.md](./DEPLOYMENT-STATUS.md)
- 🔧 **Worker Setup:** [decap-proxy/README.md](./decap-proxy/README.md)
- 🌐 **DNS Guide:** [decap-proxy/DNS-SETUP.md](./decap-proxy/DNS-SETUP.md)

---

## Summary

**What we have:**
- ✅ Complete Astro website
- ✅ Decap CMS integration
- ✅ OAuth proxy worker
- ✅ GitHub Actions workflows
- ✅ All configuration files
- ✅ Documentation

**What you need to do:**
1. Set up Cloudflare account (5 min)
2. Set up GitHub secrets (2 min)
3. Create GitHub OAuth app (3 min)
4. Configure Cloudflare Pages (5 min)
5. Deploy and configure Worker (10 min)
6. Set up custom domains (10 min)
7. Test everything (5 min)

**Total Time:** ~40 minutes

**After setup:** Deployments are automatic! Just push to main branch.

---

**Ready?** Start with Step 1 above, or follow [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md) for more details.
