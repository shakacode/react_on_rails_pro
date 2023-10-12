import '../assets/styles/application.css';

import ReactOnRails from 'react-on-rails';

import SharedReduxStore from '../stores/SharedReduxStore';

import '../ror-auto-load-components/ReactServerComponentClientBoundary';

ReactOnRails.setOptions({
  traceTurbolinks: true,
});

ReactOnRails.registerStore({
  SharedReduxStore,
});
