import { check } from 'k6';
import http from 'k6/http';
import { defaultOptions, url } from './_util.js';

export const options = defaultOptions(false);

export default () => {
  const rootUrl = url('');
  check(http.get(rootUrl), {
    'status was 200': (res) => res.status === 200,
    'includes expected text': (res) => res.body?.toString()?.includes('Hello WORLD!'),
  });
};
