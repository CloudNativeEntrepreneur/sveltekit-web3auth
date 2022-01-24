import type { RequestEvent } from "@sveltejs/kit";
import jwtDecode from "jwt-decode";
import { createAuthSession } from "$lib/web3auth/auth-api";
import debug from "debug";

const log = debug("sveltekit-web3auth:/auth/login");

export const post = (clientSecret, issuer) => async (event: RequestEvent) => {
  log("logging in");
  const { request } = event;
  const body: any = await request.json();
  const clientId = body.clientId;
  const address = body.address;
  const signature = body.signature;

  log("logging in", { clientId, address });

  const auth = await createAuthSession(
    issuer,
    clientId,
    clientSecret,
    address,
    signature
  );

  log("logged in", { clientId, address });

  const user: any = jwtDecode(auth.idToken);
  delete user.aud;
  delete user.exp;
  delete user.iat;
  delete user.iss;
  delete user.sub;
  delete user.typ;

  const response = {
    body: {
      ...auth,
    },
  };

  // Cookie is set based on locals value in next step
  event.locals.userid = user.address;
  event.locals.user = user;
  event.locals.accessToken = auth.accessToken;
  event.locals.refreshToken = auth.refreshToken;

  return response;
};
