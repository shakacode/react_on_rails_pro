import React, { Suspense } from 'react';
import moment from 'moment';
import Comments from './Comments';

const Post = ({ post }) => {
  // render the post with its thumbnail
  return (
    <div style={{ border: '1px solid black', margin: '10px', padding: '10px' }}>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <p>
        Created <span style={{ fontWeight: 'bold' }}>{moment(post.createdAt).fromNow()}</span>
      </p>
      <img src={post.thumbnail} alt={post.title} />
      <Suspense fallback={<div>Loading Comments...</div>}>
        <Comments postId={post.id} />
      </Suspense>
    </div>
  );
};

export default Post;
