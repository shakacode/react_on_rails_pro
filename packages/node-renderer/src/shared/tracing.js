const requireOptional = require("./requireOptional");

const sentryTracing = requireOptional('@sentry/tracing')
class Tracing {
  constructor() {
    this.Sentry = null;
  }

  tracingServices() {
    if (this.Sentry) {
      return ['sentry'];
    }

    return null;
  }

  setSentry(Sentry) {
    if(sentryTracing === null) {
      throw new Error('@sentry/tracing not installed. Please, install it in order to use tracing with sentry.')
    }
    this.Sentry = Sentry;
  }

  async withinTransaction(fn, op, name) {
    if (this.Sentry === null) {
      return fn();
    }
    const transaction = this.Sentry.startTransaction({
      op,
      name,
    });
    try {
      return await fn(transaction);
    } finally {
      transaction.finish();
    }
  }
}

const tracing = new Tracing();

module.exports = tracing;
