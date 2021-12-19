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
  setRequestLocalsFromNewTokens,
} from "./server-utils";
import type { ServerRequest, ServerResponse } from "@sveltejs/kit/types/hooks";
import debug from 'debug'

const log = debug('sveltekit-web3auth:lib/web3auth/hooks')

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
    if (
      request.locals?.accessToken &&
      !isTokenExpired(request.locals?.accessToken) &&
      request.locals?.user &&
      request.locals?.userid
    ) {
      log(
        "has valid access token and user information set - returning"
      );
      return {
        user: { ...request.locals.user },
        accessToken: request.locals.accessToken,
        refreshToken: request.locals.refreshToken,
        userid: request.locals.user.address,
        authServerOnline: true,
      };
    } else {
      log("get user session - no access token present");

      // Check auth server is ready
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

      // try to refresh
      try {
        if (
          request.locals?.refreshToken &&
          request.locals?.retries < refreshTokenMaxRetries
        ) {
          log(
            "attempting to exchange refresh token",
            request.locals?.retries
          );
          const tokenSet = await renewWeb3AuthToken(
            request.locals.refreshToken,
            issuer,
            clientId,
            clientSecret
          );

          if (tokenSet?.error) {
            throw {
              error: tokenSet.error,
              errorDescription: tokenSet.errorDescription,
            };
          }

          setRequestLocalsFromNewTokens(request, tokenSet);

          request.locals.retries = request.locals.retries + 1;
          return await getUserSession(
            request,
            issuer,
            clientId,
            clientSecret,
            refreshTokenMaxRetries
          );
        }
      } catch (e) {
        throw {
          error: e.error || "token_refresh_error",
          errorDescription: `Unable to exchange refresh token: ${e.errorDescription}`,
        };
      }

      log("no refresh token, or max retries reached");
      // no access token or refresh token
      throw {
        error: "missing_jwt",
        errorDescription: "access token not found or is null",
      };
    }
  } catch (err) {
    log("returning without user info");
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
    // set a cookie so that we recognize future requests
    response = injectCookies(request, response);
  }

  return response;
};
