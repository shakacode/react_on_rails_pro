import { captureException, captureMessage, getGlobalScope, startSpan } from '@sentry/node';
import { StartSpanOptions } from '@sentry/types';
import { addErrorNotifier, addMessageNotifier } from '../shared/errorReporter';
import { setupTracing } from '../shared/tracing';
import { globalContext } from '../shared/log';

declare module '../shared/tracing' {
  interface UnitOfWorkOptions {
    sentry?: StartSpanOptions;
  }
}

export function init({ tracing = false } = {}) {
  getGlobalScope().setExtras(globalContext);

  addMessageNotifier((msg) => {
    captureMessage(msg);
  });

  addErrorNotifier((msg) => {
    captureException(msg);
  });

  if (tracing) {
    setupTracing({
      startSsrRequestOptions: () => ({
        sentry: {
          op: 'handleRenderRequest',
          name: 'SSR Request',
        },
      }),
      executor: (fn, unitOfWorkOptions) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        startSpan(unitOfWorkOptions.sentry!, () => fn()),
    });
  }
}
