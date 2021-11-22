import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
  const { auth } = request.body as any;
  const user = JSON.parse(atob(auth.accessToken.split(".")[1]).toString());
  console.log("auth/login", { user });

  const cookie = `userInfo=${JSON.stringify({
    userid: user.publicAddress,
    user,
    refreshToken: auth.refreshToken,
  })};`;

  const response = {
    body: {
      status: "success",
    },
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
