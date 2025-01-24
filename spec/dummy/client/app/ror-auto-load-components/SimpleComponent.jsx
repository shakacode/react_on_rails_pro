import React, { Suspense } from 'react';

async function AsyncComponent() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return <div>AsyncComponent</div>;
}

export default function StaticServerComponent() {
  return (
    <div>
      <h1>StaticServerComponent</h1>
      <p>This is a static server component</p>
      <Suspense fallback={<div>Loading AsyncComponent...</div>}>
        <AsyncComponent />
      </Suspense>
    </div>
  )
}
