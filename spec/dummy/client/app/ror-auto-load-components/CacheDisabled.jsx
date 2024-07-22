"use client";

import React from 'react';

const CacheDisabled = () => {
  React.useEffect(() => {
    // This will be called on component unmount
    return () => console.log('CacheDisabled#componentWillUnmount');
  }, []);

  return (
    <div className="container">
      <h2>Turbolinks cache is disabled</h2>
      <p>Must call componentWillUnmount.</p>
    </div>
  );
};

export default CacheDisabled;
