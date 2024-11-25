import { jest } from '@jest/globals';

import * as Sentry from '@sentry/node';
import { trace } from '../../src/shared/tracing';
import * as tracingIntegration from '../../src/integrations/sentry';

Sentry.init({ tracesSampleRate: 1.0 });
tracingIntegration.init({ tracing: true });

const spanName = 'TestSpan';
const testTransactionContext = { sentry: { op: 'test', name: spanName } };

test('should run function and finish span', async () => {
  const fn = jest.fn<Parameters<typeof trace>[0]>();
  let savedSpan: Sentry.Span | undefined;
  const message = 'test';
  await trace(async () => {
    savedSpan = Sentry.getActiveSpan();
    Sentry.captureMessage(message);
    await fn();
  }, testTransactionContext);
  expect(savedSpan).toBeDefined();
  expect(Sentry.getActiveSpan()).not.toBe(savedSpan);
  expect(fn.mock.calls).toHaveLength(1);
});

test('should throw if inner function throws', async () => {
  let savedSpan: Sentry.Span | undefined;
  await expect(async () => {
    await trace(() => {
      savedSpan = Sentry.getActiveSpan();
      throw new Error();
    }, testTransactionContext);
  }).rejects.toThrow();
  expect(Sentry.getActiveSpan()).not.toBe(savedSpan);
});
