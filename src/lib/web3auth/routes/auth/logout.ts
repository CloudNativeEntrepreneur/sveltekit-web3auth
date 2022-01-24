import type { RequestEvent } from "@sveltejs/kit";
import { endAuthSession } from "../../auth-api";
import { parseCookie } from "../../cookie";
import debug from "debug";

const log = debug("sveltekit-web3auth:/auth/logout");

export const post = (clientSecret, issuer) => async (event: RequestEvent) => {
  log("logging out");
  const { request } = event;
  const body: any = await request.json();
  const clientId = body.clientId;
  const cookie: any = parseCookie(request.headers.get("cookie"));
  const { userInfo } = cookie;
  const user = JSON.parse(userInfo);
  const address = user.userid;

  log("logging out", { clientId, address });

  const auth = await endAuthSession({
    issuer,
    clientId,
    clientSecret,
    address,
  });

  log("logged out", { clientId, address });

  const response = {
    body: {},
  };

  // Cookie is set based on locals value in next step
  event.locals.userid = null;
  event.locals.user = null;
  event.locals.accessToken = null;
  event.locals.refreshToken = null;

  return response;
};
