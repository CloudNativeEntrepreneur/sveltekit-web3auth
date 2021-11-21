import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
  const { auth } = request.body as any;
  const user = JSON.parse(
    atob(auth.accessToken.split(".")[1]).toString()
  );
  console.log("auth/login", { user });

  let cookie = `userInfo=${JSON.stringify({
    userid: user.publicAddress,
    user,
    refresh_token: auth.refreshToken,
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
  request.locals.access_token = auth.accessToken;
  request.locals.refresh_token = auth.refreshToken;

  return response;
};
