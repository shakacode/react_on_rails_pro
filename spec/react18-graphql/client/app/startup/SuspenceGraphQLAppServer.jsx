import React from 'react';
import { renderToString } from "react-dom/server";

function SuspenceGraphQlApp() {
  return <div style={{ width: 100, height: 100, backgroundColor: 'yellow' }}>Test</div>;
}

export default async () => {
  return renderToString(<div>123</div>);
};
