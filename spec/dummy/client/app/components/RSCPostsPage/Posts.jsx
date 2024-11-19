import React, { Suspense } from "react";
import fetch from "node-fetch";
import _ from "lodash";
import Post from "./Post";

const Posts = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const posts = await ((await fetch(`https://jsonplaceholder.org/posts`)).json());
  const topFivePosts = _.take(posts, 5);

  return (
    <div>
      {topFivePosts.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}

export default Posts;
