import { renewWeb3AuthToken, parseCookie } from "$lib";

import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";
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

    const data = await renewWeb3AuthToken(
      user.refreshToken,
      issuer,
      clientId,
      clientSecret
    );

    const response = {
      body: {
        ...data,
      },
    };

    return response;
  };
