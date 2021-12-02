import type { RequestHandler } from "@sveltejs/kit";
import type { Locals } from "../../../../types";
import { getUsers } from "../../../auth-api";

export const post =
  (clientSecret, issuer): RequestHandler<Locals, FormData> =>
  async (request) => {
    const clientId = (request.body as any).clientId;
    const address = (request.body as any).address;

    const users = await getUsers(issuer, clientId, clientSecret, address);

    const response = {
      body: JSON.stringify(users),
    };

    return response;
  };
