import React, { Suspense } from "react";
import Posts from "../components/RSCPostsPage/Posts";

const RSCPostsPage = () => {
  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>RSC Posts Page</h1>
      <Suspense fallback={<div>Loading Posts...</div>}>
        <Posts />
      </Suspense>
    </div>
  )
}

export default RSCPostsPage;
