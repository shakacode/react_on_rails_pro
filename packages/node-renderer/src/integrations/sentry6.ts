import { captureException, captureMessage } from '@sentry/node';
import { CaptureContext, Transaction } from '@sentry/types';
import { addErrorNotifier, addMessageNotifier } from '../shared/errorReporter';

function makeCaptureContext(integrationData?: Record<string, unknown>): CaptureContext | undefined {
  const transaction = integrationData?.sentry6 as Transaction | undefined;
  return transaction ? (scope) => scope.setSpan(transaction) : undefined;
}

export default function init() {
  addMessageNotifier((msg, integrationData) => {
    captureMessage(msg, makeCaptureContext(integrationData));
  });

  addErrorNotifier((msg, integrationData) => {
    captureException(msg, makeCaptureContext(integrationData));
  });
}
