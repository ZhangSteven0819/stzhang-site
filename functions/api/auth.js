export async function onRequest(context) {
  const { request, env } = context;

  const clientId = env.GITHUB_CLIENT_ID;
  const url = new URL(request.url);

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", `${url.origin}/api/callback`);
  githubAuthUrl.searchParams.set("scope", "repo");

  return Response.redirect(githubAuthUrl.toString(), 302);
}
