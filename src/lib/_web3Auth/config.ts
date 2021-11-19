import {
  VITE_WEB3_AUTH_ISSUER,
  VITE_WEB3_AUTH_CLIENT_ID,
  VITE_WEB3_AUTH_CLIENT_SECRET,
  VITE_WEB3_AUTH_REDIRECT_URI,
  VITE_WEB3_AUTH_POST_LOGOUT_REDIRECT_URI,
  VITE_WEB3_AUTH_CLIENT_SCOPE,
  VITE_WEB3_AUTH_TOKEN_REFRESH_MAX_RETRIES,
  VITE_WEB3_AUTH_REFRESH_TOKEN_ENDPOINT,
  VITE_WEB3_AUTH_REFRESH_PAGE_ON_SESSION_TIMEOUT,
} from "./env";

export const config = {
  issuer: VITE_WEB3_AUTH_ISSUER,
  clientId: VITE_WEB3_AUTH_CLIENT_ID,
  clientSecret: VITE_WEB3_AUTH_CLIENT_SECRET,
  redirectUri: VITE_WEB3_AUTH_REDIRECT_URI,
  postLogoutRedirectUri: VITE_WEB3_AUTH_POST_LOGOUT_REDIRECT_URI,
  clientScope: VITE_WEB3_AUTH_CLIENT_SCOPE,
  maxRetries: VITE_WEB3_AUTH_TOKEN_REFRESH_MAX_RETRIES,
  refreshTokenEndpoint: VITE_WEB3_AUTH_REFRESH_TOKEN_ENDPOINT,
  refreshPageOnSessionTimeout: VITE_WEB3_AUTH_REFRESH_PAGE_ON_SESSION_TIMEOUT,
};
