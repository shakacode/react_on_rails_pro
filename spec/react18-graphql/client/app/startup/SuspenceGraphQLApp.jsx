import React from 'react';

function SuspenceGraphQLApp() {
  if (typeof window === `undefined`) {
    return <div style={{ width: 100, height: 100, backgroundColor: 'yellow' }}>Test</div>;
  } else {
    return <div style={{ width: 100, height: 100, backgroundColor: 'yellow' }}>Test</div>;
  }
}

export default SuspenceGraphQLApp;
