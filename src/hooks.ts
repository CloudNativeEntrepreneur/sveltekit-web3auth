import type { Handle, GetSession } from "@sveltejs/kit";
import {
  userDetailsGenerator,
  getUserSession,
  getServerOnlyEnvVar,
} from "$lib";
import type { Locals } from "$lib/types";
import type { ServerRequest } from "@sveltejs/kit/types/hooks";
import { config } from "./config";
import debug from 'debug'

const log = debug('sveltekit-web3auth:hooks')

const issuer = config.web3auth.issuer;
const clientId = config.web3auth.clientId;
const clientSecret =
  getServerOnlyEnvVar(process, "WEB3AUTH_CLIENT_SECRET") ||
  config.web3auth.clientSecret;
const refreshTokenMaxRetries = config.web3auth.refreshTokenMaxRetries;

// https://kit.svelte.dev/docs#hooks-handle
export const handle: Handle<Locals> = async ({ request, resolve }) => {
  log("handle", request.path);

  // Initialization part
  const userGen = userDetailsGenerator(request);
  const { value, done } = await userGen.next();

  if (done) {
    const response = value;
    return response;
  }

  // Set Cookie attributes
  request.locals.cookieAttributes = "Path=/; HttpOnly;";

  // response is the page sveltekit route that was rendered, we're
  // intercepting it and adding headers on the way out
  const response = await resolve(request);

  if (response?.status === 404) {
    return response;
  }

  const extraResponse = (await userGen.next(request)).value;
  const { Location, ...restHeaders } = extraResponse.headers;
  // SSR Redirection
  if (extraResponse.status === 302 && Location) {
    response.status = extraResponse.status;
    response.headers["Location"] = Location;
  }
  response.headers = { ...response.headers, ...restHeaders };

  return response;
};

/** @type {import('@sveltejs/kit').GetSession} */
export const getSession: GetSession = async (
  request: ServerRequest<Locals>
) => {
  log("getSession", request.locals?.user);
  const userSession = await getUserSession(
    request,
    issuer,
    clientId,
    clientSecret,
    refreshTokenMaxRetries
  );
  return userSession;
};
