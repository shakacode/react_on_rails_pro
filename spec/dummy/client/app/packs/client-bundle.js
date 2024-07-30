import '../assets/styles/application.css';

import ReactOnRails from 'react-on-rails';
import React from 'react';
import { ClientRoot } from '../components/ClientRoot';

const WrappedSimpleComponent = () => {
  return <ClientRoot componentName="SimpleComponent" />;
};

const WrappedRSCPostsPage = () => {
  return <ClientRoot componentName="RSCPostsPage" />;
};

ReactOnRails.register({
  SimpleComponent: WrappedSimpleComponent,
  RSCPostsPage: WrappedRSCPostsPage,
});

ReactOnRails.setOptions({
  traceTurbolinks: true,
});
