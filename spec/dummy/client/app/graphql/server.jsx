import React from 'react';
import { ApolloProvider, getDataFromTree } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from "apollo-cache-inmemory";
import fetch from 'cross-fetch';
import Root from './root';

const client = new ApolloClient({
  ssrMode: true,
  link: createHttpLink({
    uri: 'https://www.graphqlhub.com/graphql',
    credentials: 'same-origin',
    fetch: fetch,
  }),
  cache: new InMemoryCache(),
});

const App = (
  <ApolloProvider client={client}>
    <Root />
  </ApolloProvider>
);

console.log(typeof App);

const setup = getDataFromTree(App).then(() => {
  // We are ready to render for real
  const html = ReactDOM.renderToString(App);
  const initialState = JSON.stringify(client.extract());

  return <div id="root" dangerouslySetInnerHTML={{ __html: html }} data-graphql-cache={initialState} />;
});

export default setup;
