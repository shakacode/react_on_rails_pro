import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('@sentry/node', () => ({
  // @ts-expect-error requireActual returns an object
  ...jest.requireActual('@sentry/node'),
  startTransaction: jest.fn(),
}));

import Sentry = require('@sentry/node');
import tracing = require('../../src/shared/tracing');
import tracingIntegration = require('../../src/integrations/sentry6');

Sentry.init({ tracesSampleRate: 1.0 });
tracingIntegration.init({ tracing: true });

test('should run function and finish transaction', async () => {
  const finishMock = jest.fn();
  const fn = jest.fn<Parameters<typeof tracing.trace>[0]>();
  (Sentry.startTransaction as jest.Mock).mockReturnValue({ finish: finishMock });
  await tracing.trace(fn, { sentry6: { op: 'test', name: 'Test' } });
  expect(finishMock.mock.calls).toHaveLength(1);
  expect(fn.mock.calls).toHaveLength(1);
});

test('should throw if inner function throws', async () => {
  const finishMock = jest.fn();
  (Sentry.startTransaction as jest.Mock).mockReturnValue({ finish: finishMock });
  await expect(async () => {
    await tracing.trace(
      () => {
        throw new Error();
      },
      { sentry6: { op: 'test', name: 'Test' } },
    );
  }).rejects.toThrow();
  expect(finishMock.mock.calls).toHaveLength(1);
});
