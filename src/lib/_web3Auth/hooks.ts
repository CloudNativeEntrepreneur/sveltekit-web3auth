import type {
  Locals,
  Web3AuthResponse,
  UserDetailsGeneratorFn,
  GetUserSessionFn,
} from "../types";
import { parseCookie } from "./cookie";
import { isTokenExpired } from "./jwt";
import {
  // introspectWeb3AuthToken,
  renewWeb3AuthToken,
} from "./api";
import {
  injectCookies,
  isAuthInfoInvalid,
  parseUser,
  populateResponseHeaders,
  populateRequestLocals,
} from "./hooks-utils";
import { config } from "./config";
import type { ServerRequest, ServerResponse } from "@sveltejs/kit/types/hooks";

const { clientId, issuer } = config;

const web3AuthBaseUrl = issuer;

export const getUserSession: GetUserSessionFn = async (
  request: ServerRequest<Locals>,
  clientSecret
) => {
  console.log("hooks: getUserSession", { locals: request.locals });
  try {
    // TODO: Tokens have no expiration currently, so introspection never happens
    if (request.locals?.accessToken) {
      console.log("hooks: getUserSession: has access token");
      if (
        request.locals.user &&
        request.locals.userid &&
        !isTokenExpired(request.locals.accessToken)
      ) {
        let isTokenActive = true;

        if (isTokenActive) {
          console.log("hooks: getUserSession: token active - returning");
          return {
            user: { ...request.locals.user },
            accessToken: request.locals.accessToken,
            refreshToken: request.locals.refreshToken,
            userid: request.locals.user.sub,
            auth_server_online: true,
          };
        }
      }

      try {
        const testAuthServerResponse = await fetch(web3AuthBaseUrl, {
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
          error_description: "Auth Server Connection Error",
        };
      }

      console.log("hooks: getUserSession: /userinfo");
      const res = await fetch(`${web3AuthBaseUrl}/userinfo`, {
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
          auth_server_online: true,
        };
      } else {
        try {
          const data = await res.json();
          // console.log(data, import.meta.env.VITE_WEB3AUTH_TOKEN_REFRESH_MAX_RETRIES);
          if (
            data?.error &&
            request.locals?.retries <
              import.meta.env.VITE_WEB3_AUTH_TOKEN_REFRESH_MAX_RETRIES
          ) {
            console.log(
              "old token expiry",
              isTokenExpired(request.locals.accessToken)
            );
            const newTokenData = await renewWeb3AuthToken(
              request.locals.refreshToken,
              web3AuthBaseUrl,
              clientId,
              clientSecret
            );
            // console.log(newTokenData);
            if (newTokenData?.error) {
              throw {
                error: data?.error ? data.error : "user_info error",
                error_description: data?.error_description
                  ? data.error_description
                  : "Unable to retrieve user Info",
              };
            } else {
              request.locals.accessToken = newTokenData.accessToken;
              request.locals.retries = request.locals.retries + 1;
              return await getUserSession(request, clientSecret);
            }
          }

          throw {
            error: data?.error ? data.error : "user_info error",
            error_description: data?.error_description
              ? data.error_description
              : "Unable to retrieve user Info",
          };
        } catch (e) {
          // console.error('Error while refreshing accessToken; accessToken is invalid', e);
          throw {
            ...e,
          };
        }
      }
    } else {
      console.log("hooks: getUserSession: no access token");
      try {
        if (
          request.locals?.retries <
          import.meta.env.VITE_WEB3_AUTH_TOKEN_REFRESH_MAX_RETRIES
        ) {
          console.log(
            "old token expiry",
            isTokenExpired(request.locals.accessToken)
          );
          const newTokenData = await renewWeb3AuthToken(
            request.locals.refreshToken,
            web3AuthBaseUrl,
            clientId,
            clientSecret
          );
          // console.log(newTokenData);
          if (newTokenData?.error) {
            throw {
              error: newTokenData.error,
              error_description: newTokenData.error_description,
            };
          } else {
            request.locals.accessToken = newTokenData.accessToken;
            request.locals.retries = request.locals.retries + 1;
            return await getUserSession(request, clientSecret);
          }
        }
      } catch (e) {
        console.error(
          "Error while refreshing accessToken; accessToken is missing",
          e
        );
      }
      try {
        const testAuthServerResponse = await fetch(web3AuthBaseUrl, {
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
          error_description: "Auth Server Connection Error",
        };
      }
      throw {
        error: "missing_jwt",
        error_description: "access token not found or is null",
      };
    }
  } catch (err) {
    console.error("hooks: getUserSession", err);
    request.locals.accessToken = "";
    request.locals.refreshToken = "";
    request.locals.userid = "";
    request.locals.user = null;
    if (err?.error) {
      request.locals.authError.error = err.error;
    }
    if (err?.error_description) {
      request.locals.authError.error_description = err.error_description;
    }
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      userid: null,
      error: request.locals.authError?.error ? request.locals.authError : null,
      auth_server_online: err.error !== "auth_server_conn_error" ? true : false,
    };
  }
};

export const userDetailsGenerator: UserDetailsGeneratorFn = async function* (
  request: ServerRequest<Locals>,
  clientSecret: string
) {
  console.log("hooks: userDetailsGenerator:", {
    requestPath: request.path,
    requestHeaders: request.headers,
    requestLocals: request.locals,
  });
  const cookies = request.headers.cookie
    ? parseCookie(request.headers.cookie || "")
    : null;
  console.log({ cookies });
  let userInfo = cookies?.["userInfo"] ? JSON.parse(cookies?.["userInfo"]) : {};

  request.locals.retries = 0;
  request.locals.authError = {
    error: null,
    error_description: null,
  };

  console.log("hooks: userDetailsGenerator:", { userInfo });

  populateRequestLocals(request, "userid", userInfo, "");
  populateRequestLocals(request, "accessToken", userInfo, null);
  populateRequestLocals(request, "refreshToken", userInfo, null);

  let ssr_redirect = false;
  let ssr_redirect_uri = "/";

  // Parsing user object
  const userJsonParseFailed = parseUser(request, userInfo);

  const tokenExpired = isTokenExpired(request.locals.accessToken);
  // const tokenExpired = false;
  const beforeAccessToken = request.locals.accessToken;

  console.log("hooks: userDetailsGenerator: before token", {
    tokenExpired,
    beforeAccessToken,
  });

  request = { ...request, ...(yield) };

  let response: ServerResponse = { status: 200, headers: {} };
  const afterAccessToken = request.locals.accessToken;

  console.log("hooks: userDetailsGenerator: after token", {
    afterAccessToken,
  });

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
  if (ssr_redirect) {
    response.status = 302;
    response.headers["Location"] = ssr_redirect_uri;
  }

  return response;
};
