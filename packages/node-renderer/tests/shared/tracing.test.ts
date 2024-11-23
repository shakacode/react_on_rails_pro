import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('@sentry/node', () => ({
  // @ts-expect-error requireActual returns an object
  ...jest.requireActual('@sentry/node'),
  startTransaction: jest.fn(),
}));

import Sentry = require('@sentry/node');
import tracing = require('../../src/shared/tracing');

Sentry.init({
  enableTracing: true,
});

test('should run function and finish span', async () => {
  const fn = jest.fn<Parameters<typeof tracing.withinSpan>[0]>();
  let savedSpan: Sentry.Span | undefined;
  tracing.setSentry(Sentry);
  await tracing.withinSpan(
    async (span) => {
      savedSpan = span;
      await fn(span);
    },
    'sample',
    'Sample',
  );
  expect(savedSpan).toBeDefined();
  expect(Sentry.getActiveSpan()).not.toBe(savedSpan);
  expect(fn.mock.calls).toHaveLength(1);
});

test('should throw if inner function throws', async () => {
  let savedSpan: Sentry.Span | undefined;
  tracing.setSentry(Sentry);
  await expect(async () => {
    await tracing.withinSpan(
      (span) => {
        savedSpan = span;
        throw new Error();
      },
      'sample',
      'Sample',
    );
  }).rejects.toThrow();
  expect(Sentry.getActiveSpan()).not.toBe(savedSpan);
});
