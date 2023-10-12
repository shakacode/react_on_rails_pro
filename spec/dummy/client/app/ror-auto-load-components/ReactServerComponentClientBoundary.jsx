'use client';

import React, { useState } from 'react';

export default function ReactServerComponentClientBoundary({
  renderedMarkdownText,
  fetchedGraphqlText,
  defaultAllowedTags,
  defaultAllowedAttributes,
}) {
  const [count, setCount] = useState(0);

  const allowedTags = [...defaultAllowedTags, ...['img', 'h1', 'h2', 'h3']];
  const allowedAttributes = { ...defaultAllowedAttributes, img: ['alt', 'src'] };

  return (
    <>
      <div>Counter: {count}</div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <div
        dangerouslySetInnerHTML={{
          __html: renderedMarkdownText,
          allowedTags,
          allowedAttributes,
        }}
      />
      <div>{fetchedGraphqlText}</div>
    </>
  );
}
