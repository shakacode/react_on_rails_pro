export const url = (path) => `${__ENV.BASE_URL ?? 'http://localhost:3000'}/${path}`;

/** @type {(envVar: string) => boolean} */
const envToBoolean = (envVar) => {
  const value = __ENV[envVar];
  return !!value && ['true', '1', 'yes'].includes(value.toLowerCase());
};

/** @type {(env?: { isBrowser?: boolean, isDebug?: boolean }) => import('k6/options').Options} */
export const defaultOptions = ({ isBrowser = false, isDebug = envToBoolean('DEBUG_K6') } = {}) => {
  const baseOptions = isDebug
    ? {
        vus: 1,
        iterations: 1,
        httpDebug: isBrowser ? undefined : 'full',
      }
    : {
        vus: 10,
        duration: '30s',
      };
  return isBrowser
    ? {
        ...baseOptions,
        // See https://github.com/grafana/k6-learn/blob/main/Modules/III-k6-Intermediate/08-Setting-load-profiles-with-executors.md
        executor: isDebug ? 'shared-iterations' : 'constant-vus',
        options: {
          browser: {
            type: 'chromium',
          },
        },
      }
    : baseOptions;
};
