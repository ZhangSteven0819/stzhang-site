interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_ORIGINS?: string;
  DEV_ORIGIN_REGEX?: string;
}

const defaultAllowedOrigins = [
  "http://localhost:4321",
  "http://127.0.0.1:4321"
];
const DEFAULT_DEV_ORIGIN_REGEX = "^https://([a-z0-9-]+\\.)?[a-z0-9-]+-dev\\.pages\\.dev$";

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "");
}

function getAllowedOrigins(env: Env): Set<string> {
  const fromEnv = env.ALLOWED_ORIGINS?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const values = fromEnv && fromEnv.length > 0 ? fromEnv : defaultAllowedOrigins;
  return new Set(values.map(normalizeOrigin));
}

function getDevOriginRegex(env: Env): RegExp | null {
  const configured = env.DEV_ORIGIN_REGEX?.trim();
  const pattern = configured && configured.length > 0 ? configured : DEFAULT_DEV_ORIGIN_REGEX;

  try {
    return new RegExp(pattern);
  } catch {
    return new RegExp(DEFAULT_DEV_ORIGIN_REGEX);
  }
}

function isAllowedOrigin(origin: string, allowedOrigins: Set<string>, devOriginRegex: RegExp | null): boolean {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  if (!devOriginRegex) return false;
  return devOriginRegex.test(origin);
}

function withHostname(origin: string, hostname: string): string {
  const parsed = new URL(origin);
  parsed.hostname = hostname;
  return normalizeOrigin(parsed.toString());
}

function getWwwVariants(origin: string): { nonWww: string; www: string } | null {
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;
    const localhostLike = hostname === "localhost" || hostname === "127.0.0.1";
    if (localhostLike) return null;

    const labels = hostname.split(".");
    const startsWithWww = hostname.startsWith("www.");
    const isLikelyApexOrWwwApex = startsWithWww || labels.length === 2;
    if (!isLikelyApexOrWwwApex) return null;

    const rootHost = startsWithWww ? hostname.slice(4) : hostname;
    return {
      nonWww: withHostname(origin, rootHost),
      www: withHostname(origin, `www.${rootHost}`)
    };
  } catch {
    return null;
  }
}

function canonicalizeAllowedOrigin(origin: string, allowedOrigins: Set<string>): string {
  const variants = getWwwVariants(origin);
  if (!variants) return origin;

  const { nonWww, www } = variants;
  if (allowedOrigins.has(nonWww) && allowedOrigins.has(www)) {
    return nonWww;
  }

  return origin;
}

function getPostMessageOrigins(origin: string): string[] {
  const normalized = normalizeOrigin(origin);
  const variants = getWwwVariants(normalized);
  if (!variants) {
    return [normalized];
  }

  const values = new Set<string>();
  // Prefer non-www first to avoid soundofsimone.no <-> www mismatch loops.
  values.add(variants.nonWww);
  values.add(variants.www);
  values.add(normalized);
  return [...values];
}

function resolveOrigin(request: Request, url: URL): string {
  const siteId = url.searchParams.get("site_id");
  const queryOrigin = url.searchParams.get("origin");
  const headerOrigin = request.headers.get("Origin");

  if (siteId) {
    const normalizedSiteId = siteId.trim();
    if (!normalizedSiteId) return "";

    if (normalizedSiteId.startsWith("http://") || normalizedSiteId.startsWith("https://")) {
      return normalizeOrigin(normalizedSiteId);
    }

    const localhostLike =
      normalizedSiteId.startsWith("localhost") || normalizedSiteId.startsWith("127.0.0.1");
    const protocol = localhostLike ? "http://" : "https://";
    return normalizeOrigin(`${protocol}${normalizedSiteId}`);
  }
  if (queryOrigin) {
    return normalizeOrigin(queryOrigin);
  }
  if (headerOrigin) {
    return normalizeOrigin(headerOrigin);
  }
  return "";
}

function getCorsHeaders(origin: string): HeadersInit {
  if (!origin) {
    return { Vary: "Origin" };
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

function buildErrorResponse(
  message: string,
  status: number,
  origin: string,
  details?: Record<string, unknown>
): Response {
  return jsonResponse(
    {
      error: message,
      ...(details ?? {})
    },
    status,
    getCorsHeaders(origin)
  );
}

function htmlResponse(html: string, headers?: HeadersInit): Response {
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...headers
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const allowedOrigins = getAllowedOrigins(env);
    const devOriginRegex = getDevOriginRegex(env);
    const origin = resolveOrigin(request, url);
    const traceId = request.headers.get("cf-ray") ?? "unknown";

    try {
      if (request.method !== "GET" && request.method !== "OPTIONS" && request.method !== "HEAD") {
        return buildErrorResponse("Method not allowed", 405, origin, {
          traceId
        });
      }

      if (request.method === "OPTIONS") {
        if (!isAllowedOrigin(origin, allowedOrigins, devOriginRegex)) {
          return new Response("Forbidden", { status: 403 });
        }

        return new Response(null, {
          status: 204,
          headers: getCorsHeaders(origin)
        });
      }

      if (url.pathname === "/health") {
        if (request.method === "HEAD") {
          return new Response(null, {
            status: 200,
            headers: getCorsHeaders(origin)
          });
        }

        return jsonResponse({ ok: true }, 200, getCorsHeaders(origin));
      }

      if (url.pathname === "/auth") {
        if (!isAllowedOrigin(origin, allowedOrigins, devOriginRegex)) {
          return buildErrorResponse("Forbidden origin", 403, "", {
            traceId,
            ...(origin ? { rejectedOrigin: origin } : {})
          });
        }

        const authOrigin = canonicalizeAllowedOrigin(origin, allowedOrigins);

        if (!env.GITHUB_CLIENT_ID) {
          return buildErrorResponse("Missing GITHUB_CLIENT_ID", 500, origin, { traceId });
        }

        const callbackUrl = new URL("/callback", url.origin);

        const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
        githubAuthUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
        githubAuthUrl.searchParams.set("redirect_uri", callbackUrl.toString());
        githubAuthUrl.searchParams.set("scope", "repo");
        githubAuthUrl.searchParams.set("state", authOrigin);

        return htmlResponse(
          `<!doctype html>
<html lang="en">
  <body>
    <script>
      (function () {
        const authOrigin = ${JSON.stringify(authOrigin)};
        const authorizeUrl = ${JSON.stringify(githubAuthUrl.toString())};
        const authorizingMessage = "authorizing:github";
        let redirected = false;

        const redirectToGithub = () => {
          if (redirected) return;
          redirected = true;
          window.location.assign(authorizeUrl);
        };

        if (window.opener) {
          window.addEventListener("message", (event) => {
            if (event.origin !== authOrigin) return;
            if (event.data !== authorizingMessage) return;
            redirectToGithub();
          });

          try {
            window.opener.postMessage(authorizingMessage, authOrigin);
          } catch {
            // Ignore and rely on timeout fallback.
          }
        }

        // Fallback for manual opens or blocked opener handshake.
        setTimeout(redirectToGithub, 1500);
      })();
    </script>
  </body>
</html>`,
          getCorsHeaders(authOrigin)
        );
      }

      if (url.pathname === "/callback") {
        const rawCallbackOrigin = normalizeOrigin(
          url.searchParams.get("state") ?? url.searchParams.get("origin") ?? ""
        );
        const callbackOrigin = canonicalizeAllowedOrigin(rawCallbackOrigin, allowedOrigins);
        if (!isAllowedOrigin(callbackOrigin, allowedOrigins, devOriginRegex)) {
          return buildErrorResponse("Forbidden callback origin", 403, "", {
            traceId,
            ...(callbackOrigin ? { rejectedOrigin: callbackOrigin } : {})
          });
        }

        const providerError = url.searchParams.get("error");
        if (providerError) {
          return buildErrorResponse("GitHub OAuth denied", 400, callbackOrigin, {
            traceId,
            providerError
          });
        }

        const code = url.searchParams.get("code");
        if (!code) {
          return buildErrorResponse("Missing OAuth code", 400, callbackOrigin, { traceId });
        }

        if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
          return buildErrorResponse("Missing GitHub OAuth credentials", 500, callbackOrigin, {
            traceId
          });
        }

        let tokenResponse: Response;
        try {
          tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              client_id: env.GITHUB_CLIENT_ID,
              client_secret: env.GITHUB_CLIENT_SECRET,
              code
            })
          });
        } catch (error) {
          return buildErrorResponse("GitHub token endpoint unreachable", 502, callbackOrigin, {
            traceId,
            message: error instanceof Error ? error.message : "unknown"
          });
        }
        const tokenJson = (await tokenResponse.json()) as {
          access_token?: string;
          error?: string;
          error_description?: string;
        };

        if (!tokenResponse.ok || !tokenJson.access_token) {
          return buildErrorResponse(tokenJson.error ?? "oauth_error", 502, callbackOrigin, {
            traceId,
            message: tokenJson.error_description ?? "GitHub token exchange failed"
          });
        }

        const postMessageOrigins = getPostMessageOrigins(callbackOrigin);

        return htmlResponse(
          `<!doctype html>
<html lang="en">
  <body>
    <script>
      (function () {
        const targetOrigins = ${JSON.stringify(postMessageOrigins)};
        const traceId = ${JSON.stringify(traceId)};
        const token = ${JSON.stringify(tokenJson.access_token)};
        const payload = { token: token };
        const message = "authorization:github:success:" + JSON.stringify(payload);
        let posted = false;

        if (window.opener) {
          for (const origin of targetOrigins) {
            try {
              window.opener.postMessage(message, origin);
              posted = true;
              break;
            } catch (error) {
              // Continue trying other allowed origins.
            }
          }

          if (!posted) {
            try {
              // Fallback for strict origin mismatches where opener exists but origin
              // differs due host canonicalization or auth redirects.
              window.opener.postMessage(message, "*");
              posted = true;
            } catch (error) {
              // Keep fallback page below if wildcard send also fails.
            }
          }
        }

        if (posted) {
          window.close();
          return;
        }

        document.body.innerHTML = "<main style='font-family: sans-serif; max-width: 40rem; margin: 3rem auto; line-height: 1.4;'>" +
          "<h1>Authentication completed</h1>" +
          "<p>Could not send OAuth token to the CMS window. Return to the CMS tab and retry login.</p>" +
          "<p><strong>traceId:</strong> " + traceId + "</p>" +
          "<p><strong>Expected origin(s):</strong> " + targetOrigins.join(", ") + "</p>" +
          "</main>";
      })();
    </script>
  </body>
</html>`,
          getCorsHeaders(callbackOrigin)
        );
      }

      return buildErrorResponse("Not found", 404, origin, { traceId });
    } catch (error) {
      return buildErrorResponse("Unhandled worker exception", 500, origin, {
        traceId,
        message: error instanceof Error ? error.message : "unknown"
      });
    }
  }
};
