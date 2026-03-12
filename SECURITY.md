# 🔒 Security Notes

## Overview

This document tracks security considerations for the Sound of Simone project.

## Current Status

### Main Project (Astro Site)
✅ **No vulnerabilities** in production dependencies

```bash
npm audit --omit=dev
# found 0 vulnerabilities
```

### OAuth Proxy (decap-proxy)
⚠️ **4 moderate vulnerabilities** in development dependencies

**Affected packages:**
- `esbuild` (<=0.24.2)
- `wrangler` (<=4.24.3) 
- `undici` (<6.23.0)
- `miniflare` (multiple versions)

**Status:** These vulnerabilities only affect the development/build environment, not production runtime.

**Details:**
1. **esbuild vulnerability** (GHSA-67mh-4wv8-2f99)
   - Severity: Moderate
   - Impact: Development server only
   - Production Impact: None (dev-time only)
   - Fix: Available but requires breaking changes to wrangler@4.66.0

2. **undici vulnerability** (GHSA-g9mf-h72j-4rw9)
   - Severity: Moderate
   - Impact: Unbounded decompression in Node.js Fetch API
   - Production Impact: None (dev-time only)
   - Fix: Available but requires breaking changes to wrangler@4.66.0

**Recommendation:** 
- Monitor for stable wrangler update without breaking changes
- These dev dependencies do not affect the deployed Cloudflare Worker
- The Worker runs on Cloudflare's runtime, not Node.js

## Security Best Practices

### Secrets Management

✅ **Properly configured:**
- OAuth credentials stored as Cloudflare Worker secrets (encrypted)
- GitHub secrets used for CI/CD (encrypted)
- No secrets in source code
- `.env` files excluded in `.gitignore`

### Authentication & Authorization

✅ **OAuth Proxy Configuration:**
- Uses GitHub OAuth for authentication
- OAuth credentials stored securely in Cloudflare
- Callback URL restricted to `https://decap.soundofsimone.no/callback`
- Scopes limited to repository access only

### CORS Configuration

✅ **Cloudflare Worker:**
- CORS headers properly configured in `decap-proxy/src/index.ts`
- Restricted to specific origins (configured in `public/admin/config.yml`)

### Content Security

✅ **CMS Configuration:**
- GitHub backend requires authenticated access
- All content changes tracked in Git
- Content review via pull requests (if configured)

## Deployment Security Checklist

When deploying to production:

- [ ] GitHub OAuth app configured with correct callback URL
- [ ] Worker secrets properly set in Cloudflare Dashboard
  - [ ] `GITHUB_CLIENT_ID`
  - [ ] `GITHUB_CLIENT_SECRET`
- [ ] Custom domains configured with SSL/TLS
- [ ] Cloudflare Zero Trust configured (optional but recommended)
- [ ] Repository access limited to authorized users
- [ ] Regular dependency updates scheduled

## Monitoring

### Regular Security Checks

Run security audits periodically:

```bash
# Main project
npm audit --omit=dev

# OAuth proxy
cd decap-proxy && npm audit
```

### Update Strategy

1. **Production dependencies:** Update immediately for security patches
2. **Development dependencies:** Update with caution, test thoroughly
3. **Breaking changes:** Review changelog, test in staging first

## Cloudflare Security Features

The deployed application benefits from Cloudflare's built-in security:

- ✅ DDoS protection
- ✅ SSL/TLS encryption
- ✅ Web Application Firewall (WAF) available
- ✅ Rate limiting available
- ✅ Bot management available
- ✅ Zero Trust access control (optional)

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Contact the repository owner directly
3. Provide details of the vulnerability
4. Allow time for a fix before public disclosure

## Additional Resources

- [Cloudflare Security Documentation](https://developers.cloudflare.com/fundamentals/basic-tasks/protect-your-site-from-abuse/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Decap CMS Security](https://decapcms.org/docs/security/)
- [Astro Security](https://docs.astro.build/en/guides/security/)

---

**Last Updated:** 2026-02-17  
**Next Review:** Check for wrangler updates without breaking changes
