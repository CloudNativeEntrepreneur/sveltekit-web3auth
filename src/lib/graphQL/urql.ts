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
import { tokenRefresh } from "../web3auth/Web3Auth.svelte";
import { devtoolsExchange } from "@urql/devtools";
import { browser } from "$app/env";
import { isTokenExpired } from "../web3auth/jwt";

export const graphQLClient = (
  session,
  graphQLConfig: {
    ws: string;
    http: string;
    httpInternal?: string;
  },
  fetch,
  ws,
  stws,
  web3authPromise
) => {
  console.log("new client");
  const isServerSide = !browser;

  const fetchOptions = async () => {
    const accessToken = session.accessToken;
    const refreshToken = session.refreshToken;

    let currentTokenSet = {
      accessToken,
      refreshToken,
    };

    if (!!currentTokenSet.accessToken && !!currentTokenSet.refreshToken) {
      if (isTokenExpired(currentTokenSet.accessToken)) {
        currentTokenSet = await tokenRefresh(
          web3authPromise,
          currentTokenSet.refreshToken,
          `urql ${isServerSide ? "server" : "browser"} client - fetchOptions`
        );
      }
    } 

    const authHeaders: any = {};

    if (currentTokenSet.accessToken) {
      authHeaders.authorization = `Bearer ${currentTokenSet.accessToken}`;
    }

    return {
      headers: {
        ...authHeaders,
      },
    };
  };

  const subscriptionClient = new stws.SubscriptionClient(
    graphQLConfig.ws,
    {
      reconnect: true,
      connectionParams: fetchOptions,
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

          const authHeaders: any = {};

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
          const { authState } = options;
          const accessToken = session.accessToken;
          const refreshToken = session.refreshToken;

          const currentTokenSet = {
            accessToken,
            refreshToken,
          };

          if (!!currentTokenSet.accessToken && !!currentTokenSet.refreshToken) {
            if (isTokenExpired(currentTokenSet.accessToken)) {
              return await tokenRefresh(
                web3authPromise,
                currentTokenSet.refreshToken,
                `urql ${isServerSide ? "server" : "browser"} client - getAuth`
              );
            } else {
              return currentTokenSet
            }
          } else {
            return null
          }
        },
        willAuthError: ({ authState }) => {
          if (
            !authState?.accessToken ||
            isTokenExpired(authState?.accessToken)
          ) {
            return true;
          }
          return false;
        },
        didAuthError: ({ error }) => {
          if (error?.networkError && error.message.includes("JWTExpired"))
            return true;
          const hasGQLAuthErrors = error.graphQLErrors?.some(
            (e) => e.extensions?.code === "FORBIDDEN"
          );

          if (hasGQLAuthErrors) return true;

          return false;
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
