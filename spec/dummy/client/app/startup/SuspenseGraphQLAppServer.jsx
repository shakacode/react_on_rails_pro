import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getDataFromTree } from "@apollo/client/react/ssr";
import SuspenseGraphQL, { Context } from '../components/SuspenseGraphQL';
import {
  ApolloProvider,
  ApolloClient,
  createHttpLink,
  InMemoryCache
} from '@apollo/client';

export function Html({ content, state }) {
  return (
    <>
      <div id="root" dangerouslySetInnerHTML={{ __html: content }} />
      <script dangerouslySetInnerHTML={{
        __html: `window.__APOLLO_STATE__=${JSON.stringify(state).replace(/</g, '\\u003c')};`,
      }} />
    </>
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
    const App = <Context.Provider value="2">
      <ApolloProvider client={client}>
        <SuspenseGraphQL />
      </ApolloProvider>
    </Context.Provider>;
    const content = await getDataFromTree(App);
    const initialState = client.extract();
    const componentHtml = renderToStaticMarkup(
      <Html content={content} state={initialState} />
    );
    return { componentHtml };
  } catch (err) {
    // const componentHtml = `<div style="background-color: red;">${err.message}</div>`;
    const componentHtml = `<script type="text/javascript">console.log(">>> ${err.message}")</script>`;
    return { componentHtml };;
  }
};
