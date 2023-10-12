'use server';

import React from 'react';

import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

import 'cross-fetch/polyfill';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';
import { registerApolloClient } from '@apollo/experimental-nextjs-app-support/rsc';

import ReactServerComponentClientBoundary from './ReactServerComponentClientBoundary';

const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      // this needs to be an absolute url, as relative urls cannot be used in SSR
      uri: 'https://flyby-router-demo.herokuapp.com/',
      // you can disable result caching here if you want to
      // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
      // fetchOptions: { cache: "no-store" },
    }),
  });
});

export default async function ReactServerComponent({ markdownText }) {
  const result = await getClient().query({
    query: gql`
      query GetLocations {
        locations {
          id
          name
          description
          photo
        }
      }
    `,
  });

  return (
    <ReactServerComponentClientBoundary
      renderedMarkdownText={marked(markdownText)}
      fetchedGraphqlText={JSON.stringify(result)}
      defaultAllowedTags={sanitizeHtml.defaults.allowedTags}
      defaultAllowedAttributes={sanitizeHtml.defaults.allowedAttributes}
    />
  );
}
