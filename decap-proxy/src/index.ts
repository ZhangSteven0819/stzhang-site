interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_ORIGINS?: string;
}

const defaultAllowedOrigins = [
  "https://soundofsimone.no",
  "https://www.soundofsimone.no",
  "http://localhost:4321"
];

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

function resolveOrigin(request: Request, url: URL): string {
  const queryOrigin = url.searchParams.get("origin");
  const headerOrigin = request.headers.get("Origin");

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
    const origin = resolveOrigin(request, url);
    const traceId = request.headers.get("cf-ray") ?? "unknown";

    try {
      if (request.method !== "GET" && request.method !== "OPTIONS") {
        return buildErrorResponse("Method not allowed", 405, origin, {
          traceId
        });
      }

      if (request.method === "OPTIONS") {
        if (!origin || !allowedOrigins.has(origin)) {
          return new Response("Forbidden", { status: 403 });
        }

        return new Response(null, {
          status: 204,
          headers: getCorsHeaders(origin)
        });
      }

      if (url.pathname === "/health") {
        return jsonResponse({ ok: true }, 200, getCorsHeaders(origin));
      }

      if (url.pathname === "/auth") {
        if (!origin || !allowedOrigins.has(origin)) {
          return buildErrorResponse("Forbidden origin", 403, origin, { traceId });
        }

        if (!env.GITHUB_CLIENT_ID) {
          return buildErrorResponse("Missing GITHUB_CLIENT_ID", 500, origin, { traceId });
        }

        const callbackUrl = new URL("/callback", url.origin);
        callbackUrl.searchParams.set("origin", origin);

        const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
        githubAuthUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
        githubAuthUrl.searchParams.set("redirect_uri", callbackUrl.toString());
        githubAuthUrl.searchParams.set("scope", "repo");

        return Response.redirect(githubAuthUrl.toString(), 302);
      }

      if (url.pathname === "/callback") {
        const callbackOrigin = normalizeOrigin(url.searchParams.get("origin") ?? "");
        if (!callbackOrigin || !allowedOrigins.has(callbackOrigin)) {
          return buildErrorResponse("Forbidden callback origin", 403, callbackOrigin, { traceId });
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

        return htmlResponse(
          `<!doctype html>
<html lang="en">
  <body>
    <script>
      (function () {
        const targetOrigin = ${JSON.stringify(callbackOrigin)};
        const token = ${JSON.stringify(tokenJson.access_token)};
        if (window.opener) {
          window.opener.postMessage("authorization:github:success:" + token, targetOrigin);
        }
        window.close();
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
