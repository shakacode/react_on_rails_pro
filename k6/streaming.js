import { check } from 'k6';
import http from 'k6/http';
import { defaultOptions, url } from './lib/util.js';

export const options = defaultOptions();

export default () => {
  const streamingUrl = url('stream_async_components?delay=5');
  check(http.get(streamingUrl), {
    'status was 200': (res) => res.status === 200,
    'has all comments': (res) => {
      const body = res.html().text();
      const commentIds = [1, 2, 3, 4];
      const hasAllComments = commentIds.every((commentId) => body.includes(`Comment ${commentId}`));
      const hasFailedRequests = !!body.match(/Request to .+ failed/i);
      return hasAllComments && !hasFailedRequests;
    },
  });
};
