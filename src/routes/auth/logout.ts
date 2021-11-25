import { post as logout } from "$lib/web3auth/routes/auth/logout";

const clientSecret = import.meta.env.VITE_WEB3AUTH_CLIENT_SECRET;
const issuer = import.meta.env.VITE_WEB3AUTH_ISSUER;

export const post = logout(clientSecret, issuer);
