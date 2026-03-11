# 🚀 Deployment Quick Start Guide

**Ready to deploy in ~35 minutes!**

All code is complete. Follow these 6 steps to deploy your site to production.

---

## Prerequisites

- ✅ GitHub account with access to this repository
- ✅ Cloudflare account (free tier works)
- ✅ Domain configured in Cloudflare (soundofsimone.no)

---

## Step 1: Create GitHub OAuth App (5 min)

1. Go to https://github.com/settings/developers/new
2. Fill in:
   - **Application name**: `Sound of Simone CMS`
   - **Homepage URL**: `https://soundofsimone.no`
   - **Authorization callback URL**: `https://decap.soundofsimone.no/callback`
3. Click **Register application**
4. Copy your **Client ID** and **Client Secret** (you'll need these in Step 2)

---

## Step 2: Deploy OAuth Proxy Worker (5 min)

```bash
# Navigate to the proxy directory
cd decap-proxy

# Login to Cloudflare
npx wrangler login

# Deploy the worker
npm run deploy
```

**Add secrets to the deployed worker:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **decap-oauth-proxy**
3. Go to **Settings** → **Variables**
4. Click **Add variable** → **Encrypt** for each:
   - Name: `GITHUB_CLIENT_ID`, Value: [Your GitHub Client ID from Step 1]
   - Name: `GITHUB_CLIENT_SECRET`, Value: [Your GitHub Client Secret from Step 1]
5. Click **Save and deploy**

---

## Step 3: Configure Worker Custom Domain (10 min)

⚠️ **Important**: Do NOT manually create DNS records!

1. In Cloudflare Dashboard, go to **Workers & Pages** → **decap-oauth-proxy**
2. Go to **Settings** → **Domains & Routes**
3. Click **Add Custom Domain**
4. Enter: `decap.soundofsimone.no`
5. Click **Add Custom Domain**
6. Wait 2-5 minutes for DNS propagation

**Verify it works:**
```bash
curl https://decap.soundofsimone.no
# Should return: "OAuth Proxy for Decap CMS"
```

---

## Step 4: Deploy to Cloudflare Pages (10 min)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Authorize Cloudflare to access your GitHub account
4. Select repository: **allisson79/sound-of-simone**
5. Configure build settings:
   - **Project name**: `sound-of-simone` (or your preference)
   - **Production branch**: `main`
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save and Deploy**
7. Wait for the build to complete (~2-3 minutes)

---

## Step 5: Configure Pages Custom Domain (10 min)

1. After deployment, in your Pages project, click **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `soundofsimone.no`
4. Follow the DNS instructions if needed (Cloudflare usually auto-detects)
5. Wait for SSL certificate to be issued (~5 minutes)

---

## Step 6: Test Everything (5 min)

### Test the main site:
```bash
curl -I https://soundofsimone.no
# Should return: HTTP/2 200
```

Visit in browser: https://soundofsimone.no

### Test the CMS:
1. Visit https://soundofsimone.no/admin
2. Click **Login with GitHub**
3. Authorize the OAuth app
4. You should see the CMS interface
5. Try editing the About page
6. Save changes
7. Check your GitHub repo - you should see a new commit

### Test content changes:
1. Edit content in CMS
2. Save and publish
3. Wait 1-2 minutes for Pages to rebuild
4. Verify changes appear on your site

---

## ✅ Success Checklist

- [ ] GitHub OAuth app created
- [ ] Worker deployed with secrets
- [ ] Worker custom domain configured (decap.soundofsimone.no)
- [ ] Pages site deployed
- [ ] Pages custom domain configured (soundofsimone.no)
- [ ] Main site loads correctly
- [ ] CMS login works
- [ ] Can edit and save content
- [ ] Changes appear on the site

---

## 🎉 You're Done!

Your site is now live with a fully functional CMS!

### What you can do now:

- **Edit content**: Visit https://soundofsimone.no/admin
- **Add blog posts**: In CMS, go to Blog → New Blog
- **Update About page**: In CMS, go to Pages → About Page
- **Upload images**: Use the media library in CMS

### Next steps:

- Customize the design in `src/pages/index.astro`
- Add more content collections in `public/admin/config.yml`
- Add team members to your GitHub repo for collaborative editing

---

## 🔧 Troubleshooting

### "Client ID not configured" error
- Make sure you added both secrets in Step 2
- Redeploy the worker: `cd decap-proxy && npm run deploy`

### CMS shows "Repo not found"
- Verify the GitHub OAuth app has the correct callback URL
- Check that you authorized the app during login

### Worker domain not responding
- Make sure you used "Add Custom Domain" in Workers dashboard
- Don't manually create DNS records
- Wait 5 minutes for DNS propagation
- Check DNS: `dig decap.soundofsimone.no`

### Site not building on Pages
- Check build logs in Cloudflare Dashboard
- Verify build command is `npm run build`
- Verify output directory is `dist`

---

## 📚 More Information

- **Full documentation**: See `CLOUDFLARE-SETUP-COMPLETE.md`
- **Setup guide**: See `README.md`
- **DNS guide**: See `decap-proxy/DNS-SETUP.md`
- **Worker setup**: See `decap-proxy/README.md`

---

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review the full documentation files
3. Check Cloudflare build logs
4. Verify all secrets and URLs are correct

---

**Total deployment time**: ~35 minutes  
**Cost**: Free (on Cloudflare Free plan)  
**Maintenance**: Automatic updates via GitHub commits
