import {
  createClient,
  subscriptionExchange,
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from "@urql/svelte";
import { makeOperation } from "@urql/core";
import { authExchange } from "@urql/exchange-auth";
import {
  tokenRefresh,
  accessToken,
  refreshToken,
} from "../web3auth/Web3Auth.svelte";
import { devtoolsExchange } from "@urql/devtools";
import { browser } from "$app/env";
import { isTokenExpired } from "../web3auth/jwt";
import debug from "debug";
import { get } from "svelte/store";

const log = debug("sveltekit-web3auth:lib/graphQL/urql");

const graphQLClients = [];

export const graphQLClient = (options: {
  id,
  session,
  graphql: {
    ws: string;
    http: string;
    httpInternal?: string;
  },
  fetch,
  ws,
  stws
}) => {
  const { id, session, graphql, fetch, ws, stws } = options;

  const sessionAccessToken = session.accessToken;
  const sessionRefreshToken = session.refreshToken;

  let currentTokenSet = {
    accessToken: sessionAccessToken,
    refreshToken: sessionRefreshToken,
  };

  const authHeaders: any = {};
  if (currentTokenSet.accessToken) {
    authHeaders.Authorization = `Bearer ${currentTokenSet.accessToken}`;
  }
  let fetchOptions = {
    headers: {
      ...authHeaders,
    },
  };
  log("gql client init", { authHeaders });

  const existingClient = graphQLClients.find((c) => c.id === id);
  const isServerSide = !browser;
  if (existingClient) {
    log("found existing client", {
      isServerSide,
      id,
      existingClient,
      fetchOptions,
    });
    existingClient.fetchOptions = fetchOptions;
    return existingClient;
  }

  log("new gql client", { isServerSide, id });


  const subscriptionClient = new stws.SubscriptionClient(
    graphql.ws,
    {
      reconnect: true,
      connectionParams: (params) => {
        log("getting subscription connections params", params);

        let currentAccessToken = get(accessToken);
        const authHeaders: any = {};
        if (currentAccessToken) {
          authHeaders.Authorization = `Bearer ${currentAccessToken}`;
        }
        let fetchOptions = {
          headers: {
            ...authHeaders,
          },
        };
        return fetchOptions;
      },
    },
    isServerSide ? ws : WebSocket
  );

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
        log("forwarding subscription", operation, subscriptionClient);
        // subscriptionClient.connectionParams = () => operation.context.fetchOptions
        return subscriptionClient.request(operation);
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
  log("created client", { isServerSide, client });

  graphQLClients.push(client);

  return client;
};
