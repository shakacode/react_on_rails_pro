import React, { Suspense } from 'react';
import fetch from 'node-fetch';
import RSCPostsPage from '../components/RSCPostsPage/Main';

const fetchPosts = async () => {
  const response = await fetch('http://localhost:3000/api/posts');
  return response.json();
};

const fetchComments = async (postId) => {
  const response = await fetch(`http://localhost:3000/api/posts/${postId}/comments`);
  return response.json();
};

const RSCPostsPageOverHTTP = (props) => {
  return <RSCPostsPage {...props} fetchPosts={fetchPosts} fetchComments={fetchComments} />;
};

export default RSCPostsPageOverHTTP;
