import React from 'react';

const ConsoleLogsInAsyncServer = ({ requestId }) => (
  <div>
    <h1>Console logs in async server</h1>
    <p>Request ID: <b>{requestId}</b></p>
    <p>Request ID should prefix all console logs logged on the server. You shouldn't see more than one request ID in the console logs.</p>

    <br />

    <div>
      You should see the following logs in the console:
      <ul>
        <li>[SERVER][{requestId}] Console log from Sync Server</li>
        <li>[SERVER][{requestId}] Console log from Recursive Async Function at level &lt;repeated 10 times&gt;</li>
        <li>[SERVER][{requestId}] Console log from Simple Async Function at iteration &lt;repeated 10 times&gt;</li>
        <li>[SERVER][{requestId}] Console log from Async Server after calling async functions</li>
      </ul>
    </div>
  </div>
);

export default ConsoleLogsInAsyncServer;
