import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SuspenseGraphQL from '../components/SuspenseGraphQL';

export default async (_props, _railsContext) => {
  const componentHtml = renderToStaticMarkup(<SuspenseGraphQL />);
  return { componentHtml };
};
