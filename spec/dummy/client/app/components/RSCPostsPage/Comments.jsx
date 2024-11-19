import React from "react";
import fetch from "node-fetch";
import _ from "lodash";
import ToggleContainer from "./ToggleContainer";
import Comment from "./Comment";

const Comments = async ({ postId }) => {
  const comments = await ((await fetch(`https://jsonplaceholder.org/comments`)).json());
  await new Promise(resolve => setTimeout(resolve, 2000));
  const postComments = comments.filter(comment => comment.postId === postId);

  const prepareComment = (comment) => {
    const safeComment = _.pick(comment, ["comment", "userId"]);
    const truncatedComment = _.truncate(safeComment.comment, { length: 100 });
    return { ...safeComment, comment: truncatedComment };
  }

  return (
    <ToggleContainer childrenTitle="Comments">
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Comments</h2>
        {postComments.map(comment => (
          <ToggleContainer key={comment.id} childrenTitle="Comment">
            <Comment comment={prepareComment(comment)} />
          </ToggleContainer>
        ))}
      </div>
    </ToggleContainer>
  )
}

export default Comments;
