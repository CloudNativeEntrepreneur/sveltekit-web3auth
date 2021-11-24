import { post as register } from "$lib/_web3Auth/routes/auth/users/register";

const clientSecret = import.meta.env.VITE_WEB3_AUTH_CLIENT_SECRET;
const issuer = import.meta.env.VITE_WEB3_AUTH_ISSUER;

export const post = register(clientSecret, issuer);
