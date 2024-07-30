import '../assets/styles/application.css';

import ReactOnRails from 'react-on-rails';
import React from 'react';
import { ClientRoot } from '../components/ClientRoot';

const WrappedSimpleComponent = () => {
  return <ClientRoot componentName="SimpleComponent" />;
};

ReactOnRails.register({
  SimpleComponent: WrappedSimpleComponent,
});

ReactOnRails.setOptions({
  traceTurbolinks: true,
});
