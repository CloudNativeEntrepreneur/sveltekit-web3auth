import { getServerOnlyEnvVar } from "$lib";
import { post as getUsers } from "$lib/web3auth/routes/auth/users/index";
import { config } from "../../../config";

const clientSecret =
  getServerOnlyEnvVar(process, "WEB3AUTH_CLIENT_SECRET") ||
  config.web3auth.clientSecret;
const issuer = config.web3auth.issuer;

export const post = getUsers(clientSecret, issuer);
