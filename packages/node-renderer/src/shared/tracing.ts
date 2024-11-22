import type { Span } from '@sentry/types';

type SentryModule = typeof import('@sentry/node');

class Tracing {
  startSpan: null | SentryModule['startSpan'];

  constructor() {
    this.startSpan = null;
  }

  tracingServices() {
    if (this.startSpan) {
      return ['sentry'];
    }

    return null;
  }

  setSentry(Sentry: SentryModule) {
    this.startSpan =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- necessary to support Sentry SDK v6
      Sentry.startSpan ??
      (async (context, callback) => {
        const transaction = Sentry.startTransaction(context);
        try {
          // eslint-disable-next-line @typescript-eslint/await-thenable -- we expect the callback to return a promise
          return await callback(transaction);
        } finally {
          transaction.finish();
        }
      });
  }

  async withinSpan<T>(fn: (span?: Span) => Promise<T>, op: string, name: string) {
    return this.startSpan === null ? fn() : this.startSpan({ op, name }, fn);
  }
}

const tracing = new Tracing();

export = tracing;
