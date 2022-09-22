import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import SuspenceGraphQlApp from './SuspenceGraphQlApp';

const suspenceGraphQlApp = (props, _railsContext, domNodeId) => {
  console.log(">>> App!")
  const root = document.getElementById(domNodeId);
  hydrateRoot(root, <SuspenceGraphQlApp {...props} />);
};

export default suspenceGraphQlApp;
