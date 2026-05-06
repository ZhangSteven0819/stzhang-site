export async function onRequest(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;

  const redirectUri =
    `${new URL(context.request.url).origin}/api/callback`;

  const githubUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=repo` +
    `&redirect_uri=${redirectUri}`;

  return Response.redirect(githubUrl, 302);
}
