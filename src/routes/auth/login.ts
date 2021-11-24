import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

const clientSecret = import.meta.env.VITE_WEB3_AUTH_CLIENT_SECRET
const issuer = import.meta.env.VITE_WEB3_AUTH_ISSUER

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
  const clientId = (request.body as any).clientId
  const publicAddress = (request.body as any).publicAddress
  const signature = (request.body as any).signature
  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`

  console.log('POST /auth/login', { Authorization })
  let auth
  const createAuthSessionFetch = await fetch(`${issuer}/api/auth`, {
    body: JSON.stringify({ publicAddress, signature }),
    headers: {
      Authorization,
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (createAuthSessionFetch.ok) {
    auth = await createAuthSessionFetch.json()
  }

  const user = JSON.parse(atob(auth.idToken.split(".")[1]).toString());
  delete user.aud
  delete user.exp
  delete user.iat
  delete user.iss
  delete user.sub
  delete user.typ
  
  const cookie = `userInfo=${JSON.stringify({
    userid: user.publicAddress,
    user,
    refreshToken: auth.refreshToken,
  })};`;

  const response = {
    body: JSON.stringify(auth),
    headers: {
      "Set-Cookie": `${cookie}; SameSite=Lax; HttpOnly;`,
    },
  };

  request.locals.userid = user.publicAddress;
  request.locals.user = user;
  request.locals.accessToken = auth.accessToken;
  request.locals.refreshToken = auth.refreshToken;

  return response;
};
