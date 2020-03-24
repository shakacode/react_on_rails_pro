import React from 'react';
import { BrowserRouter, StaticRouter } from 'react-router-dom';

import Header from './Header';
import Routes from './Routes';

const App = () => {
  if (typeof window === `undefined`) {
    return (
      <StaticRouter location={props.requestPath} context={{}}>
        <Header />
        <Routes />
      </StaticRouter>
    );
  }
  return (
    <BrowserRouter>
      <Header />
      <Routes />
    </BrowserRouter>
  );
};

export default App;
