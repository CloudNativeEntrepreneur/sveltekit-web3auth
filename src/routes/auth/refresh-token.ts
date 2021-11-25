import { post as refreshToken } from "$lib/web3auth/routes/auth/refresh-token";

const clientSecret = import.meta.env.VITE_WEB3AUTH_CLIENT_SECRET;
const issuer = import.meta.env.VITE_WEB3AUTH_ISSUER;

export const post = refreshToken(clientSecret, issuer);
