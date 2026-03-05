# Decap CMS OAuth Proxy Worker

This Cloudflare Worker handles GitHub OAuth authentication for Decap CMS.

## Setup

### 1. Create a GitHub OAuth Application

Go to https://github.com/settings/developers/new and create a new OAuth App:

- **Application name**: Sound of Simone CMS
- **Homepage URL**: `https://soundofsimone.no`
- **Authorization callback URL**: `https://decap.soundofsimone.no/callback`

After creation, note down your **Client ID** and **Client Secret**.

### 2. Install dependencies

```bash
cd decap-proxy
npm install
```

### 3. Configure secrets

```bash
npx wrangler secret put GITHUB_CLIENT_ID
# Paste your GitHub OAuth App Client ID

npx wrangler secret put GITHUB_CLIENT_SECRET
# Paste your GitHub OAuth App Client Secret
```

### 4. Deploy the worker

```bash
npm run deploy
```

This will deploy the worker to Cloudflare. After deployment, note the worker URL (e.g., `decap-oauth-proxy.your-subdomain.workers.dev`).

### 5. Set up custom domain

**IMPORTANT**: Do NOT manually create DNS records for the worker subdomain. Instead, add the custom domain directly in the Cloudflare Workers dashboard:

#### Steps:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > **decap-oauth-proxy**
3. Go to **Settings** > **Domains & Routes**
4. Click **Add Custom Domain**
5. Enter: `decap.soundofsimone.no`
6. Click **Add Custom Domain**

Cloudflare will automatically:
- Create the necessary DNS records
- Configure SSL/TLS certificates
- Route traffic to your worker

**Wait 2-5 minutes** for DNS propagation and SSL certificate provisioning.

#### Verification:

After setup, verify the worker is accessible:

```bash
curl https://decap.soundofsimone.no
# Should return: "OAuth Proxy for Decap CMS"
```

## Testing Locally

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`.

## Environment Variables

- `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID (secret)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App Client Secret (secret)
- `ALLOWED_ORIGINS` - comma-separated allowlist for OAuth origin checks (non-secret var)

## Troubleshooting

### ❌ Common Mistake: Manual DNS Configuration

**DO NOT** create manual DNS records like this:

```
Type: A
Name: decap
Content: 192.0.2.1 (or any IP address)
Proxy: Enabled
```

This approach will NOT work for Cloudflare Workers. The IP address (like 192.0.2.1) is just a documentation example and won't route to your worker.

### ✅ Correct Approach

Always use the **"Add Custom Domain"** feature in the Workers dashboard as described in step 5 above. This automatically handles all DNS routing and configuration.

### DNS Record Verification

After adding the custom domain via the Workers dashboard, you can verify the DNS records:

1. Go to **DNS** > **Records** in your Cloudflare dashboard
2. Look for a record with:
   - Type: `AAAA` (or `A`)
   - Name: `decap`
   - Content: Cloudflare's worker IP (managed automatically)
   - Proxy status: `Proxied` (orange cloud)

These records are created and managed automatically by Cloudflare when you add a custom domain to a Worker.

### Other Issues


### Cloudflare Worker exceptions (Error 1101 / runtime exceptions)

This worker now returns structured JSON errors (with `traceId` from the `cf-ray` header when available) instead of failing silently on unhandled exceptions.

If you see intermittent Worker failures:

1. Open Cloudflare Worker logs and search by `traceId`.
2. Correlate with the failing request path (`/auth` or `/callback`).
3. Use the returned `error` and `message` fields to isolate whether it is:
   - origin rejection,
   - missing OAuth secrets,
   - provider denial,
   - GitHub token endpoint/network issue,
   - or an unhandled exception.


**Error: "Missing GITHUB_CLIENT_ID"**
- Verify secrets were set correctly: `npx wrangler secret list`
- Redeploy the worker: `npm run deploy`

**Error: "Failed to obtain access token"**
- Verify the GitHub OAuth App callback URL matches: `https://decap.soundofsimone.no/callback`
- Check that the OAuth App has not been suspended

**CORS errors**
- Verify your main site URL (`https://soundofsimone.no`) is correctly set in the worker code
- Check browser console for specific error messages
