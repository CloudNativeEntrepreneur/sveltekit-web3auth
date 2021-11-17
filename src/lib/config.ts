import {
  VITE_HASURA_GRAPHQL_URL,
  VITE_HASURA_GRAPHQL_INTERNAL_URL,
  VITE_HASURA_GRAPHQL_WS_URL,
} from "$lib/env";

export default {
  graphql: {
    http: VITE_HASURA_GRAPHQL_URL,
    httpInternal: VITE_HASURA_GRAPHQL_INTERNAL_URL,
    ws: VITE_HASURA_GRAPHQL_WS_URL,
  },
};
