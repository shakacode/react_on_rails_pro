import React from 'react';
import { contextStore } from '../utils/als';

const ALS = () => {
  const context = contextStore.getStore();
  return (
    <div>
      <p>Number of contexts: {context.getStack().length}</p>
      {context.getStack().map((c, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={index}>
          <pre>{c.stack}</pre>
          {index < context.getStack().length - 1 && <hr />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ALS;
