import React, { Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import RSCRoute from 'react-on-rails/RSCRoute';
// @ts-expect-error JS file
import EchoProps from './EchoProps';
import ErrorBoundary from './ErrorBoundary';

export default function App({ basePath = '/server_router', ...props }: { basePath?: string }) {
  return (
    <ErrorBoundary>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li>
            <Link to={`${basePath}/simple-server-component`}>Simple Server Component</Link>
          </li>
          <li>
            <Link to={`${basePath}/another-server-component`}>Another Simple Server Component</Link>
          </li>
          <li>
            <Link to={`${basePath}/client-component`}>Client Component</Link>
          </li>
          <li>
            <Link to={`${basePath}/complex-server-component`}>Complex Server Component</Link>
          </li>
          <li>
            <Link to={`${basePath}/nested-router`}>Server Component With Empty Sub Router</Link>
          </li>
          <li>
            <Link to={`${basePath}/nested-router/simple-server`}>
              Server Component with Simple Server Component in sub route
            </Link>
          </li>
          <li>
            <Link to={`${basePath}/nested-router/client-component`}>
              Server Component with Client Component in sub route
            </Link>
          </li>
          <li>
            <Link to={`${basePath}/streaming-server-component`}>
              Server Component with visible streaming behavior
            </Link>
          </li>
        </ul>
      </nav>
      <Suspense fallback={<div>Loading Page...</div>}>
        <Routes>
          <Route
            path={`${basePath}/simple-server-component`}
            element={<RSCRoute componentName="SimpleComponent" componentProps={{}} />}
          />
          <Route
            path={`${basePath}/another-server-component`}
            element={<RSCRoute componentName="MyServerComponent" componentProps={{}} />}
          />
          <Route path={`${basePath}/client-component`} element={<EchoProps {...props} />} />
          <Route
            path={`${basePath}/complex-server-component`}
            element={<RSCRoute componentName="RSCPostsPage" componentProps={props} />}
          />
          <Route
            path={`${basePath}/nested-router`}
            element={<RSCRoute componentName="ServerComponentRouterLayout" componentProps={props} />}
          >
            <Route
              path="simple-server"
              element={<RSCRoute componentName="SimpleComponent" componentProps={{}} />}
            />
            <Route path="client-component" element={<EchoProps {...props} />} />
          </Route>
          <Route
            path={`${basePath}/streaming-server-component`}
            element={<RSCRoute componentName="AsyncComponentsTreeForTesting" componentProps={props} />}
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
