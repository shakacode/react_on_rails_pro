import React from 'react';
import { renderToString } from 'react-dom/server';

/**
 * TODO: Node rendering server should handle a timeout.
 */
export default async (_props, _railsContext) => {
  console.log(`Console log from Sync Server`);

  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log(`Console log from Simple Async Function at iteration ${i}`);
  }

  console.log(`Console log from Async Server after calling async functions`);
  const element = <div>Disable javascript in your browser options to confirm this value is set by setTimeout during SSR.</div>;
  return renderToString(element);
};
