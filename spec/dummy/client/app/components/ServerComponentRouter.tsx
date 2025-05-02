import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import RSCRoute from 'react-on-rails/RSCRoute';
// @ts-expect-error JS file
import EchoProps from './EchoProps';

export default function App({ basePath = '/server_router', ...props }: { basePath?: string }) {
  return (
    <>
      <nav>
        <Link to={`${basePath}/first`}>First Page</Link> |<Link to={`${basePath}/second`}>Second Page</Link> |
        <Link to={`${basePath}/third`}>Third Page</Link> |<Link to={`${basePath}/fourth`}>Fourth Page</Link> |
        <Link to={`${basePath}/fifth`}>Fifth Page</Link> |
        <Link to={`${basePath}/fifth/first`}>Fifth First Page</Link> |
        <Link to={`${basePath}/fifth/second`}>Fifth Second Page</Link> |
        <Link to={`${basePath}/sixth`}>Sixth Page</Link>
      </nav>
      <Routes>
        <Route
          path={`${basePath}/first`}
          element={<RSCRoute componentName="SimpleComponent" componentProps={{}} />}
        />
        <Route
          path={`${basePath}/second`}
          element={<RSCRoute componentName="MyServerComponent" componentProps={{}} />}
        />
        <Route path={`${basePath}/third`} element={<EchoProps {...props} />} />
        <Route
          path={`${basePath}/fourth`}
          element={<RSCRoute componentName="RSCPostsPage" componentProps={props} />}
        />
        <Route
          path={`${basePath}/fifth`}
          element={<RSCRoute componentName="ServerComponentRouterLayout" componentProps={props} />}
        >
          <Route path="first" element={<RSCRoute componentName="SimpleComponent" componentProps={{}} />} />
          <Route path="second" element={<RSCRoute componentName="MyServerComponent" componentProps={{}} />} />
        </Route>
        <Route
          path={`${basePath}/sixth`}
          element={<RSCRoute componentName="AsyncComponentsTreeForTesting" componentProps={props} />}
        />
      </Routes>
    </>
  );
}
