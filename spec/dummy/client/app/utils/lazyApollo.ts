import type {ApolloClient, NormalizedCacheObject} from "@apollo/client";

export type AppApolloClient = ApolloClient<NormalizedCacheObject>;

let apolloClient: AppApolloClient | undefined;
export const getApolloClient = () => {
  if (!apolloClient) {
    throw new Error("Apollo client not found");
  }
  return apolloClient;
}

export const setApolloClient = (client: AppApolloClient): void => {
  apolloClient = client;
}
