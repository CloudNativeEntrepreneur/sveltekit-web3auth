import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post =
  (clientSecret, issuer): RequestHandler<Locals, FormData> =>
  async (request) => {
    const cookie = `userInfo=${JSON.stringify({
      userid: null,
      user: null,
      refreshToken: null,
    })};`;

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
