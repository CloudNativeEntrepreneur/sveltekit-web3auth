import { post as login } from "$lib/_web3Auth/routes/auth/login";

const clientSecret = import.meta.env.VITE_WEB3AUTH_CLIENT_SECRET;
const issuer = import.meta.env.VITE_WEB3AUTH_ISSUER;

export const post = login(clientSecret, issuer);
