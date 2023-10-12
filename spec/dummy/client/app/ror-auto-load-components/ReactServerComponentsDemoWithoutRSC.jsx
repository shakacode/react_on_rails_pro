import React, { useState } from 'react';

import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

import 'cross-fetch/polyfill';
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://flyby-router-demo.herokuapp.com/',
  cache: new InMemoryCache(),
});

const GET_LOCATIONS = gql`
  query GetLocations {
    locations {
      id
      name
      description
      photo
    }
  }
`;

function ApolloDemoWithoutRSC({ markdownText }) {
  const [count, setCount] = useState(0);
  const { loading, error, data } = useQuery(GET_LOCATIONS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  const allowedTags = [...sanitizeHtml.defaults.allowedTags, ...['img', 'h1', 'h2', 'h3']];
  const allowedAttributes = { ...sanitizeHtml.defaults.allowedAttributes, img: ['alt', 'src'] };

  return (
    <>
      <div>Counter: {count}</div>
      <button onClick={() => setCount((oldCount) => oldCount + 1)}>Increment</button>
      <div
        dangerouslySetInnerHTML={{
          __html: marked(markdownText),
          allowedTags,
          allowedAttributes,
        }}
      />
      <div>{JSON.stringify(data)}</div>
    </>
  );
}

export default function ReactServerComponentsDemoWithoutRSC() {
  return (
    <ApolloProvider client={client}>
      <ApolloDemoWithoutRSC markdownText={'# Marked in the browser\n\nRendered on **Server**.'} />
    </ApolloProvider>
  );
}
