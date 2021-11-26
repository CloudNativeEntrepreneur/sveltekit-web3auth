import { getServerOnlyEnv } from "$lib";
import { post as logout } from "$lib/web3auth/routes/auth/logout";

const clientSecret =
  getServerOnlyEnv(process, "WEB3AUTH_CLIENT_SECRET") ||
  import.meta.env.VITE_WEB3AUTH_CLIENT_SECRET;
const issuer =
  getServerOnlyEnv(process, "WEB3AUTH_ISSUER") ||
  import.meta.env.VITE_WEB3AUTH_ISSUER;

export const post = logout(clientSecret, issuer);
