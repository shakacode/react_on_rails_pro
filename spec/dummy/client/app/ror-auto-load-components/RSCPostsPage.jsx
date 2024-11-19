import React, { Suspense } from "react";
import Posts from "../components/RSCPostsPage/Posts";
import HelloWorld from "../components/HelloWorld.jsx";

const RSCPostsPage = (props) => {
  return (
    <div>
      <HelloWorld {...props} />
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>RSC Posts Page</h1>
      <Suspense fallback={<div>Loading Posts...</div>}>
        <Posts />
      </Suspense>
    </div>
  )
}

export default RSCPostsPage;
