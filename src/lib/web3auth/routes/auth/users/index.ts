import type { Locals } from "$lib/types";
import { getUsers } from "$lib/web3auth/auth-api";
import type { RequestHandler } from "@sveltejs/kit";

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
