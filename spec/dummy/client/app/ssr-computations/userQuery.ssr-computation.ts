import { gql } from "@apollo/client";
import { getApolloClient } from "../utils/lazyApollo";

const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

export const preloadQuery = (userId: number) => {
  const apolloClient = getApolloClient();
  return apolloClient.query({
    query: USER_QUERY,
    variables: { id: userId },
  });
}

export const compute = (userId: number) => {
  const apolloClient = getApolloClient();
  return apolloClient.cache.readQuery({
    query: USER_QUERY,
    variables: { id: userId },
  });
};
