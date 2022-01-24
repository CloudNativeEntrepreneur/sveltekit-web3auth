import type { RequestEvent } from "@sveltejs/kit";
import { getUsers } from "../../../auth-api";
import debug from "debug";

const log = debug("sveltekit-web3auth:/auth/users");

export const post =
  (clientSecret, issuer) =>
  async ({ params, request }: RequestEvent) => {
    log("getting users for address");

    const body: any = await request.json();
    const clientId = body.clientId;
    const address = body.address;

    log("getting users for address", { clientId, address });

    const users = await getUsers(issuer, clientId, clientSecret, address);

    log("user query result", { clientId, address, users });

    const response = {
      body: JSON.stringify(users),
    };

    return response;
  };
