import React from 'react';
import { renderToString } from 'react-dom/server';
import { getMarkupFromTree } from '@apollo/client/react/ssr';
import ApolloGraphQL from '../components/ApolloGraphQL';
import { ApolloProvider, ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';

export default async (_props, _railsContext) => {
  const client = new ApolloClient({
    ssrMode: true,
    link: createHttpLink({
      uri: 'http://localhost:3000/graphql',
    }),
    cache: new InMemoryCache(),
  });
  const App = (
    <ApolloProvider client={client}>
      <ApolloGraphQL />
    </ApolloProvider>
  );

  const componentHtml = await getMarkupFromTree({
    renderFunction: renderToString,
    tree: App,
  });

  const initialState = client.extract();
  // you need to return additional property `dataTags`, to fullfill the state for hydration
  const dataTags = renderToString(
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__APOLLO_STATE__=${JSON.stringify(initialState).replace(/</g, '\\u003c')};`,
      }}
    />,
  );
  return { componentHtml, dataTags };
};
