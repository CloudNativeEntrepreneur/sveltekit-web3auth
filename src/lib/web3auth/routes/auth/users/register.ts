import type { RequestEvent } from "@sveltejs/kit";
import { registerUser } from "../../../auth-api";

import debug from "debug";

const log = debug("sveltekit-web3auth:/auth/users/register");

export const post =
  (clientSecret, issuer) =>
  async ({ params, request }: RequestEvent) => {
    log("registering user with address");

    const body: any = await request.json();
    const clientId = body.clientId;
    const address = body.address;

    log("registering user with address", { clientId, address });

    const user = await registerUser(issuer, clientId, clientSecret, address);

    log("registered", { clientId, address });

    const response = {
      body: JSON.stringify(user),
    };

    return response;
  };
