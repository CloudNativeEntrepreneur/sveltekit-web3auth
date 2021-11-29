import jwtDecode from "jwt-decode";
import type { Locals } from "../../../types";
import type { RequestHandler } from "@sveltejs/kit";
import { renewWeb3AuthToken } from "../../auth-api";
import { parseCookie } from "../../cookie";

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

    const parsedUserInfo: any = jwtDecode(auth.idToken);
    delete parsedUserInfo.aud;
    delete parsedUserInfo.exp;
    delete parsedUserInfo.iat;
    delete parsedUserInfo.iss;
    delete parsedUserInfo.sub;
    delete parsedUserInfo.typ;

    const response = {
      body: {
        ...auth,
      },
    };

    // Cookie is set based on locals value in next step
    request.locals.userid = parsedUserInfo.address;
    request.locals.user = parsedUserInfo;
    request.locals.accessToken = auth.accessToken;
    request.locals.refreshToken = auth.refreshToken;

    return response;
  };