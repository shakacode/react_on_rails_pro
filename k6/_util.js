export const url = (path) => `${__ENV.BASE_URL ?? "http://localhost:3000"}/${path}`;

/** @type {import('k6/options').Options} */
export const defaultOptions = {
  vus: 10,
  duration: '30s',
};

/** @type {import('k6/options').Options} */
export const debugOptions = {
  vus: 1,
  iterations: 1,
  httpDebug: 'full',
};
