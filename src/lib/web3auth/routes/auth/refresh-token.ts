import type { RequestEvent } from "@sveltejs/kit";
import { renewWeb3AuthToken } from "../../auth-api";
import { parseCookie } from "../../cookie";
import { setRequestLocalsFromNewTokens } from "../../server-utils";
import debug from "debug";

const log = debug("sveltekit-web3auth:/auth/refresh-token");

export const post = (clientSecret, issuer) => async (event: RequestEvent) => {
  const { request } = event;
  const body: any = await request.json();
  const clientId = body.clientId;
  const cookie: any = parseCookie(request.headers.get("cookie"));
  const { userInfo } = cookie;
  const user = JSON.parse(userInfo);

  const auth = await renewWeb3AuthToken(
    user.refreshToken,
    issuer,
    clientId,
    clientSecret
  );

  setRequestLocalsFromNewTokens(event, auth);

  const response = {
    body: {
      ...auth,
    },
  };

  return response;
};
