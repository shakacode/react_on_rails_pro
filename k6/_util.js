export const url = (path) => `${__ENV.BASE_URL ?? "http://localhost:3000"}/${path}`;

/** @type {(envVar: string) => boolean} */
const envToBoolean = (envVar) => {
  const value = __ENV[envVar];
  return !!value && ['true', '1', 'yes'].includes(value.toLowerCase());
};

/** @type {(isBrowser: boolean, isDebug?: boolean) => import('k6/options').Options} */
export const defaultOptions = (isBrowser, isDebug = envToBoolean('DEBUG_K6')) => {
  const baseOptions = isDebug ?
    {
      vus: 1,
      iterations: 1,
      httpDebug: isBrowser ? undefined : 'full',
    } :
    {
      vus: 10,
      duration: '30s',
    };
  return isBrowser ? {
    scenarios: {
      browser: {
        ...baseOptions,
        executor: 'shared-iterations',
        options: {
          browser: {
            type: 'chromium',
          },
        },
      },
    }
  } : baseOptions;
};
