export async function onRequestGet(context) {
  const { request, env } = context;

  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });
  }

  const url = new URL(request.url);
  const siteUrl = env.SITE_URL || "https://stzhang.qzz.io";
  const redirectUri = `${siteUrl}/api/callback`;
  const state = crypto.randomUUID();

  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", clientId);
  githubUrl.searchParams.set("redirect_uri", redirectUri);
  githubUrl.searchParams.set("scope", url.searchParams.get("scope") || "repo");
  githubUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: githubUrl.toString(),
      "Set-Cookie": `oauth_state=${encodeURIComponent(state)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}
