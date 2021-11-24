import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

const clientSecret = import.meta.env.VITE_WEB3_AUTH_CLIENT_SECRET;
const issuer = import.meta.env.VITE_WEB3_AUTH_ISSUER;

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
  console.log("POST /auth/users/");
  const clientId = (request.body as any).clientId;
  const publicAddress = (request.body as any).publicAddress;

  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

  const fetchResult = await fetch(
    `${issuer}/api/users?publicAddress=${publicAddress}`,
    {
      headers: {
        Authorization,
      },
      method: "GET",
    }
  );

  if (fetchResult.ok) {
    const users = await fetchResult.json();

    const response = {
      body: JSON.stringify(users),
    };

    console.log("POST /auth/users/ response", response);
    return response;
  }
};
