export const url = (path) => `${__ENV.BASE_URL ?? 'http://localhost:3000'}/${path}`;

/** @type {(envVar: string) => boolean} */
const envToBoolean = (envVar) => {
  const value = __ENV[envVar];
  return !!value && ['true', '1', 'yes'].includes(value.toLowerCase());
};

/**
 * @param {boolean} [inScenario=isBrowser] Is this used as `scenarios: { <scenarioName>: defaultOptions(...) }`?
 * @param {boolean} [isBrowser=false] Is this a browser test?
 * @param {boolean} [isDebug=env.DEBUG_K6] Are we running in debug mode?
 * @param {import('k6/options').Options} [otherOptions] Other options to merge in
 * @return {import('k6/options').Options}
 * */
export const defaultOptions = ({
  isBrowser = false,
  isDebug = envToBoolean('DEBUG_K6'),
  // Browser tests options can only be set inside `scenarios`
  // https://grafana.com/docs/k6/latest/using-k6-browser/
  inScenario = isBrowser,
  ...otherOptions
} = {}) => {
  const thresholds = {
    checks: ['rate>0.90'],
    http_req_failed: ['rate<0.05'],
  };
  const baseOptions = isDebug
    ? {
        vus: 1,
        iterations: 1,
        httpDebug: inScenario ? undefined : 'full',
        thresholds,
        ...otherOptions,
      }
    : {
        vus: 10,
        duration: '30s',
        thresholds,
        ...otherOptions,
      };
  if (inScenario) {
    // See https://github.com/grafana/k6-learn/blob/main/Modules/III-k6-Intermediate/08-Setting-load-profiles-with-executors.md
    baseOptions.executor = isDebug ? 'shared-iterations' : 'constant-vus';
  }
  return isBrowser
    ? {
        ...baseOptions,
        options: {
          browser: {
            type: 'chromium',
          },
        },
      }
    : baseOptions;
};
