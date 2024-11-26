import '../assets/styles/application.css';

import ReactOnRails from 'react-on-rails';
import React from 'react';
import { ClientRoot } from '../components/ClientRoot';
import Turbolinks from 'turbolinks';

const WrappedSimpleComponent = () => {
  return <ClientRoot componentName="SimpleComponent" />;
};

const WrappedRSCPostsPage = () => {
  return <ClientRoot componentName="RSCPostsPage" />;
};

const WrappedHelloWorld = () => {
  return <ClientRoot componentName="HelloWorld" />;
}

ReactOnRails.register({
  // HelloWorld: WrappedHelloWorld,
  SimpleComponent: WrappedSimpleComponent,
  RSCPostsPage: WrappedRSCPostsPage,
});

const urlParams = new URLSearchParams(window.location.search);
const enableTurbolinks = urlParams.get('enableTurbolinks') === 'true'
if (enableTurbolinks) {
  Turbolinks.start();

  document.addEventListener('turbolinks:load', () => {
    console.log('Turbolinks loaded from client-bundle.js');
  });
}

ReactOnRails.setOptions({
  traceTurbolinks: true,
  turbo: enableTurbolinks,
});
