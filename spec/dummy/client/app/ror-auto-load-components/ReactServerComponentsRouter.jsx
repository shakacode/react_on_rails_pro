'use client';

import React from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';
import ReactOnRailsPro from 'react-on-rails-pro';

export default function ReactServerComponentsRouter() {
  return (
    <BrowserRouter>
      <Switch>
        <ReactOnRailsPro.RSCRoute
          path="/react_server_components_router"
          componentName="ReactServerComponentsDemoWithRSC"
          props={{ markdownText: '# Marked in the browser\n\nRendered on **Server**.' }}
        />
      </Switch>
    </BrowserRouter>
  );
}
