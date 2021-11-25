import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";
import { endAuthSession } from "$lib/_web3Auth/auth-api";
import { parseCookie } from "$lib";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post =
  (clientSecret, issuer): RequestHandler<Locals, FormData> =>
  async (request) => {
    const clientId = (request.body as any).clientId;
    const cookie: any = parseCookie(request.headers.cookie);
    const { userInfo } = cookie;
    const user = JSON.parse(userInfo);
    const publicAddress = user.userid;

    const auth = await endAuthSession({
      issuer,
      clientId,
      clientSecret,
      publicAddress,
    });

    const response = {
      body: {},
    };

    // Cookie is set based on locals value in next step
    request.locals.userid = null;
    request.locals.user = null;
    request.locals.accessToken = null;
    request.locals.refreshToken = null;

    return response;
  };
