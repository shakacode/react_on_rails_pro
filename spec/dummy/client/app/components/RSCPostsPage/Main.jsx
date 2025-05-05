import React, { Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import Posts from './Posts';
import HelloWorld from '../HelloWorldHooks.jsx';
import ErrorComponent from '../ErrorComponent.jsx';
import Spinner from '../Spinner.jsx';

const RSCPostsPage = ({ artificialDelay, postsCount, fetchPosts, fetchComments, ...props }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorComponent}>
      <div>
        <HelloWorld {...props} />
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>RSC Posts Page</h1>
        <Suspense fallback={<Spinner />}>
          <Posts
            artificialDelay={artificialDelay}
            postsCount={postsCount}
            fetchPosts={fetchPosts}
            fetchComments={fetchComments}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default RSCPostsPage;
