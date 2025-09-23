import React from 'react';

interface RSCRouteProps {
  componentName: string;
  componentProps: Record<string, any>;
}

const RSCRoute: React.FC<RSCRouteProps> = ({ componentName, componentProps }) => {
  // This is a placeholder implementation for RSCRoute
  // The actual implementation should fetch and render the server component
  return (
    <div data-rsc-component={componentName}>
      <div>Loading server component: {componentName}</div>
      <pre>{JSON.stringify(componentProps, null, 2)}</pre>
    </div>
  );
};

export default RSCRoute;