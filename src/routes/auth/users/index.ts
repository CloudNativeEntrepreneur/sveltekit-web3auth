import { post as getUsers } from "$lib/_web3Auth/routes/auth/users/index";

const clientSecret = import.meta.env.VITE_WEB3_AUTH_CLIENT_SECRET;
const issuer = import.meta.env.VITE_WEB3_AUTH_ISSUER;

export const post = getUsers(clientSecret, issuer);
