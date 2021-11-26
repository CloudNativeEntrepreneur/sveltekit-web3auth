import type { RequestHandler } from "@sveltejs/kit";
import { registerUser } from "../../../auth-api";
import type { Locals } from "../../../../types";

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
