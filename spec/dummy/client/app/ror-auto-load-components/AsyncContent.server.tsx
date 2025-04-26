'use client';

import * as React from 'react';
import { Suspense } from 'react';
// @ts-expect-error JS component
import ToggleContainer from '../components/RSCPostsPage/ToggleContainer';

const AsyncComponent = async ({ promise, children }: { promise: Promise<React.ReactNode>, children: React.ReactNode }) => {
  await promise;
  return children;
}

const LoadingComponent = ({ content }: { content: string }) => {
  console.log(`LoadingComponent rendered ${content} [DEBUG RSC]`);
  return <ToggleContainer childrenTitle="qqq">{content}</ToggleContainer>;
}

const RealComponent = ({ content }: { content: string }) => {
  console.log(`RealComponent rendered ${content} [DEBUG RSC]`);
  return <div>{content}</div>;
}

function AsyncContent() {
  const promise1 = new Promise((resolve) => setTimeout(resolve, 1000));
  const promise2 = new Promise((resolve) => setTimeout(resolve, 2000));
  const promise3 = new Promise((resolve) => setTimeout(resolve, 3000));

  return (
    <div>
      <Suspense fallback={<LoadingComponent content="Loading Suspense Boundary1" />}>
        {/* @ts-expect-error */}
        <AsyncComponent promise={promise1}>
          <RealComponent content="Async Component 1 from Suspense Boundary1" />
        </AsyncComponent>
        {/* @ts-expect-error */}
        <AsyncComponent promise={promise2}>
          <RealComponent content="Async Component 2 from Suspense Boundary1" />
        </AsyncComponent>
      </Suspense>
      <Suspense fallback={<LoadingComponent content="Loading Suspense Boundary2" />}>
        {/* @ts-expect-error */}
        <AsyncComponent promise={promise3}>
          <RealComponent content="Async Component 33 from Suspense Boundary2" />
        </AsyncComponent>
      </Suspense>
      <Suspense fallback={<LoadingComponent content="Loading Suspense Boundary3" />}>
        {/* @ts-expect-error */}
        <AsyncComponent promise={promise2}>
          <RealComponent content="Async Component 3 from Suspense Boundary3" />
        </AsyncComponent>
      </Suspense>
    </div>
  )
}

export default AsyncContent;
// export default wrapServerComponentRenderer(AsyncContent);
