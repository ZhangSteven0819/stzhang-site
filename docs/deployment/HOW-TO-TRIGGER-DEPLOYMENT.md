# 🎯 How to Trigger Deployment

This guide explains how to trigger deployment once you've completed the setup steps in [DEPLOYMENT-INSTRUCTIONS.md](./DEPLOYMENT-INSTRUCTIONS.md).

---

## Prerequisites

Before triggering deployment, ensure you have completed:

- ✅ GitHub Secrets configured (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- ✅ Cloudflare Pages project created
- ✅ GitHub OAuth app created
- ✅ Worker secrets configured in Cloudflare
- ✅ Custom domains set up

See [DEPLOYMENT-INSTRUCTIONS.md](./DEPLOYMENT-INSTRUCTIONS.md) for setup details.

---

## Automated Deployment Methods

### Method 1: Push to Main Branch (Recommended)

**When to use:** Regular updates and content changes

```bash
# Make your changes
git add .
git commit -m "Your commit message"
git push origin main
```

**What happens:**
- GitHub Actions automatically triggers
- Site builds using `npm run build`
- Deploys to Cloudflare Pages
- Worker deploys if `decap-proxy/` files changed
- Takes 2-4 minutes

**Monitor:**
- View progress: https://github.com/allisson79/sound-of-simone/actions

### Method 2: Manual Workflow Dispatch

**When to use:** Trigger deployment without new commits

1. **Go to GitHub Actions**
   - Navigate to: https://github.com/allisson79/sound-of-simone/actions

2. **Select Workflow**
   - Click on **"Deploy to Cloudflare Pages"** in the left sidebar

3. **Run Workflow**
   - Click the **"Run workflow"** dropdown button
   - Select branch: `main`
   - Click **"Run workflow"** button

4. **Monitor Progress**
   - Watch the workflow run in real-time
   - Check logs if there are any issues

### Method 3: Merge Pull Request

**When to use:** Deploying changes from a PR

1. **Review Pull Request**
   - Open the PR in GitHub

2. **Merge PR**
   - Click **"Merge pull request"**
   - Confirm merge

3. **Automatic Deployment**
   - GitHub Actions triggers automatically
   - Deployment starts within seconds

---

## Worker Deployment

The OAuth proxy worker deploys:

### Automatic Trigger

Worker deploys automatically when:
- Files in `decap-proxy/` directory change
- `.github/workflows/deploy-worker.yml` changes
- Push to `main` branch

### Manual Worker Deploy

If you need to deploy the worker manually:

```bash
cd decap-proxy
npm install
npx wrangler login
npm run deploy
```

**Manual trigger via GitHub Actions:**
1. Go to: https://github.com/allisson79/sound-of-simone/actions
2. Select: **"Deploy OAuth Proxy to Cloudflare Workers"**
3. Click: **"Run workflow"**
4. Select branch: `main`
5. Click: **"Run workflow"**

---

## Monitoring Deployment

### GitHub Actions Dashboard

1. **Go to Actions Tab**
   - https://github.com/allisson79/sound-of-simone/actions

2. **View Workflows**
   - See all recent deployments
   - Check status (success/failure)
   - View detailed logs

3. **Troubleshoot Failures**
   - Click on failed workflow
   - Review error logs
   - Fix issues and retry

### Cloudflare Dashboard

1. **Check Pages Deployment**
   - Go to: https://dash.cloudflare.com/
   - Navigate to: **Workers & Pages** → **sound-of-simone**
   - View deployment history
   - Check build logs

2. **Check Worker Status**
   - Go to: **Workers & Pages** → **decap-oauth-proxy**
   - View deployment status
   - Check recent invocations

---

## Deployment Status Indicators

### GitHub Actions

- 🟢 **Green check** - Deployment successful
- 🟡 **Yellow dot** - Deployment in progress
- 🔴 **Red X** - Deployment failed

### Cloudflare Pages

- **Success** - Site is live
- **Building** - Build in progress
- **Failed** - Build failed (check logs)

---

## Verify Deployment

After triggering deployment, verify it worked:

### Quick Check

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

### Manual Browser Check

1. Visit: https://soundofsimone.no
2. Check pages load correctly
3. Test: https://soundofsimone.no/admin
4. Test CMS login

---

## Deployment Timeline

| Action | Time |
|--------|------|
| Push to GitHub | Instant |
| GitHub Actions starts | 5-10 seconds |
| Build completes | 1-2 minutes |
| Deploy to Cloudflare | 30-60 seconds |
| DNS propagation | 1-5 minutes |
| Site accessible | 2-4 minutes total |

---

## Rollback

If deployment has issues:

### Method 1: Revert Commit

```bash
git revert HEAD
git push origin main
```

### Method 2: Cloudflare Pages Rollback

1. Go to Cloudflare Dashboard
2. Navigate to: **Workers & Pages** → **sound-of-simone**
3. Go to: **Deployments**
4. Find previous successful deployment
5. Click: **"..."** → **"Rollback to this deployment"**

---

## Deployment Workflows

### Main Site Workflow

**File:** `.github/workflows/deploy.yml`

**Triggers on:**
- Push to `main` branch
- Manual workflow dispatch

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Build site (`npm run build`)
5. Deploy to Cloudflare Pages

### Worker Workflow

**File:** `.github/workflows/deploy-worker.yml`

**Triggers on:**
- Push to `main` branch (only if `decap-proxy/` changes)
- Manual workflow dispatch

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install worker dependencies
4. Deploy to Cloudflare Workers

---

## Troubleshooting

### Deployment Fails

**Check:**
1. GitHub Actions logs for errors
2. Build command runs successfully locally
3. GitHub Secrets are correctly set
4. Cloudflare API token has correct permissions

**Solution:**
- Review error messages in Actions logs
- Test build locally: `npm run build`
- Verify secrets in repository settings
- Check Cloudflare token permissions

### Worker Deploy Fails

**Check:**
1. Worker secrets are set in Cloudflare
2. `wrangler.toml` configuration is correct
3. Cloudflare API token has Workers permissions

**Solution:**
- Verify secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Check worker logs in Cloudflare dashboard
- Manually deploy: `cd decap-proxy && npm run deploy`

### Site Not Updating

**Possible causes:**
1. DNS cache
2. Browser cache
3. Cloudflare cache

**Solution:**
- Wait 5 minutes for DNS propagation
- Clear browser cache (Ctrl+Shift+R)
- Purge Cloudflare cache in dashboard

---

## Best Practices

1. **Test Locally First**
   ```bash
   npm run build
   npm run preview
   ```

2. **Use Descriptive Commit Messages**
   ```bash
   git commit -m "Add: New blog post about deployment"
   ```

3. **Monitor Deployments**
   - Watch GitHub Actions after push
   - Verify site works after deployment

4. **Keep Dependencies Updated**
   ```bash
   npm update
   git add package-lock.json
   git commit -m "Update dependencies"
   git push
   ```

5. **Use Pull Requests**
   - Create branch for changes
   - Test in preview
   - Merge to main when ready

---

## Next Steps

After successful deployment:

1. **Add Content**
   - Use CMS at: https://soundofsimone.no/admin
   - Or edit files directly in GitHub

2. **Customize Design**
   - Edit `src/pages/index.astro`
   - Push changes to deploy

3. **Add Team Members**
   - Share repository access
   - They can use CMS to edit content

4. **Set Up Monitoring**
   - Use Cloudflare Analytics
   - Monitor GitHub Actions

---

## Summary

**To deploy:**
```bash
git push origin main
```

**Monitor:**
- https://github.com/allisson79/sound-of-simone/actions

**Verify:**
- https://soundofsimone.no
- https://decap.soundofsimone.no

**That's it!** 🚀

For setup instructions, see [DEPLOYMENT-INSTRUCTIONS.md](./DEPLOYMENT-INSTRUCTIONS.md)
