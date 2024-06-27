import React from 'react';

const LargeComponent = ({ numOfChildren }) => {
  const children = [];
  for (let i = 0; i < numOfChildren; i++) {
    children.push(<div key={i}>Child {i}</div>);
  }
  return <div>{children}</div>;
}

export default LargeComponent;
