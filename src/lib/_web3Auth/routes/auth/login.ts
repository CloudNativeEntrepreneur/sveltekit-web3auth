import { createAuthSession } from "$lib/_web3Auth/auth-api";
import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post =
  (clientSecret, issuer): RequestHandler<Locals, FormData> =>
  async (request) => {
    const clientId = (request.body as any).clientId;
    const publicAddress = (request.body as any).publicAddress;
    const signature = (request.body as any).signature;

    const auth = await createAuthSession(
      issuer,
      clientId,
      clientSecret,
      publicAddress,
      signature
    );

    const user = JSON.parse(atob(auth.idToken.split(".")[1]).toString());
    delete user.aud;
    delete user.exp;
    delete user.iat;
    delete user.iss;
    delete user.sub;
    delete user.typ;

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