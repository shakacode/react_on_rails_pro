import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from "apollo-cache-inmemory";
import Root from './root';

const client = new ApolloClient({
  link: createHttpLink({
    uri: 'https://www.graphqlhub.com/graphql',
    credentials: 'same-origin',
  }),
  cache: new InMemoryCache().restore(JSON.parse(document.getElementById('root').getAttribute('data-graphql-cache'))),
});

const App = (
  <ApolloProvider client={client}>
    <Root />
  </ApolloProvider>
);

export default App;
