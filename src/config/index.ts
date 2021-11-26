import {
  VITE_GRAPHQL_URL,
  VITE_GRAPHQL_INTERNAL_URL,
  VITE_GRAPHQL_WS_URL,
  VITE_WEB3AUTH_ISSUER,
  VITE_WEB3AUTH_CLIENT_ID,
  VITE_WEB3AUTH_CLIENT_SECRET,
  VITE_WEB3AUTH_POST_LOGOUT_REDIRECT_URI,
  VITE_WEB3AUTH_TOKEN_REFRESH_MAX_RETRIES,
} from "./env";

export const config = {
  web3auth: {
    issuer: VITE_WEB3AUTH_ISSUER,
    clientId: VITE_WEB3AUTH_CLIENT_ID,
    clientSecret: VITE_WEB3AUTH_CLIENT_SECRET,
    postLogoutRedirectUri: VITE_WEB3AUTH_POST_LOGOUT_REDIRECT_URI,
    refreshTokenMaxRetries: VITE_WEB3AUTH_TOKEN_REFRESH_MAX_RETRIES,
  },
  graphql: {
    http: VITE_GRAPHQL_URL,
    httpInternal: VITE_GRAPHQL_INTERNAL_URL,
    ws: VITE_GRAPHQL_WS_URL,
  },
};
