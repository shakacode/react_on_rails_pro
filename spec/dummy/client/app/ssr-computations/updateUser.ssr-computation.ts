import { gql } from "@apollo/client";
import { fetchSubscriptions } from '@shakacode/use-ssr-computation.runtime';
import { initilizeApolloClient } from "../utils/lazyApollo";
import { isSSR } from '../utils/dom';

const UPDATE_USER_MUTATION = gql`
  mutation updateUser($user_id: ID!, $newName: String!) {
    update_user(user_id: $user_id, newName: $newName) {
      id
      name
      email
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
  const apolloClient = initilizeApolloClient();

  apolloClient.mutate({
    mutation: UPDATE_USER_MUTATION,
    variables: { id: userId, newName },
  }).then((result) => {
    if (!isUnsubscribed) {
      next({ loading: false });
    }
  }).catch((error) => {
    if (!isUnsubscribed) {
      next({ loading: false, error });
    }
  });

  return () => {
    isUnsubscribed = true;
  };
}
