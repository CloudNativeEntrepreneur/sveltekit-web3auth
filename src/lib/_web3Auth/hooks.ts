import type {
  Locals,
  Web3AuthResponse,
  UserDetailsGeneratorFn,
  GetUserSessionFn,
} from "../types";
import { parseCookie } from "./cookie";
import { isTokenExpired } from "./jwt";
import {
  initiateBackChannelWeb3AuthLogout,
  introspectWeb3AuthToken,
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

const { clientId, issuer, redirectUri } = config;

const web3AuthBaseUrl = issuer;
let appRedirectUrl = redirectUri;

export const getUserSession: GetUserSessionFn = async (
  request: ServerRequest<Locals>,
  clientSecret
) => {
  console.log("hooks: getUserSession", { locals: request.locals });
  try {

    // TODO: Tokens have no expiration currently, so introspection never happens
    if (request.locals?.access_token) {
      console.log("hooks: getUserSession: has access token");
      if (
        request.locals.user &&
        request.locals.userid &&
        !isTokenExpired(request.locals.access_token)
      ) {

        let isTokenActive = true;
        console.log("hooks: getUserSession: access token appears active");
        try {
          console.log("hooks: getUserSession: introspecting token");
          const tokenIntrospect = await introspectWeb3AuthToken(
            request.locals.access_token,
            web3AuthBaseUrl,
            clientId,
            clientSecret,
            request.locals.user.preferred_username
          );
          isTokenActive = Object.keys(tokenIntrospect).includes("active")
            ? tokenIntrospect.active
            : false;
          console.log("token active ", isTokenActive);
        } catch (e) {
          isTokenActive = false;
          console.error("Error while fetching introspect details", e);
        }

        if (isTokenActive) {
          console.log("hooks: getUserSession: token active after introspection - returning");
          return {
            user: { ...request.locals.user },
            access_token: request.locals.access_token,
            refresh_token: request.locals.refresh_token,
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
          Authorization: `Bearer ${request.locals.access_token}`,
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
          access_token: request.locals.access_token,
          refresh_token: request.locals.refresh_token,
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
              isTokenExpired(request.locals.access_token)
            );
            const newTokenData = await renewWeb3AuthToken(
              request.locals.refresh_token,
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
              request.locals.access_token = newTokenData.access_token;
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
          // console.error('Error while refreshing access_token; access_token is invalid', e);
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
            isTokenExpired(request.locals.access_token)
          );
          const newTokenData = await renewWeb3AuthToken(
            request.locals.refresh_token,
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
            request.locals.access_token = newTokenData.access_token;
            request.locals.retries = request.locals.retries + 1;
            return await getUserSession(request, clientSecret);
          }
        }
      } catch (e) {
        console.error(
          "Error while refreshing access_token; access_token is missing",
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
    request.locals.access_token = "";
    request.locals.refresh_token = "";
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
      access_token: null,
      refresh_token: null,
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
  populateRequestLocals(request, "access_token", userInfo, null);
  populateRequestLocals(request, "refresh_token", userInfo, null);

  let ssr_redirect = false;
  let ssr_redirect_uri = "/";

  // Parsing user object
  const userJsonParseFailed = parseUser(request, userInfo);

  // const tokenExpired = isTokenExpired(request.locals.access_token);
  const tokenExpired = false
  const beforeAccessToken = request.locals.access_token;

  console.log("hooks: userDetailsGenerator: before token", {
    tokenExpired,
    beforeAccessToken,
  });

  request = { ...request, ...(yield) };

  let response: ServerResponse = { status: 200, headers: {} };
  const afterAccessToken = request.locals.access_token;

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
