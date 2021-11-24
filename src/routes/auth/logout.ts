import { post as logout } from "$lib/_web3Auth/routes/auth/logout";

const clientSecret = import.meta.env.VITE_WEB3_AUTH_CLIENT_SECRET;
const issuer = import.meta.env.VITE_WEB3_AUTH_ISSUER;

export const post = logout(clientSecret, issuer);
