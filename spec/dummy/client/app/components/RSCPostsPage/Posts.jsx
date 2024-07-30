import React, { Suspense } from "react";
import fetch from "node-fetch";
import _ from "lodash";
import Post from "./Post";

const Posts = async () => {
  const posts = await ((await fetch(`https://jsonplaceholder.org/posts`)).json());
  const topFivePosts = _.take(posts, 5);

  return (
    <div>
      {topFivePosts.map(post => (
        <Suspense key={post.id} fallback={<div>Loading Post...</div>}>
          <Post post={post} />
        </Suspense>
      ))}
    </div>
  );
}

export default Posts;
