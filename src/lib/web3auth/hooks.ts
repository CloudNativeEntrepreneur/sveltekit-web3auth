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
import type { RequestEvent } from "@sveltejs/kit/types/internal";

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
      (event.locals as Locals)?.accessToken &&
      !isTokenExpired((event.locals as Locals)?.accessToken) &&
      (event.locals as Locals)?.user &&
      (event.locals as Locals)?.userid
    ) {
      log("has valid access token and user information set - returning");
      const userClone = Object.assign({}, (event.locals as Locals).user);
      if (userClone?.username) {
        userClone.username = decodeURI(userClone.username);
      }
      return {
        user: userClone,
        accessToken: (event.locals as Locals).accessToken,
        refreshToken: (event.locals as Locals).refreshToken,
        userid: (event.locals as Locals).user.address,
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
          (event.locals as Locals)?.refreshToken &&
          (event.locals as Locals)?.retries < refreshTokenMaxRetries
        ) {
          log("attempting to exchange refresh token", (event.locals as Locals)?.retries);
          const tokenSet = await renewWeb3AuthToken(
            (event.locals as Locals).refreshToken,
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

          (event.locals as Locals).retries = (event.locals as Locals).retries + 1;
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
    (event.locals as Locals).accessToken = "";
    (event.locals as Locals).refreshToken = "";
    (event.locals as Locals).userid = "";
    (event.locals as Locals).user = null;
    if (err?.error) {
      (event.locals as Locals).authError.error = err.error;
    }
    if (err?.errorDescription) {
      (event.locals as Locals).authError.errorDescription = err.errorDescription;
    }
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      userid: null,
      error: (event.locals as Locals).authError?.error ? (event.locals as Locals).authError : null,
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

  (event.locals as Locals).retries = 0;
  (event.locals as Locals).authError = {
    error: null,
    errorDescription: null,
  };

  populateRequestLocals(event, "userid", userInfo, "");
  populateRequestLocals(event, "accessToken", userInfo, null);
  populateRequestLocals(event, "refreshToken", userInfo, null);

  // Parsing user object
  const userJsonParseFailed = parseUser(event, userInfo);
  const tokenExpired = isTokenExpired((event.locals as Locals).accessToken);
  const beforeAccessToken = (event.locals as Locals).accessToken;

  event = { ...event, ...(yield) };

  const response = { status: 200, headers: {} };
  const afterAccessToken = (event.locals as Locals).accessToken;

  if (isAuthInfoInvalid(request.headers) || tokenExpired) {
    populateResponseHeaders(event, response);
  }

  if (
    isAuthInfoInvalid(userInfo) ||
    ((event.locals as Locals)?.user && userJsonParseFailed) ||
    tokenExpired ||
    beforeAccessToken !== afterAccessToken
  ) {
    // set a cookie so that we recognize future requests
    injectCookies(event, response);
  }

  log("returning response with injected cookies");
  return response;
};
