import React, { Suspense } from 'react';
import User from './User';

const Comment = ({ comment }) => {
  return (
    <div>
      <p>{comment.comment}</p>
      <Suspense fallback={<div>Loading User...</div>}>
        <User userId={comment.userId} />
      </Suspense>
    </div>
  );
};

export default Comment;
