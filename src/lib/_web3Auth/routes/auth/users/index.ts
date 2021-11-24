import type { Locals } from "$lib/types";
import { getUsers } from "$lib/_web3Auth/auth-api";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post =
  (clientSecret, issuer): RequestHandler<Locals, FormData> =>
  async (request) => {
    const clientId = (request.body as any).clientId;
    const publicAddress = (request.body as any).publicAddress;

    const users = await getUsers(issuer, clientId, clientSecret, publicAddress);

    const response = {
      body: JSON.stringify(users),
    };

    return response;
  };
