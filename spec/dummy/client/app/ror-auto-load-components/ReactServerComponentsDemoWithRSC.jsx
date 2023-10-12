'use server';

import React, { Suspense } from 'react';

import ReactServerComponent from './ReactServerComponent';

export default function ReactServerComponentsDemoWithRSC({ markdownText }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReactServerComponent markdownText={markdownText} />
    </Suspense>
  );
}
