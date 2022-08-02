import React from 'react';
import { renderToString } from 'react-dom/server';

/**
 * TODO: Node rendering server should handle a timeout.
 */
 export default async (_props, _railsContext) => {
   // eslint-disable-next-line no-console
   let x = 'initial value';
   x = await new Promise(resolve => {
    setTimeout(() => {
      resolve('value set by setTimeout');
    }, 1);
  });
   const Komponent = <div>Called setTimeout and returned this {x}.</div>
   return {
     componentHtml: renderToString(<Komponent />)
   };
 };
