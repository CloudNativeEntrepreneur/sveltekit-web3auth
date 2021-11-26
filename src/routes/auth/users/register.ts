import { getServerOnlyEnvVar } from "$lib";
import { post as register } from "$lib/web3auth/routes/auth/users/register";

const clientSecret =
  getServerOnlyEnvVar(process, "WEB3AUTH_CLIENT_SECRET") ||
  import.meta.env.VITE_WEB3AUTH_CLIENT_SECRET;
const issuer =
  getServerOnlyEnvVar(process, "WEB3AUTH_ISSUER") ||
  import.meta.env.VITE_WEB3AUTH_ISSUER;

export const post = register(clientSecret, issuer);
