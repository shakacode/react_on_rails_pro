import * as React from 'react'
import Outlet from "../components/RouterOutelet";
// @ts-expect-error JS file
import ToggleContainer from '../components/RSCPostsPage/ToggleContainer';

const LoadingSubRoute = () => {
  console.log('LoadingSubRoute rendered [DEBUG RSC]');
  return <script dangerouslySetInnerHTML={{ __html: "console.log('LoadingSubRoute rendered [DEBUG RSC]');" }} />;
}

export default function ServerComponentRouterLayout() {
  return (
    <div>
      <h1>Server Component Router Layout</h1>
      <p>This is the layout for the server component router.</p>
      <p>The following is the content of the server component router child route:</p>
      <ToggleContainer childrenTitle="sub-route">
        <React.Suspense fallback={<LoadingSubRoute />}>
          <Outlet />
        </React.Suspense>
      </ToggleContainer>
    </div>
  )
}
