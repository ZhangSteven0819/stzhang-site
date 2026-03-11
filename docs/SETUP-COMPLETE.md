# CMS Setup Completion Guide

## What Was Missing

The repository had the basic structure but was missing several key components to make the CMS work and build the site:

### 1. ✅ Dependencies Not Installed
- **Issue**: `node_modules` directories were missing
- **Fix**: Ran `npm install` in both root and `decap-proxy` directories
- **Result**: All Astro and decap-proxy dependencies are now installed

### 2. ✅ Route Collision in CMS Config
- **Issue**: CMS was configured to manage `src/pages/index.md`, but `src/pages/index.astro` already existed, causing a route collision
- **Fix**: Changed CMS config to manage `src/pages/about.md` instead
- **Result**: No more build warnings, clean build output

### 3. ✅ Missing Content Files
- **Issue**: CMS configuration referenced files that didn't exist
- **Fix**: Created:
  - `src/pages/about.md` - About page managed by CMS
  - `src/pages/blog/` folder - Blog post collection
  - `src/pages/blog/welcome.md` - Sample blog post
- **Result**: CMS can now load and manage content

## Current State

### ✅ Working Components:
1. **Astro Site** - Builds successfully with `npm run build`
2. **Development Server** - Runs with `npm run dev` on http://localhost:4321
3. **CMS Interface** - Accessible at http://localhost:4321/admin/index.html (dev) or https://your-domain.com/admin/ (production)
4. **Content Structure** - Pages and blog collections are configured

### ⚠️ Still Needs Configuration:

#### 1. OAuth Proxy Setup (Required for CMS Authentication)
The CMS backend is configured to use GitHub with an OAuth proxy at `https://decap.soundofsimone.no`.

**What you need to do:**
1. **Create GitHub OAuth App**:
   - Go to https://github.com/settings/developers
   - Create new OAuth App
   - Homepage URL: `https://soundofsimone.no`
   - Callback URL: `https://decap.soundofsimone.no/callback`
   - Save Client ID and Client Secret

2. **Deploy the decap-proxy Worker**:
   ```bash
   cd decap-proxy
   npx wrangler login
   npm run deploy
   ```

3. **Add Environment Variables in Cloudflare**:
   - Go to Cloudflare Dashboard → Workers & Pages → decap-oauth-proxy
   - Settings → Variables → Add secrets:
     - `GITHUB_CLIENT_ID` = Your GitHub OAuth Client ID
     - `GITHUB_CLIENT_SECRET` = Your GitHub OAuth Client Secret

4. **Configure Worker Route**:
   - Update `decap-proxy/wrangler.toml` with your domain:
   ```toml
   route = { pattern = "decap.soundofsimone.no", zone_name = "soundofsimone.no" }
   ```

5. **Set up DNS**:
   - In Cloudflare DNS, use Workers dashboard "Add Custom Domain" feature
   - Add `decap.soundofsimone.no` pointing to the worker
   - See `decap-proxy/DNS-SETUP.md` for details

#### 2. Deploy to Cloudflare Pages
1. Push your code to GitHub (already done)
2. Connect repository to Cloudflare Pages
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Framework preset: Astro

## Testing the Setup

### Local Development (Without OAuth):
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
```
- Visit http://localhost:4321 - Main site
- Visit http://localhost:4321/admin/index.html - CMS interface (login won't work without OAuth)

### Production (With OAuth):
Once deployed with OAuth proxy configured:
1. Visit https://soundofsimone.no/admin/
2. Click "Login with GitHub"
3. Authorize the OAuth app
4. Edit content through the CMS
5. Changes will be committed to your GitHub repository

## Build Verification

Run these commands to verify everything works:

```bash
# Install dependencies
npm install
cd decap-proxy && npm install && cd ..

# Build the site
npm run build

# Check build output
ls -la dist/
ls -la dist/admin/
```

Expected output:
- No build warnings or errors
- `dist/` contains index.html, about/, blog/, and admin/
- `dist/admin/` contains index.html and config.yml

## Next Steps

1. **Complete OAuth Setup** (see section above)
2. **Deploy to Cloudflare Pages**
3. **Customize Content**:
   - Edit `src/pages/about.md`
   - Add blog posts in `src/pages/blog/`
   - Update `public/admin/config.yml` to add more collections
4. **Optional: Add Cloudflare Zero Trust** to secure `/admin` route

## Troubleshooting

### Build fails with "astro: not found"
- Run `npm install` to install dependencies

### Route collision warning
- Make sure you removed `src/pages/index.md`
- Only `src/pages/index.astro` should handle the homepage

### CMS shows "Repo not found" error
- OAuth proxy not configured yet
- Make sure GitHub OAuth app is set up
- Verify environment variables in Cloudflare Worker

### Admin page shows 404
- In development: use `/admin/index.html` instead of `/admin/`
- In production: `/admin/` should work after build

## File Structure

```
sound-of-simone/
├── public/
│   └── admin/
│       ├── config.yml       # CMS configuration
│       └── index.html       # CMS interface
├── src/
│   ├── pages/
│   │   ├── index.astro     # Homepage (Astro component)
│   │   ├── about.md        # About page (CMS-managed)
│   │   └── blog/
│   │       └── welcome.md  # Sample blog post (CMS-managed)
│   ├── components/
│   ├── layouts/
│   └── assets/
├── decap-proxy/             # OAuth proxy for GitHub authentication
│   ├── src/
│   ├── wrangler.toml       # Cloudflare Worker config
│   └── package.json
├── package.json            # Main project dependencies
└── astro.config.mjs       # Astro configuration
```

## Resources

- [Astro Documentation](https://docs.astro.build/)
- [Decap CMS Documentation](https://decapcms.org/docs/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [decap-proxy Setup](./decap-proxy/README.md)
