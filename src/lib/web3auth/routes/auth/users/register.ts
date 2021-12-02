import type { RequestHandler } from "@sveltejs/kit";
import { registerUser } from "../../../auth-api";
import type { Locals } from "../../../../types";

export const post =
  (clientSecret, issuer): RequestHandler<Locals, FormData> =>
  async (request) => {
    const clientId = (request.body as any).clientId;
    const address = (request.body as any).address;

    const user = await registerUser(issuer, clientId, clientSecret, address);

    const response = {
      body: JSON.stringify(user),
    };

    return response;
  };
