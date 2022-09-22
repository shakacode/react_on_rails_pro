import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import SuspenceGraphQLApp from './SuspenceGraphQLApp';

const suspenceGraphQLApp = (props, _railsContext, domNodeId) => {
  console.log(">>> App!")
  const root = document.getElementById(domNodeId);
  hydrateRoot(root, <SuspenceGraphQLApp {...props} />);
};

export default suspenceGraphQLApp;
