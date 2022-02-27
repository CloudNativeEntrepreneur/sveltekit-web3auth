import {
  createClient,
  subscriptionExchange,
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from "@urql/svelte";
import { accessToken } from "../web3auth/Web3Auth.svelte";
import { browser } from "$app/env";
import debug from "debug";
import { createClient as createGQLClient } from "graphql-ws";

const log = debug("sveltekit-web3auth:lib/graphQL/urql");

const graphQLClients = [];

type AuthHeaders = {
  Authorization?: string | undefined;
};

let currentAccessToken;
const authHeaders: AuthHeaders = {};
let currentFetchOptions;
const fetchOptions = () => {
  return currentFetchOptions;
};
let restartRequired = false;

accessToken.subscribe((value) => {
  currentAccessToken = value;
  if (currentAccessToken) {
    authHeaders.Authorization = `Bearer ${currentAccessToken}`;
  }
  currentFetchOptions = {
    headers: {
      ...authHeaders,
    },
  };
  restartRequired = true;
});

export const graphQLClient = (options: {
  id;
  session;
  graphql: {
    ws: string;
    http: string;
    httpInternal?: string;
  };
  fetch;
  ws;
  clientSideCacheMode?: string;
  serverSideCacheMode?: string;
}) => {
  const { id, session, graphql, fetch, ws } = options;
  let { clientSideCacheMode, serverSideCacheMode } = options;
  const isServerSide = !browser;

  clientSideCacheMode = clientSideCacheMode || "network-only";
  serverSideCacheMode = serverSideCacheMode || "network-only";
  log("gql client init/restart", {
    restartRequired,
    id,
    clientSideCacheMode,
    serverSideCacheMode,
    isServerSide,
  });

  const sessionAccessToken = currentAccessToken || session.accessToken;

  const authHeaders: any = {};
  if (sessionAccessToken) {
    authHeaders.Authorization = `Bearer ${sessionAccessToken}`;
  }
  currentFetchOptions = {
    headers: {
      ...authHeaders,
    },
  };

  const existingClient = isServerSide
    ? false
    : graphQLClients.find((c) => c.id === id);
  if (existingClient) {
    existingClient.fetchOptions = fetchOptions;
    log("found existing client", {
      isServerSide,
      existingClient,
    });
    return existingClient;
  }

  const subscriptionClient = createGQLClient({
    url: graphql.ws,
    connectionParams: () => {
      return fetchOptions();
    },
    on: {
      connected: (socket: any) => {
        log("socket connected", socket);
        const gracefullyRestartSubscriptionsClient = () => {
          if (socket.readyState === WebSocket.OPEN) {
            log("restart subscription client");
            socket.close(4205, "Client Restart");
          }
        };

        // just in case you were eager to restart
        if (restartRequired) {
          restartRequired = false;
          gracefullyRestartSubscriptionsClient();
        }
      },
    },
    webSocketImpl: isServerSide ? ws : WebSocket,
  });

  const ssr = ssrExchange({
    isClient: !isServerSide,
    initialState: !isServerSide ? (window as any).__URQL_DATA__ : undefined,
  });

  const serverExchanges = [dedupExchange, cacheExchange, ssr, fetchExchange];

  const clientExchanges = [
    dedupExchange,
    cacheExchange,
    ssr,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(operation) {
        return {
          subscribe: (sink) => {
            const dispose = subscriptionClient.subscribe(operation, sink);
            return {
              unsubscribe: dispose,
            };
          },
        };
      },
    }),
  ];

  const serverConfig = {
    url: graphql.httpInternal || graphql.http,
    preferGetMethod: false,
    fetchOptions,
    fetch,
    exchanges: serverExchanges,
    requestPolicy: serverSideCacheMode,
  };

  const clientConfig = {
    url: graphql.http,
    preferGetMethod: false,
    fetchOptions,
    fetch,
    exchanges: clientExchanges,
    requestPolicy: clientSideCacheMode,
  };

  const client = isServerSide
    ? createClient(serverConfig as any)
    : createClient(clientConfig as any);

  Object.assign(client, { id });
  log("created client", { isServerSide, id, cacheMode: client.requestPolicy });

  if (!isServerSide) {
    graphQLClients.push(client);
  }

  return client;
};
