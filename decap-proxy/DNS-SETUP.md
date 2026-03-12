# DNS Configuration for Decap OAuth Proxy

## Question: Is this DNS configuration correct?

```
Type: A
Name: decap
Content: 192.0.2.1
Proxy status: Proxied
TTL: Auto
```

## Answer: ❌ NO - This is INCORRECT

### Why is this wrong?

1. **192.0.2.1 is a documentation IP address** (RFC 5737) - it's not a real, routable IP address
2. **Cloudflare Workers don't use manual DNS A/AAAA records** - they use their own internal routing system
3. **This approach will not work** - traffic won't reach your worker

### ✅ Correct Setup Method

For Cloudflare Workers with custom domains, you should **NEVER** manually create DNS records. Instead:

#### Step-by-Step:

1. **Deploy your worker first**:
   ```bash
   cd decap-proxy
   npm run deploy
   ```

2. **Add custom domain via Workers dashboard**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Workers & Pages** → **decap-oauth-proxy**
   - Go to **Settings** → **Domains & Routes**
   - Click **"Add Custom Domain"**
   - Enter: `decap.soundofsimone.no`
   - Click **"Add Custom Domain"**

3. **Cloudflare handles everything automatically**:
   - Creates necessary DNS records
   - Configures SSL/TLS certificates
   - Sets up routing to your worker

### What happens behind the scenes?

When you add a custom domain via the Workers dashboard, Cloudflare automatically:

1. Creates a DNS record (usually AAAA record pointing to Cloudflare's worker infrastructure)
2. The record will show as **Proxied** (orange cloud)
3. Cloudflare's edge network routes requests to your worker
4. SSL/TLS is automatically configured

### Verification

After adding the custom domain (wait 2-5 minutes), verify it works:

```bash
# Test the worker is responding
curl https://decap.soundofsimone.no
# Expected output: "OAuth Proxy for Decap CMS"

# Test the auth endpoint
curl -I https://decap.soundofsimone.no/auth
# Expected: HTTP 302 redirect to GitHub
```

### What if I already created the wrong DNS record?

1. Go to **DNS** → **Records** in Cloudflare dashboard
2. Delete any manually created records for `decap` subdomain
3. Follow the correct setup method above
4. Let Cloudflare create the records automatically via Workers dashboard

## Summary

| Approach | Correct? | Method |
|----------|----------|--------|
| Manual A record with 192.0.2.1 | ❌ NO | Don't do this |
| Manual A record with any IP | ❌ NO | Don't do this |
| Manual AAAA record | ❌ NO | Don't do this manually |
| Add custom domain in Workers dashboard | ✅ YES | This is the only correct way |

**Always use the Workers dashboard to add custom domains. Never manually create DNS records for Workers.**
