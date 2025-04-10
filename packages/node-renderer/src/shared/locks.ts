import { lock as lockLib, LockOptions } from 'proper-lockfile';

import debug from './debug';
import log from './log';
import { delay, workerIdLabel } from './utils';

const TEST_LOCKFILE_THREADING = false;

// See definitions here: https://www.npmjs.com/package/proper-lockfile?activeTab=readme#lockfile-options
// and https://www.npmjs.com/package/retry#retryoperationoptions for retries
/*
 * A number of milliseconds before locks are considered to have expired.
 */
const LOCKFILE_STALE = 20000;

/*
 * The number of retries.
 */
const LOCKFILE_RETRIES = 45;

/*
 * The number of milliseconds before starting the first retry.
 */
const LOCKFILE_RETRY_MIN_TIMEOUT = 300;

const lockfileOptions: LockOptions = {
  // so the argument doesn't have to be an existing file
  realpath: false,
  retries: {
    retries: LOCKFILE_RETRIES,
    minTimeout: LOCKFILE_RETRY_MIN_TIMEOUT,
    maxTimeout: 100 * LOCKFILE_RETRY_MIN_TIMEOUT,
    randomize: true,
  },
  stale: LOCKFILE_STALE,
};

type LockResult = | {
  wasLockAcquired: true;
  release: () => Promise<void>;
} | {
  wasLockAcquired: false;
  error: Error;
};

export async function lock(filename: string): Promise<LockResult> {
  const workerId = workerIdLabel();

  try {
    debug('Worker %s: About to request lock %s', workerId, filename);
    log.info('Worker %s: About to request lock %s', workerId, filename);
    const releaseLib = await lockLib(filename, lockfileOptions);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the const may be changed to test threading
    if (TEST_LOCKFILE_THREADING) {
      debug('Worker %i: handleNewBundleProvided sleeping 5s', workerId);
      await delay(5000);
      debug('Worker %i: handleNewBundleProvided done sleeping 5s', workerId);
    }
    debug('After acquired lock in pid', filename);
    return {
      wasLockAcquired: true,
      release: () => {
        debug('Worker %s: About to unlock %s', workerIdLabel(), filename);
        log.info('Worker %s: About to unlock %s', workerIdLabel(), filename);
        return releaseLib();
      },
    };
  } catch (error) {
    log.info('Worker %s: Failed to acquire lock %s, error %s', workerId, filename, error);
    return { wasLockAcquired: false, error: error as Error };
  }
}
