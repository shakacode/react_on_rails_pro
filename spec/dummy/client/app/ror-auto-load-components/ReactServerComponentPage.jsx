import React, { Suspense } from 'react';
import ReactServerComponent from '../components/ReactServerComponent';
import Posts from '../components/RSCPostsPage/Posts';

const ReactServerComponentPage = () => {
  return (
    <div>
      <ReactServerComponent />
      <Suspense fallback={<div>Loading...</div>}>
        <Posts />
      </Suspense>
    </div>
  );
};

export default ReactServerComponentPage;
