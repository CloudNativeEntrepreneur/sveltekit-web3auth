/// <reference types="@sveltejs/kit" />
interface ImportMetaEnv {
  VITE_WEB3AUTH_ISSUER: string;
  VITE_WEB3AUTH_CLIENT_ID: string;
  VITE_WEB3AUTH_CLIENT_SECRET: string;
  VITE_WEB3AUTH_POST_LOGOUT_REDIRECT_URI?: string;
  VITE_WEB3AUTH_TOKEN_REFRESH_MAX_RETRIES: number;
  VITE_GRAPHQL_URL: string;
  VITE_GRAPHQL_INTERNAL_URL: string;
  VITE_GRAPHQL_WS_URL: string;
}
