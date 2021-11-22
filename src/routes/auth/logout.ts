import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
  console.log("/auth/logout");
  const cookie = `userInfo=${JSON.stringify({
    userid: null,
    user: null,
    refreshToken: null,
  })};`;

  const response = {
    body: {
      status: "success",
    },
    headers: {
      "Set-Cookie": `${cookie}; SameSite=Lax; HttpOnly;`,
    },
  };

  request.locals.userid = null;
  request.locals.user = null;
  request.locals.accessToken = null;
  request.locals.refreshToken = null;
  return response;
};
