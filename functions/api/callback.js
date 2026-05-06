function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
}

function errorPage(message) {
  const safeMessage = JSON.stringify(message);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Authentication failed</title>
  </head>
  <body style="font-family: system-ui, sans-serif; padding: 32px;">
    <h1>Authentication failed</h1>
    <p>${message}</p>

    <script>
      (function () {
        var message = ${safeMessage};

        if (window.opener) {
          window.opener.postMessage(
            "authorization:github:error:" + JSON.stringify({ message: message }),
            "*"
          );
        }
      })();
    </script>
  </body>
</html>`;
}

function successPage(token) {
  const payload = JSON.stringify({
    token,
    provider: "github",
  });

  const message = "authorization:github:success:" + payload;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Authentication complete</title>
  </head>
  <body style="font-family: system-ui, sans-serif; padding: 32px;">
    <p>Authentication complete. You can close this window.</p>

    <script>
      (function () {
        var message = ${JSON.stringify(message)};

        function sendMessage(origin) {
          if (!window.opener) {
            document.body.innerHTML = "<p>Authentication complete. Please close this window and return to the CMS.</p>";
            return;
          }

          window.opener.postMessage(message, origin || "*");

          setTimeout(function () {
            window.close();
          }, 300);
        }

        window.addEventListener("message", function (event) {
          sendMessage(event.origin);
        });

        window.opener && window.opener.postMessage("authorizing:github", "*");

        setTimeout(function () {
          sendMessage("*");
        }, 500);
      })();
    </script>
  </body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const savedState = getCookie(request, "oauth_state");

  if (!code) {
    return htmlResponse(errorPage("Missing GitHub authorization code."), 400);
  }

  if (savedState && returnedState && savedState !== returnedState) {
    return htmlResponse(errorPage("Invalid OAuth state. Please try logging in again."), 400);
  }

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return htmlResponse(
      errorPage("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in Cloudflare environment variables."),
      500
    );
  }

  const siteUrl = env.SITE_URL || "https://stzhang.qzz.io";
  const redirectUri = `${siteUrl}/api/callback`;

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "stzhang-decap-cms",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    const detail = tokenData.error_description || tokenData.error || "GitHub token exchange failed.";
    return htmlResponse(errorPage(detail), 500);
  }

  return htmlResponse(successPage(tokenData.access_token));
}
