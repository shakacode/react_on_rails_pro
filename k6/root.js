import { check } from 'k6';
import http from 'k6/http';
import { defaultOptions, url } from './lib/util.js';

export const options = defaultOptions();

export default () => {
  const rootUrl = url('');
  check(http.get(rootUrl), {
    'status was 200': (res) => res.status === 200,
    'renders components successfully': (res) => {
      const body = res.html().text();
      return Object.entries({
        // This is visible on the page in the browser 4 times, but for some reason, the one under
        // "Server Rendered React Component Without Redux" is missing in `body`.
        'Hello, Mr. Server Side Rendering!': 3,
        'Hello, Mrs. Client Side Rendering!': 2,
        'Hello, Mrs. Client Side Hello Again!': 1,
        'Hello ES5, Mrs. Client Side Rendering!': 1,
        'Hello WORLD! Will this work?? YES! Time to visit Maui': 1,
      }).every(([text, count]) => body.split(text).length >= count + 1);
    },
  });
};
