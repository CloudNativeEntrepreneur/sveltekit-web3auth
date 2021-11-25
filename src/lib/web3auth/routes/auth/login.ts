import jwt from "jsonwebtoken";
import { createAuthSession } from "$lib/web3auth/auth-api";
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

    const user = jwt.verify(auth.idToken, clientSecret);
    delete user.aud;
    delete user.exp;
    delete user.iat;
    delete user.iss;
    delete user.sub;
    delete user.typ;

    const response = {
      body: {
        ...auth,
      },
    };

    // Cookie is set based on locals value in next step
    request.locals.userid = user.publicAddress;
    request.locals.user = user;
    request.locals.accessToken = auth.accessToken;
    request.locals.refreshToken = auth.refreshToken;

    return response;
  };
