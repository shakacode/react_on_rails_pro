import React, { Suspense } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import Posts from "../components/RSCPostsPage/Posts";
import HelloWorld from "../components/HelloWorld.jsx";
import ErrorComponent from "../components/ErrorComponent.jsx";

const RSCPostsPage = (props) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorComponent}> 
      <div>
        <HelloWorld {...props} />
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>RSC Posts Page</h1>
      <Suspense fallback={<div>Loading Posts...</div>}>
        <Posts />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

export default RSCPostsPage;
