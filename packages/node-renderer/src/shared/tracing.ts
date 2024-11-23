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
    this.startSpan = Sentry.startSpan;
  }

  async withinSpan<T>(fn: (span?: Span) => Promise<T>, op: string, name: string) {
    return this.startSpan === null ? fn() : this.startSpan({ op, name }, fn);
  }
}

const tracing = new Tracing();

export = tracing;
