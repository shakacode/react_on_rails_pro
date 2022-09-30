import React from "react";
import { renderToString } from 'react-dom/server';
import { getMarkupFromTree } from "@apollo/client/react/ssr";
import SuspenseGraphQL from '../components/SuspenseGraphQL';
import {
  ApolloProvider,
  ApolloClient,
  createHttpLink,
  InMemoryCache
} from '@apollo/client';

export default async (_props, _railsContext) => {
  const client = new ApolloClient({
    ssrMode: true,
    link: createHttpLink({
      uri: 'http://localhost:3000/graphql',
      credentials: 'same-origin',
      headers: {
      },
    }),
    cache: new InMemoryCache(),
  });
  const App = <ApolloProvider client={client}>
    <SuspenseGraphQL />
  </ApolloProvider>;

  const componentHtml = await getMarkupFromTree({
    renderFunction: renderToString,
    tree: App,
  });

  const initialState = client.extract();
  const dataTags = renderToString(<script dangerouslySetInnerHTML={{
    __html: `window.__APOLLO_STATE__=${JSON.stringify(initialState).replace(/</g, '\\u003c')};`,
  }} />);
  return { componentHtml, dataTags };
}
};
