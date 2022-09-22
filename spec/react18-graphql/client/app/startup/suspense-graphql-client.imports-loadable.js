import React from 'react';
import ReactDOM from 'react-dom';

import SuspenceGraphQLApp from './SuspenceGraphQLApp';

const App = (props, _railsContext, domNodeId) => {
  ReactDOM.hydrate(<SuspenceGraphQLApp {...props} />, document.getElementById(domNodeId));
};

export default App;
