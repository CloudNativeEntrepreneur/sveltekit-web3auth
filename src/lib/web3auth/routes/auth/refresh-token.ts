import type { Locals } from "../../../types";
import type { RequestHandler } from "@sveltejs/kit";
import { renewWeb3AuthToken } from "../../auth-api";
import { parseCookie } from "../../cookie";
import { setRequestLocalsFromNewTokens } from "../../server-utils";

export const post =
  (clientSecret, issuer): RequestHandler<Locals, FormData> =>
  async (request) => {
    const clientId = (request.body as any).clientId;
    const cookie: any = parseCookie(request.headers.cookie);
    const { userInfo } = cookie;
    const user = JSON.parse(userInfo);

    const auth = await renewWeb3AuthToken(
      user.refreshToken,
      issuer,
      clientId,
      clientSecret
    );

    setRequestLocalsFromNewTokens(request, auth);

    const response = {
      body: {
        ...auth,
      },
    };

    return response;
  };
