import React, { useContext } from 'react';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { hydrateRoot } from 'react-dom/client';
import ApolloGraphQL from '../components/ApolloGraphQL';

export default (props, _railsContext, domNodeId) => {
  // fulfill the store with the server data
  const initialState = window.__APOLLO_STATE__;
  const client = new ApolloClient({
    cache: new InMemoryCache().restore(initialState),
    link: {
      uri: 'http://localhost:3000/graphql',
      credentials: 'same-origin',
      headers: {},
    },
    ssrForceFetchDelay: 100,
  });
  const el = document.getElementById(domNodeId);
  const App = (
    <ApolloProvider client={client}>
      <ApolloGraphQL />
    </ApolloProvider>
  );
  hydrateRoot(el, App);
};
