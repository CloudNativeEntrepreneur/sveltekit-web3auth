import {
  createClient,
  subscriptionExchange,
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from "@urql/svelte";
import { accessToken } from "../web3auth/Web3Auth.svelte";
import { devtoolsExchange } from "@urql/devtools";
import { browser } from "$app/env";
import debug from "debug";
import { get } from "svelte/store";
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
}) => {
  log("gql client init/restart", { restartRequired });
  const { id, session, graphql, fetch, ws } = options;

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

  const existingClient = graphQLClients.find((c) => c.id === id);
  const isServerSide = !browser;
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

  const serverExchanges = [
    devtoolsExchange,
    dedupExchange,
    cacheExchange,
    ssr,
    fetchExchange,
  ];

  const clientExchanges = [
    devtoolsExchange,
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
    fetch,
    fetchOptions,
    exchanges: serverExchanges,
  };

  const clientConfig = {
    url: graphql.http,
    preferGetMethod: false,
    fetch,
    fetchOptions,
    exchanges: clientExchanges,
    requestPolicy: "cache-and-network",
  };

  const client = isServerSide
    ? createClient(serverConfig)
    : createClient(clientConfig as any);

  Object.assign(client, { id });
  log("created client", { isServerSide, id });

  graphQLClients.push(client);

  return client;
};
