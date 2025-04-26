import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import RSCRoute from 'react-on-rails/RSCRoute'
// @ts-expect-error JS file
import EchoProps from './EchoProps';

export default function App(props: object) {
  return (
    <>
      <nav>
        <Link to="/server_router/first">First Page</Link> |
        <Link to="/server_router/second">Second Page</Link> |
        <Link to="/server_router/third">Third Page</Link> |
        <Link to="/server_router/fourth">Fourth Page</Link> |
        <Link to="/server_router/fifth">Fifth Page</Link> |
        <Link to="/server_router/fifth/first">Fifth First Page</Link> |
        <Link to="/server_router/fifth/second">Fifth Second Page</Link>
      </nav>
      <Routes>
        <Route path="/server_router/first" element={<RSCRoute componentName='SimpleComponent' componentProps={{}} />} />
        <Route path="/server_router/second" element={<RSCRoute componentName='MyServerComponent' componentProps={{}} />} />
        <Route path="/server_router/third" element={<EchoProps {...props} />} />
        <Route path="/server_router/fourth" element={<RSCRoute componentName='RSCPostsPage' componentProps={props} />} />
        <Route path="/server_router/fifth" element={<RSCRoute componentName='ServerComponentRouterLayout' componentProps={props} />}>
          <Route path="first" element={<RSCRoute componentName='SimpleComponent' componentProps={{}} />} />
          <Route path="second" element={<RSCRoute componentName='MyServerComponent' componentProps={{}} />} />
        </Route>
      </Routes>
    </>
  )
}
