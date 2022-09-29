import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getDataFromTree } from "@apollo/client/react/ssr";
import SuspenseGraphQL from '../components/SuspenseGraphQL';
import {
  ApolloProvider,
  ApolloClient,
  createHttpLink,
  InMemoryCache
} from '@apollo/client';

export function Html({ content, state }) {
  return (
    <html>
      <body>
        <div id="root" dangerouslySetInnerHTML={{ __html: content }} />
        <script dangerouslySetInnerHTML={{
          __html: `window.__APOLLO_STATE__=${JSON.stringify(state).replace(/</g, '\\u003c')};`,
        }} />
      </body>
    </html>
  );
}

export default async (_props, _railsContext) => {

  try {
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
    const content = await getDataFromTree(App);
    // const initialState = client.extract();
    // const html = <Html content={content} state={initialState} />;
    // const componentHtml = renderToStaticMarkup(App);
    const componentHtml = "<div>YEAH!!!!!!!!!! </div>";
    return { componentHtml };
  } catch (err) {
    const componentHtml = `<div style="background-color: red;">${err.message}</div>`;
    return { componentHtml };;
  }
};
