import { renewWeb3AuthToken, parseCookie } from "$lib";

import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

const issuer = `${import.meta.env.VITE_WEB3_AUTH_ISSUER}`;
const clientId = `${import.meta.env.VITE_WEB3_AUTH_CLIENT_ID}`;
const clientSecret =
  process.env.VITE_WEB3_AUTH_CLIENT_SECRET ||
  import.meta.env.VITE_WEB3_AUTH_CLIENT_SECRET;
/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
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
