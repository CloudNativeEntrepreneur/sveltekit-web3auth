import type { Locals } from "../types";
import type { ServerRequest, ServerResponse } from "@sveltejs/kit/types/hooks";

export const injectCookies = (
  request: ServerRequest<Locals>,
  response: ServerResponse
) => {
  let responseCookies = {};
  let serialized_user = null;

  try {
    serialized_user = JSON.stringify(request.locals.user);
  } catch {
    request.locals.user = null;
  }
  responseCookies = {
    userid: `${request.locals.userid}`,
    user: `${serialized_user}`,
  };
  responseCookies["refresh_token"] = `${request.locals.refresh_token}`;
  let cookieAtrributes = "Path=/; HttpOnly; SameSite=Lax;";
  if (request.locals?.cookieAttributes) {
    cookieAtrributes = request.locals.cookieAttributes;
  }
  response.headers["set-cookie"] = `userInfo=${JSON.stringify(
    responseCookies
  )}; ${cookieAtrributes}`;
  return response;
};

export const isAuthInfoInvalid = (obj) => {
  return (
    !obj?.userid || !obj?.access_token || !obj?.refresh_token || !obj?.user
  );
};

export const parseUser = (request: ServerRequest<Locals>, userInfo) => {
  let userJsonParseFailed = false;
  try {
    if (request.headers?.user) {
      request.locals.user = JSON.parse(request.headers.user);
    } else {
      if (
        userInfo?.user &&
        userInfo?.user !== "null" &&
        userInfo?.user !== "undefined"
      ) {
        request.locals.user = JSON.parse(userInfo.user);
        if (!request.locals.user) {
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
    request.locals.user = null;
  }
  return userJsonParseFailed;
};

export const populateRequestLocals = (
  request: ServerRequest<Locals>,
  keyName: string,
  userInfo,
  defaultValue
) => {
  if (request.headers[keyName]) {
    request.locals[keyName] = request.headers[keyName];
  } else {
    if (
      userInfo[keyName] &&
      userInfo[keyName] !== "null" &&
      userInfo[keyName] !== "undefined"
    ) {
      request.locals[keyName] = userInfo[keyName];
    } else {
      request.locals[keyName] = defaultValue;
    }
  }
  return request;
};

export const populateResponseHeaders = (
  request: ServerRequest<Locals>,
  response: ServerResponse
) => {
  if (request.locals.user) {
    response.headers["user"] = `${JSON.stringify(request.locals.user)}`;
  }

  if (request.locals.userid) {
    response.headers["userid"] = `${request.locals.userid}`;
  }

  if (request.locals.access_token) {
    response.headers["access_token"] = `${request.locals.access_token}`;
  }
  if (request.locals.refresh_token) {
    response.headers["refresh_token"] = `${request.locals.refresh_token}`;
  }
  return response;
};
