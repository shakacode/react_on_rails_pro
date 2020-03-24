// See docs/loadable-components.md for details regarding **.imports-X.** file extension & duplicate file structure.
import React from 'react';
import ReactDOM from 'react-dom';

import { loadableReady } from '@loadable/component';

import ClientApp from '../src/App';

const App = (props, _railsContext, domNodeId) => {
  // __webpack_public_path__ = props.webpackPublicPath; // eslint-disable-line

  loadableReady(() => {
    ReactDOM.hydrate(React.createElement(ClientApp, { ...props }), document.getElementById(domNodeId));
  });
};

export default App;
