'use client';

import React from 'react';
import PreloadedPosts from '../components/RSCPostsPage/PreloadedPosts';
import HelloWorld from '../components/HelloWorld.jsx';

const PostsPage = ({ posts, ...props }) => {
  return (
    <div>
      <HelloWorld {...props} />
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Posts Page</h1>
      <PreloadedPosts posts={posts} />
    </div>
  );
};

export default PostsPage;
