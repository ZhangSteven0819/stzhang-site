function renderCallbackPage(status, content) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Authentication complete</title>
  </head>
  <body style="background:#0d0f0f;color:#f0eeeb;font-family:system-ui,sans-serif;padding:32px;">
    <p>Authentication complete. This window should close automatically.</p>

    <script>
      (function () {
        var content = ${JSON.stringify(content)};
        var status = ${JSON.stringify(status)};
        var payload = "authorization:github:" + status + ":" + JSON.stringify(content);
        var attempts = 0;

        function sendAuthorization(origin) {
          if (!window.opener || window.opener.closed) return;

          try {
            window.opener.postMessage(payload, origin || "*");
          } catch (error) {
            window.opener.postMessage(payload, "*");
          }
        }

        function finishSoon() {
          window.setTimeout(function () {
            try {
              window.close();
            } catch (error) {}
          }, 900);
        }

        if (window.opener) {
          window.addEventListener("message", function (message) {
            sendAuthorization(message.origin);
            finishSoon();
          }, false);

          window.opener.postMessage("authorizing:github", "*");
          sendAuthorization("*");

          var interval = window.setInterval(function () {
            attempts += 1;
            sendAuthorization("*");

            if (attempts >= 12) {
              window.clearInterval(interval);
              finishSoon();
            }
          }, 250);
        } else {
          document.body.innerHTML = "<p>Authentication finished, but this window lost connection to the CMS window. Close this window and try again from /admin.</p>";
        }
      })();
    </script>
  </body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(
      renderCallbackPage("error", {
        message: "Missing GitHub authorization code.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const siteUrl = url.origin;

  if (!clientId || !clientSecret) {
    return new Response(
      renderCallbackPage("error", {
        message: "Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "stzhang-decap-cms",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${siteUrl}/api/callback`,
    }),
  });

  const result = await response.json();

  if (!response.ok || result.error || !result.access_token) {
    return new Response(
      renderCallbackPage("error", {
        message: result.error_description || result.error || "GitHub token exchange failed.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }

  return new Response(
    renderCallbackPage("success", {
      token: result.access_token,
      provider: "github",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  );
}
