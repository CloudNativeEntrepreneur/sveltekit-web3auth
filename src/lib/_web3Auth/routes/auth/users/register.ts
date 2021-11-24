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
    const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

    const fetchResult = await fetch(`${issuer}/api/users`, {
      body: JSON.stringify({ publicAddress }),
      headers: {
        Authorization,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (fetchResult.ok) {
      const user = await fetchResult.json();

      const response = {
        body: JSON.stringify(user),
      };

      return response;
    }
  };
