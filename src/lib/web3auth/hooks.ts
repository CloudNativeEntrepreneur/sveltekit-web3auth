import type {
  Locals,
  UserDetailsGeneratorFn,
  GetUserSessionFn,
} from "../types";
import { parseCookie } from "./cookie";
import { isTokenExpired } from "./jwt";
import { renewWeb3AuthToken } from "./auth-api";
import {
  injectCookies,
  isAuthInfoInvalid,
  parseUser,
  populateResponseHeaders,
  populateRequestLocals,
} from "./hooks-utils";
import type { ServerRequest, ServerResponse } from "@sveltejs/kit/types/hooks";

// This function is recursive - if a user does not have an access token, but a refresh token
// it attempts to refresh the access token, and calls itself again recursively, this time
// to go down the path of having the access token
export const getUserSession: GetUserSessionFn = async (
  request: ServerRequest<Locals>,
  issuer,
  clientId,
  clientSecret,
  refreshTokenMaxRetries
) => {
  try {
    if (request.locals?.accessToken) {
      if (
        request.locals.user &&
        request.locals.userid &&
        !isTokenExpired(request.locals.accessToken)
      ) {
        return {
          user: { ...request.locals.user },
          accessToken: request.locals.accessToken,
          refreshToken: request.locals.refreshToken,
          userid: request.locals.user.sub,
          authServerOnline: true,
        };
      }

      try {
        const testAuthServerResponse = await fetch(issuer, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!testAuthServerResponse.ok) {
          throw {
            error: await testAuthServerResponse.json(),
          };
        }
      } catch (e) {
        throw {
          error: "auth_server_conn_error",
          errorDescription: "Auth Server Connection Error",
        };
      }

      console.log("hooks: getUserSession: /userinfo");
      const res = await fetch(`${issuer}/userinfo`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${request.locals.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // console.log('userinfo fetched');
        request.locals.userid = data.sub;
        request.locals.user = { ...data };
        return {
          user: {
            // only include properties needed client-side —
            // exclude anything else attached to the user
            // like access tokens etc
            ...data,
          },
          accessToken: request.locals.accessToken,
          refreshToken: request.locals.refreshToken,
          userid: data.sub,
          authServerOnline: true,
        };
      } else {
        try {
          const data = await res.json();

          if (data?.error && request.locals?.retries < refreshTokenMaxRetries) {
            console.log(`hooks.ts:92 - Renewing web3auth token`);
            const newTokenData = await renewWeb3AuthToken(
              request.locals.refreshToken,
              issuer,
              clientId,
              clientSecret
            );

            if (newTokenData?.error) {
              throw {
                error: data?.error ? data.error : "user_info error",
                errorDescription: data?.errorDescription
                  ? data.errorDescription
                  : "Unable to retrieve user Info",
              };
            } else {
              request.locals.accessToken = newTokenData.accessToken;
              request.locals.retries = request.locals.retries + 1;
              return await getUserSession(
                request,
                issuer,
                clientId,
                clientSecret,
                refreshTokenMaxRetries
              );
            }
          }

          throw {
            error: data?.error ? data.error : "user_info error",
            errorDescription: data?.errorDescription
              ? data.errorDescription
              : "Unable to retrieve user Info",
          };
        } catch (e) {
          throw {
            ...e,
          };
        }
      }
    } else {
      try {
        if (request.locals?.retries < refreshTokenMaxRetries) {
          console.log(`hooks.ts:135 - Renewing web3auth token`);
          const newTokenData = await renewWeb3AuthToken(
            request.locals.refreshToken,
            issuer,
            clientId,
            clientSecret
          );

          if (newTokenData?.error) {
            throw {
              error: newTokenData.error,
              errorDescription: newTokenData.errorDescription,
            };
          } else {
            request.locals.accessToken = newTokenData.accessToken;
            request.locals.retries = request.locals.retries + 1;
            return await getUserSession(request, clientSecret);
          }
        }
      } catch (e) {} // eslint-disable-line no-empty
      try {
        const testAuthServerResponse = await fetch(issuer, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!testAuthServerResponse.ok) {
          throw {
            error: await testAuthServerResponse.json(),
          };
        }
      } catch (e) {
        throw {
          error: "auth_server_conn_error",
          errorDescription: "Auth Server Connection Error",
        };
      }
      throw {
        error: "missing_jwt",
        errorDescription: "access token not found or is null",
      };
    }
  } catch (err) {
    request.locals.accessToken = "";
    request.locals.refreshToken = "";
    request.locals.userid = "";
    request.locals.user = null;
    if (err?.error) {
      request.locals.authError.error = err.error;
    }
    if (err?.errorDescription) {
      request.locals.authError.errorDescription = err.errorDescription;
    }
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      userid: null,
      error: request.locals.authError?.error ? request.locals.authError : null,
      authServerOnline: err.error !== "auth_server_conn_error" ? true : false,
    };
  }
};

export const userDetailsGenerator: UserDetailsGeneratorFn = async function* (
  request: ServerRequest<Locals>
) {
  const cookies = request.headers.cookie
    ? parseCookie(request.headers.cookie || "")
    : null;

  const userInfo = cookies?.["userInfo"]
    ? JSON.parse(cookies?.["userInfo"])
    : {};

  request.locals.retries = 0;
  request.locals.authError = {
    error: null,
    errorDescription: null,
  };

  populateRequestLocals(request, "userid", userInfo, "");
  populateRequestLocals(request, "accessToken", userInfo, null);
  populateRequestLocals(request, "refreshToken", userInfo, null);

  // Parsing user object
  const userJsonParseFailed = parseUser(request, userInfo);

  const tokenExpired = isTokenExpired(request.locals.accessToken);
  const beforeAccessToken = request.locals.accessToken;

  request = { ...request, ...(yield) };

  let response: ServerResponse = { status: 200, headers: {} };
  const afterAccessToken = request.locals.accessToken;

  if (isAuthInfoInvalid(request.headers) || tokenExpired) {
    response = populateResponseHeaders(request, response);
  }

  if (
    isAuthInfoInvalid(userInfo) ||
    (request.locals?.user && userJsonParseFailed) ||
    tokenExpired ||
    beforeAccessToken !== afterAccessToken
  ) {
    // if this is the first time the user has visited this app,
    // set a cookie so that we recognise them when they return
    response = injectCookies(request, response);
  }

  return response;
};
