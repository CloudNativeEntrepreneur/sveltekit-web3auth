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
import { tokenRefresh, accessToken, refreshToken } from "../web3auth/Web3Auth.svelte";
import { devtoolsExchange } from "@urql/devtools";
import { browser } from "$app/env";
import { isTokenExpired } from "../web3auth/jwt";
import debug from 'debug'
import { get } from 'svelte/store'


const log = debug('sveltekit-web3auth:lib/graphQL/urql')

const graphQLClients = []

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
  stws,
  web3authPromise
}) => {
  const {
    id,
    session,
    graphql,
    fetch,
    ws,
    stws,
    web3authPromise
  } = options

  const sessionAccessToken = session.accessToken;
  const sessionRefreshToken = session.refreshToken;

  let currentTokenSet = {
    accessToken: sessionAccessToken,
    refreshToken: sessionRefreshToken,
  };

  const authHeaders: any = {};
  if (currentTokenSet.accessToken) {
    authHeaders.authorization = `Bearer ${currentTokenSet.accessToken}`;
  }
  let fetchOptions = {
    headers: {
      ...authHeaders
    }
  }
  log('gql client init', { authHeaders })

  const existingClient = graphQLClients.find(c => c.id === id)
  const isServerSide = !browser;
  if (existingClient) {
    log('found existing client', {isServerSide, id, existingClient, fetchOptions})
    existingClient.fetchOptions = fetchOptions
    return existingClient
  }

  log("new gql client", { isServerSide, id });

  // const fetchOptions = (caller) => () => {
  //   log('fetchOptions', { isServerSide, id, caller })
  // const accessToken = session.accessToken;
  // const refreshToken = session.refreshToken;

  // let currentTokenSet = {
  //   accessToken,
  //   refreshToken,
  // };

  //   if (!!currentTokenSet.accessToken && !!currentTokenSet.refreshToken) {
  //     if (isTokenExpired(currentTokenSet.accessToken)) {
  //       // currentTokenSet = await tokenRefresh(
  //       //   web3authPromise,
  //       //   currentTokenSet.refreshToken,
  //       //   `urql ${isServerSide ? "server" : "browser"} client - fetchOptions`
  //       // );
  //       log('fetch options token is expired')
  //     }
  //   }

  //   const authHeaders: any = {};

  // if (currentTokenSet.accessToken) {
  //   authHeaders.authorization = `Bearer ${currentTokenSet.accessToken}`;
  // }

  //   return {
  //     headers: {
  //       ...authHeaders,
  //     },
  //   };
  // };

  const subscriptionClient = new stws.SubscriptionClient(
    graphql.ws,
    {
      reconnect: true,
      connectionParams: (params) => {
        log('getting subscription connections params', params)

        let currentAccessToken = get(accessToken)
        const authHeaders: any = {};
        if (currentAccessToken) {
          authHeaders.authorization = `Bearer ${currentAccessToken}`;
        }
        let fetchOptions = {
          headers: {
            ...authHeaders
          }
        }
        return fetchOptions
      }
    },
    isServerSide ? ws : WebSocket
  );

  const ssr = ssrExchange({
    isClient: !isServerSide,
    initialState: !isServerSide ? (window as any).__URQL_DATA__ : undefined,
  });

  // const authExchangeInstance = authExchange({
  //   addAuthToOperation: (options: { authState: any; operation: any }) => {
  //     const { authState, operation } = options;
  //     log('addAuthToOperation', { isServerSide, id, authState, operation, operationKind: operation.kind, fetchOptions })

  //     if (!authState || !authState.accessToken) {
  //       return operation;
  //     }
  //     // fetchOptions can be a function (See Client API) but you can simplify this based on usage
  //     // const fetchOptions =
  //     //   typeof operation.context.fetchOptions === "function"
  //     //     ? operation.context.fetchOptions('addAuthToOperation')()
  //     //     : operation.context.fetchOptions || {};

  //     const authHeaders: any = {};

  //     if (authState.accessToken) {
  //       authHeaders.authorization = `Bearer ${authState.accessToken}`;
  //     }

  //     log('fetchOptions vs authHeaders', authHeaders.authorization === fetchOptions.headers.authorization)

  //     const newOperation = makeOperation(
  //       operation.kind, 
  //       operation, 
  //       {
  //         ...operation.context,
  //         fetchOptions: {
  //           headers: {
  //             ...authHeaders,
  //           },
  //         },
  //       }
  //     );

  //     log({newOperation})

  //     return newOperation;
  //   },
  //   getAuth: async (options: { authState: any }) => {
  //     const { authState } = options;
  //     const accessToken = session.accessToken;
  //     const refreshToken = session.refreshToken;

  //     const currentTokenSet = {
  //       accessToken,
  //       refreshToken,
  //     };
  //     log('getAuth', { isServerSide, id, authState, currentTokenSet, fetchOptions })

  //     if (!!currentTokenSet.accessToken && !!currentTokenSet.refreshToken) {
  //       if (isTokenExpired(currentTokenSet.accessToken)) {
  //         log('!! getAuth - Token expired !!')
  //         // return await tokenRefresh(
  //         //   web3authPromise,
  //         //   currentTokenSet.refreshToken,
  //         //   `urql ${isServerSide ? "server" : "browser"} client - getAuth`
  //         // );
  //       } else {
  //         return currentTokenSet;
  //       }
  //     } else {
  //       return null;
  //     }
  //     return currentTokenSet

  //   },
  //   willAuthError: ({ authState }) => {
  //     let willError = false
  //     if (
  //       !authState?.accessToken ||
  //       isTokenExpired(authState?.accessToken)
  //     ) {
  //       willError = true;
  //     }

  //     log('willAuthError', willError)
  //     return willError;
  //   },
  //   didAuthError: ({ error }) => {
  //     log('error occurred - checking if it was due to auth', error)
  //     let didAuthError = false

  //     if (error?.networkError && error.message.includes("JWTExpired")) {
  //       didAuthError = true
  //     }

  //     const hasGQLAuthErrors = error.graphQLErrors?.some(
  //       (e) => 
  //         e.extensions?.code === "FORBIDDEN" ||
  //         e.extensions?.code === "invalid-jwt"
  //       );

  //     if (hasGQLAuthErrors) {
  //       didAuthError = true
  //     }

  //     log('didAuthError', didAuthError)
  //     return didAuthError;
  //   },
  // })

  const serverExchanges = [
    devtoolsExchange,
    dedupExchange,
    cacheExchange,
    // authExchangeInstance,
    ssr,
    fetchExchange
  ]

  const clientExchanges = [
    devtoolsExchange,
    dedupExchange,
    cacheExchange,
    // authExchangeInstance,
    ssr,
    fetchExchange,
    subscriptionExchange({

      forwardSubscription(operation) {
        log('forwarding subscription', operation, subscriptionClient)
        // subscriptionClient.connectionParams = () => operation.context.fetchOptions
        return subscriptionClient.request(operation);
      },
    }),
  ]

  const serverConfig = {
    url: graphql.httpInternal || graphql.http,
    preferGetMethod: false,
    fetch,
    fetchOptions,
    exchanges: serverExchanges,
  }

  const clientConfig = {
    url: graphql.http,
    preferGetMethod: false,
    fetch,
    fetchOptions,
    exchanges: clientExchanges,
    requestPolicy: "cache-and-network",
  };

  // const urqlConfig = Object.assign({}, clientConfig, {
  //   fetchOptions: fetchOptions(`urql-${id}`),
  // });

  const client = isServerSide ? createClient(serverConfig) : createClient(clientConfig as any);

  Object.assign(client, { id })
  log('created client', { client })

  graphQLClients.push(client)

  return client
};
