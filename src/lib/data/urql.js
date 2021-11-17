import {
  createClient,
  subscriptionExchange,
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from "@urql/svelte";
import fetch from "cross-fetch";
import { devtoolsExchange } from "@urql/devtools";
import ws from "ws";
import * as stws from "subscriptions-transport-ws";
import { browser } from "$app/env";
import config from "$lib/config.js";

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
  initialState: !isServerSide ? window.__URQL_DATA__ : undefined,
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

export const client = createClient(clientConfig);
