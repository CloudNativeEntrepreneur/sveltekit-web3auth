import type { Locals } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

const clientSecret = import.meta.env.VITE_WEB3_AUTH_CLIENT_SECRET
const issuer = import.meta.env.VITE_WEB3_AUTH_ISSUER

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const post: RequestHandler<Locals, FormData> = async (request) => {
  const clientId = (request.body as any).clientId
  const publicAddress = (request.body as any).publicAddress
  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`
  console.log('POST /auth/users/register', Authorization)

  const fetchResult = await fetch(`${issuer}/api/users`, {
    body: JSON.stringify({ publicAddress }),
    headers: {
      Authorization,
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  // console.log(fetchResult)

  if (fetchResult.ok) {
    let user = await fetchResult.json()

    const response = {
      body: JSON.stringify(user)
    };

    console.log('POST /auth/users/register response', response)
  
    return response
  }
};
