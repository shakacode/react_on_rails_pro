import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('@sentry/node', () => ({
  // @ts-expect-error requireActual returns an object
  ...jest.requireActual('@sentry/node'),
  startTransaction: jest.fn(),
}));

import Sentry = require('@sentry/node');
import sentryTestkit = require('sentry-testkit');
import tracing = require('../../src/shared/tracing');

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const { testkit, sentryTransport } = sentryTestkit();

Sentry.init({
  dsn: 'https://fakeUser@fakeDsn.ingest.sentry.io/0',
  tracesSampleRate: 1.0,
  transport: sentryTransport,
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

test('should run function and finish span', async () => {
  const fn = jest.fn<Parameters<typeof tracing.withinSpan>[0]>();
  let savedSpan: Sentry.Span | undefined;
  tracing.setSentry(Sentry);
  const message = 'test';
  const spanName = 'Sample';
  await tracing.withinSpan(
    async (span) => {
      savedSpan = span;
      Sentry.captureMessage(message);
      await fn(span);
    },
    'sample',
    spanName,
  );
  expect(savedSpan).toBeDefined();
  expect(Sentry.getActiveSpan()).not.toBe(savedSpan);
  expect(fn.mock.calls).toHaveLength(1);
  await Sentry.flush();
  const transactions = testkit.transactions();
  expect(transactions).toHaveLength(1);
  const transaction = transactions[0]!;
  expect(transaction.name).toBe(spanName);
  const reports = testkit.reports();
  expect(reports).toHaveLength(1);
  const report = reports[0]!;
  expect(report.tags.transaction).toBe(spanName);
  expect(report.message).toBe(message);
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
