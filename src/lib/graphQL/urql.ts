import {
  createClient,
  subscriptionExchange,
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from "@urql/svelte";
import { accessToken } from "$lib";
import fetch from "cross-fetch";
import { devtoolsExchange } from "@urql/devtools";
import ws from "ws";
import * as stws from "subscriptions-transport-ws";
import { browser } from "$app/env";
import { config } from "$lib/config";
import { get } from "svelte/store";

const isServerSide = !browser;
const subscriptionClient = new stws.SubscriptionClient(
  config.graphql.ws,
  {
    reconnect: true,
  },
  isServerSide ? ws : WebSocket
);
const ssr = ssrExchange({
  isClient: !isServerSide,
  initialState: !isServerSide ? (window as any).__URQL_DATA__ : undefined,
});

const clientConfig = {
  url: isServerSide ? config.graphql.httpInternal : config.graphql.http,
  preferGetMethod: false,
  fetch,
  exchanges: [
    devtoolsExchange,
    dedupExchange,
    cacheExchange,
    ssr,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(operation) {
        return subscriptionClient.request(operation);
      },
    }),
  ],
  requestPolicy: "cache-and-network",
};

export const graphQLClient = (session) => {
  const fetchOptions = () => {
    const currentAccessToken = get(accessToken);
    const sessionAccesstoken = session.accessToken;
    const eitherAccessToken = currentAccessToken || sessionAccesstoken;

    return {
      headers: {
        authorization: eitherAccessToken ? `Bearer ${eitherAccessToken}` : "",
      },
    };
  };

  const urqlConfig = Object.assign({}, clientConfig, { fetchOptions });

  return createClient(urqlConfig as any);
};
