import React, { Suspense } from 'react';
import fetch from 'node-fetch';
import _ from 'lodash';
import Post from './Post';

const Posts = async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const posts = await (await fetch(`http://localhost:3000/api/posts`)).json();
  const postsByUser = _.groupBy(posts, 'user_id');
  const onePostPerUser = _.map(postsByUser, (group) => group[0]);

  return (
    <div>
      {onePostPerUser.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
};

export default Posts;
