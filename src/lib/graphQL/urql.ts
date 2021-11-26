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
import { get } from "svelte/store";

export const graphQLClient = (
  session,
  graphQLConfig: {
    ws: string;
    http: string;
    httpInternal?: string;
  },
  fetch,
  ws,
  stws
) => {
  const isServerSide = !browser;

  const subscriptionClient = new stws.SubscriptionClient(
    graphQLConfig.ws,
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
    url: isServerSide
      ? graphQLConfig.httpInternal || graphQLConfig.http
      : graphQLConfig.http,
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
