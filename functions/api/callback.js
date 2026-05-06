function renderBody(status, content) {
  return `
    <script>
      const receiveMessage = (message) => {
        window.opener.postMessage(
          'authorization:github:${status}:${JSON.stringify(content)}',
          message.origin
        );
        window.removeEventListener("message", receiveMessage, false);
      }

      window.addEventListener("message", receiveMessage, false);

      window.opener.postMessage("authorizing:github", "*");
    </script>
  `;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  const code = url.searchParams.get("code");

  const tokenRes = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: context.env.GITHUB_CLIENT_ID,
        client_secret: context.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const data = await tokenRes.json();

  return new Response(
    renderBody("success", {
      token: data.access_token,
      provider: "github",
    }),
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
