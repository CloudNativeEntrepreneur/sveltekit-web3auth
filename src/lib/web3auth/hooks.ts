import type { Locals, UserDetailsGeneratorFn } from "../types";
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
import debug from "debug";
import type { RequestEvent } from "@sveltejs/kit";

const log = debug("sveltekit-web3auth:lib/web3auth/hooks");

// This function is recursive - if a user does not have an access token, but a refresh token
// it attempts to refresh the access token, and calls itself again recursively, this time
// to go down the path of having the access token
export const getUserSession = async (
  event: RequestEvent<Locals>,
  issuer,
  clientId,
  clientSecret,
  refreshTokenMaxRetries
) => {
  const { request } = event;
  try {
    if (
      event.locals?.accessToken &&
      !isTokenExpired(event.locals?.accessToken) &&
      event.locals?.user &&
      event.locals?.userid
    ) {
      log("has valid access token and user information set - returning");
      const userClone = Object.assign({}, event.locals.user);
      if (userClone?.username) {
        userClone.username = decodeURI(userClone.username);
      }
      return {
        user: userClone,
        accessToken: event.locals.accessToken,
        refreshToken: event.locals.refreshToken,
        userid: event.locals.user.address,
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
          event.locals?.refreshToken &&
          event.locals?.retries < refreshTokenMaxRetries
        ) {
          log("attempting to exchange refresh token", event.locals?.retries);
          const tokenSet = await renewWeb3AuthToken(
            event.locals.refreshToken,
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

          setRequestLocalsFromNewTokens(event, tokenSet);

          event.locals.retries = event.locals.retries + 1;
          return await getUserSession(
            event,
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
    event.locals.accessToken = "";
    event.locals.refreshToken = "";
    event.locals.userid = "";
    event.locals.user = null;
    if (err?.error) {
      event.locals.authError.error = err.error;
    }
    if (err?.errorDescription) {
      event.locals.authError.errorDescription = err.errorDescription;
    }
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      userid: null,
      error: event.locals.authError?.error ? event.locals.authError : null,
      authServerOnline: err.error !== "auth_server_conn_error" ? true : false,
    };
  }
};

export const userDetailsGenerator: UserDetailsGeneratorFn = async function* (
  event: RequestEvent<Locals>
) {
  const { request } = event;
  const cookies = request.headers.get("cookie")
    ? parseCookie(request.headers.get("cookie") || "")
    : null;

  const userInfo = cookies?.["userInfo"]
    ? JSON.parse(cookies?.["userInfo"])
    : {};

  event.locals.retries = 0;
  event.locals.authError = {
    error: null,
    errorDescription: null,
  };

  populateRequestLocals(event, "userid", userInfo, "");
  populateRequestLocals(event, "accessToken", userInfo, null);
  populateRequestLocals(event, "refreshToken", userInfo, null);

  // Parsing user object
  const userJsonParseFailed = parseUser(event, userInfo);
  const tokenExpired = isTokenExpired(event.locals.accessToken);
  const beforeAccessToken = event.locals.accessToken;

  event = { ...event, ...(yield) };

  const response = { status: 200, headers: {} };
  const afterAccessToken = event.locals.accessToken;

  if (isAuthInfoInvalid(request.headers) || tokenExpired) {
    populateResponseHeaders(event, response);
  }

  if (
    isAuthInfoInvalid(userInfo) ||
    (event.locals?.user && userJsonParseFailed) ||
    tokenExpired ||
    beforeAccessToken !== afterAccessToken
  ) {
    // set a cookie so that we recognize future requests
    injectCookies(event, response);
  }

  log("returning response with injected cookies");
  return response;
};
