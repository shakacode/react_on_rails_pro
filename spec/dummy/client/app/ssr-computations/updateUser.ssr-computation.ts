import { gql } from "@apollo/client";
import { fetchSubscriptions } from '@shakacode/use-ssr-computation.runtime';
import { initializeApolloClient } from "../utils/lazyApollo";
import { isSSR } from '../utils/dom';

const UPDATE_USER_MUTATION = gql`
  mutation updateUser($userId: ID!, $newName: String!) {
    updateUser(input: {userId: $userId, newName: $newName}) {
      user {
        id
        name
        email
      }
    }
  }
`;

export const compute = () => {
  if (isSSR) {
    throw new Error("The mutation should not be called on server-side");
  }
  fetchSubscriptions();
  return { loading: true };
};

export const subscribe = (
  getCurrentResult: () => any,
  next: (result: any) => void,
  userId: number,
  newName: string,
) => {
  let isUnsubscribed = false;
  const apolloClient = initializeApolloClient();

  apolloClient.mutate({
    mutation: UPDATE_USER_MUTATION,
    variables: { userId, newName },
  }).then((result) => {
    if (!isUnsubscribed) {
      next({ loading: false });
    }
  }).catch((error) => {
    if (!isUnsubscribed) {
      next({ loading: false, error });
    }
  });

  return {
    unsubscribe: () => {
      isUnsubscribed = true;
    },
  };
}
