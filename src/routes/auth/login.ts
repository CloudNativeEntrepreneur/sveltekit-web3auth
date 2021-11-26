import { getServerOnlyEnvVar } from "$lib";
import { post as login } from "$lib/web3auth/routes/auth/login";

const clientSecret =
  getServerOnlyEnvVar(process, "WEB3AUTH_CLIENT_SECRET") ||
  import.meta.env.VITE_WEB3AUTH_CLIENT_SECRET;
const issuer =
  getServerOnlyEnvVar(process, "WEB3AUTH_ISSUER") ||
  import.meta.env.VITE_WEB3AUTH_ISSUER;

export const post = login(clientSecret, issuer);
