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
import { accessToken, refreshToken } from "../web3auth/Web3Auth.svelte";
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

  const fetchOptions = () => {
    const currentAccessToken = get(accessToken);
    const sessionAccessToken = session.accessToken;
    const eitherAccessToken = currentAccessToken || sessionAccessToken;

    return {
      headers: {
        authorization: eitherAccessToken ? `Bearer ${eitherAccessToken}` : "",
      },
    };
  };

  const connectionParams = fetchOptions();

  const subscriptionClient = new stws.SubscriptionClient(
    graphQLConfig.ws,
    {
      reconnect: true,
      connectionParams,
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
      authExchange({
        addAuthToOperation: (options: { authState: any; operation: any }) => {
          const { authState, operation } = options;

          if (!authState || !authState.accessToken) {
            return operation;
          }
          // fetchOptions can be a function (See Client API) but you can simplify this based on usage
          const fetchOptions =
            typeof operation.context.fetchOptions === "function"
              ? operation.context.fetchOptions()
              : operation.context.fetchOptions || {};

          let authHeaders: any = {};

          if (authState.accessToken) {
            authHeaders.authorization = `Bearer ${authState.accessToken}`;
          }

          const newOperation = makeOperation(operation.kind, operation, {
            ...operation.context,
            fetchOptions: {
              ...fetchOptions,
              headers: {
                ...fetchOptions.headers,
                ...authHeaders,
              },
            },
          });

          return newOperation;
        },
        getAuth: async (options: { authState: any }) => {
          // const { authState } = options

          const currentAccessToken = get(accessToken);
          const sessionAccessToken = session.accessToken;
          const eitherAccessToken = currentAccessToken || sessionAccessToken;
          const currentRefreshToken = get(refreshToken);
          const sessionRefreshToken = session.accessToken;
          const eitherRefreshToken = currentRefreshToken || sessionRefreshToken;

          return {
            accessToken: eitherAccessToken,
            refreshToken: eitherRefreshToken,
          };
        },
        willAuthError: ({ authState }) => {
          console.log("will auth error", authState);
          if (!authState) return true;
          // e.g. check for expiration, existence of auth etc
          return false;
        },
        didAuthError: ({ error }) => {
          console.log("did auth error", error);
          // check if the error was an auth error (this can be implemented in various ways, e.g. 401 or a special error code)
          return error.graphQLErrors.some(
            (e) => e.extensions?.code === "FORBIDDEN"
          );
        },
      }),
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

  const urqlConfig = Object.assign({}, clientConfig, {
    fetchOptions,
  });

  return createClient(urqlConfig as any);
};
