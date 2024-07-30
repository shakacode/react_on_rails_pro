import { use } from 'react';
import RSDWClient from 'react-server-dom-webpack/client';

const renderCache = {};

const fetchRSC = ({ componentName }) => {
  if (!renderCache[componentName]) {
    renderCache[componentName] = RSDWClient.createFromFetch(fetch(`/rsc/${componentName}`));
  }
  return renderCache[componentName];
}

export const ClientRoot = (componentName) => {
  return use(fetchRSC(componentName));
}
