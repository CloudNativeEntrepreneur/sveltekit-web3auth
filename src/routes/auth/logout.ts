import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
  console.log("/auth/logout");
  let cookie = `userInfo=${JSON.stringify({
    userid: null,
    user: null,
    refresh_token: null,
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
  request.locals.access_token = null;
  request.locals.refresh_token = null;
  return response;
};
