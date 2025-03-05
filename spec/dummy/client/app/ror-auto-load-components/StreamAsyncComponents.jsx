import React, { useState, Suspense } from 'react';
import css from '../components/HelloWorld.module.scss';

const delayPromise = (promise, ms) => new Promise((resolve) => setTimeout(() => resolve(promise), ms));

const cachedFetches = {};

const AsyncPost = async ({ delayMs }) => {
  console.log('Hello from AsyncPost');
  const post = (cachedFetches['post'] ??= await delayPromise(
    fetch('https://jsonplaceholder.org/posts/1'),
    delayMs,
  ).then((response) => response.json()));

  // Uncomment to test handling of errors occuring outside of the shell
  // The error occur on the server side only, so the error can be handled on server or fallback to client side rendering
  // if (typeof window === 'undefined') {
  //   throw new Error('Error from AsyncPost');
  // }

  return (
    <div>
      <h1 style={{ fontSize: '30px', fontWeight: 'bold' }}>Post Fetched Asynchronously on Server</h1>
      {post.content}
    </div>
  );
};

const AsyncComment = async ({ commentId, delayMs }) => {
  const comment = (cachedFetches[commentId] ??= await delayPromise(
    fetch(`https://jsonplaceholder.org/comments/${commentId}`),
    delayMs,
  ).then((response) => response.json()));
  console.log('Hello from AsyncComment', commentId);
  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>Comment {commentId}</h1>
      {comment.comment}
    </div>
  );
};

function StreamAsyncComponents({ helloWorldData, baseDelayMs = 1000 }) {
  const [name, setName] = useState(helloWorldData.name);

  // Uncomment to test error handling during rendering the shell
  // throw new Error('Hello from StreamAsyncComponents');

  return (
    <div>
      <h2>Stream React Server Components</h2>
      <h3 className={css.brightColor}>Hello, {name}!!</h3>
      <p>
        Say hello to:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </p>
      <br />
      <br />
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncPost delayMs={baseDelayMs} />
      </Suspense>
      <br />
      <h1 style={{ fontSize: '30px', fontWeight: 'bold' }}>Comments Fetched Asynchronously on Server</h1>
      {[1, 2, 3, 4].map((commentId) => (
        <Suspense key={commentId} fallback={<div>Loading Comment {commentId}...</div>}>
          <AsyncComment commentId={commentId} delayMs={(2 + commentId) * baseDelayMs} />
        </Suspense>
      ))}
    </div>
  );
}

export default StreamAsyncComponents;
