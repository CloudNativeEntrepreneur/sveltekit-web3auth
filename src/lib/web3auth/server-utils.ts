import jwtDecode from "jwt-decode";
import type { Locals } from "../types";
import type { RequestEvent } from "@sveltejs/kit/types/hooks";
import debug from "debug";

const log = debug("sveltekit-web3auth:server-utils");

export const injectCookies = (event: RequestEvent<Locals>, response) => {
  let responseCookies = {};
  let serialized_user = null;

  try {
    if (event?.locals?.user?.username) {
      event.locals.user.username = encodeURI(event?.locals?.user?.username);
    }
    serialized_user = JSON.stringify(event.locals.user);
  } catch {
    event.locals.user = null;
  }

  responseCookies = {
    userid: `${event.locals.userid}`,
    user: `${serialized_user}`,
  };
  responseCookies["refreshToken"] = `${event.locals.refreshToken}`;
  let cookieAtrributes = "Path=/; HttpOnly;";
  if (event.locals?.cookieAttributes) {
    cookieAtrributes = event.locals.cookieAttributes;
  }

  response.headers["set-cookie"] = `userInfo=${JSON.stringify(
    responseCookies
  )}; ${cookieAtrributes}`;
};

export const isAuthInfoInvalid = (obj) => {
  const isAuthInvalid =
    !obj?.userid || !obj?.accessToken || !obj?.refreshToken || !obj?.user;
  return isAuthInvalid;
};

export const parseUser = (event: RequestEvent<Locals>, userInfo) => {
  const { request } = event;
  let userJsonParseFailed = false;
  try {
    if (request.headers?.get("user")) {
      event.locals.user = JSON.parse(request.headers.get("user"));
    } else {
      if (
        userInfo?.user &&
        userInfo?.user !== "null" &&
        userInfo?.user !== "undefined"
      ) {
        event.locals.user = JSON.parse(userInfo.user);
        if (!event.locals.user) {
          userJsonParseFailed = true;
        }
      } else {
        throw {
          error: "invalid_user_object",
        };
      }
    }
  } catch {
    userJsonParseFailed = true;
    event.locals.user = null;
  }
  return userJsonParseFailed;
};

export const populateRequestLocals = (
  event: RequestEvent<Locals>,
  keyName: string,
  userInfo,
  defaultValue
) => {
  const { request } = event;
  if (request.headers.get(keyName)) {
    event.locals[keyName] = request.headers.get(keyName);
  } else {
    if (
      userInfo[keyName] &&
      userInfo[keyName] !== "null" &&
      userInfo[keyName] !== "undefined"
    ) {
      event.locals[keyName] = userInfo[keyName];
    } else {
      event.locals[keyName] = defaultValue;
    }
  }
  return request;
};

export const populateResponseHeaders = (
  event: RequestEvent<Locals>,
  response
) => {
  if (event.locals.user) {
    response.headers["user"] = `${JSON.stringify(event.locals.user)}`;
  }

  if (event.locals.userid) {
    response.headers["userid"] = `${event.locals.userid}`;
  }

  if (event.locals.accessToken) {
    response.headers["accessToken"] = `${event.locals.accessToken}`;
  }
  if (event.locals.refreshToken) {
    response.headers["refreshToken"] = `${event.locals.refreshToken}`;
  }
};

export const setRequestLocalsFromNewTokens = (
  event: RequestEvent,
  tokenSet: { accessToken: string; idToken: string; refreshToken: string }
) => {
  const parsedUserInfo: any = jwtDecode(tokenSet.idToken);
  delete parsedUserInfo.aud;
  delete parsedUserInfo.exp;
  delete parsedUserInfo.iat;
  delete parsedUserInfo.iss;
  delete parsedUserInfo.sub;
  delete parsedUserInfo.typ;

  // Cookie is set based on locals value in next step
  event.locals.userid = parsedUserInfo.address;
  event.locals.user = parsedUserInfo;
  event.locals.accessToken = tokenSet.accessToken;
  event.locals.refreshToken = tokenSet.refreshToken;
};
