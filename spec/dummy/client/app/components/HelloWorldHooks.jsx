'use client';

// Super simple example of the simplest possible React component
import React, { useState } from 'react';

// TODO: make more like the HelloWorld.jsx
function HelloWorldHooks(props) {
  console.log('This is HelloWorldHooks component and this is a unique message');
  const [name, setName] = useState(props.helloWorldData.name);
  return (
    <div>
      <h3>Hello, {name}!</h3>
      <p>
        Say hello to:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </p>
    </div>
  );
}

export default HelloWorldHooks;
