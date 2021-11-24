import { registerUser } from "$lib/_web3Auth/auth-api";
import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post =
  (clientSecret, issuer): RequestHandler<Locals, FormData> =>
  async (request) => {
    const clientId = (request.body as any).clientId;
    const publicAddress = (request.body as any).publicAddress;

    const user = await registerUser(
      issuer,
      clientId,
      clientSecret,
      publicAddress
    );

    const response = {
      body: JSON.stringify(user),
    };

    return response;
  };
