import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
  const { auth } = request.body as any;
  const user = JSON.parse(
    atob(auth.accessToken.token.split(".")[1]).toString()
  );
  console.log("auth/set_token", { user });

  let cookie = `userInfo=${JSON.stringify({
    userid: user.publicAddress,
    user,
    refresh_token: auth.refreshToken.token,
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
  request.locals.access_token = auth.accessToken.token;
  request.locals.refresh_token = auth.refreshToken.token;

  return response;
};
