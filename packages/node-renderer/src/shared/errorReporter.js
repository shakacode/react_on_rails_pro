const Honeybadger = require('honeybadger');
const Sentry = require('@sentry/node');

class ErrorReporter {
  constructor() {
    this.honeybadger = false;
    this.sentry = false;
  }

  reportingServices() {
    if (this.sentry && this.honeybadger) {
      return ['sentry', 'honeybadger'];
    }

    if (this.sentry) {
      return ['sentry'];
    }

    if (this.honeybadger) {
      return ['honeybadger'];
    }

    return null;
  }

  addHoneybadgerApiKey(apiKey) {
    Honeybadger.configure({ apiKey });
    this.honeybadger = true;
  }

  addSentryDsn(sentryDsn, tracing = false) {
    let options = {
      dsn: sentryDsn,
    };

    if (tracing) {
      options = {
        ...options,
        integrations: [
          // enable HTTP calls tracing
          new Sentry.Integrations.Http({ tracing: true }),
        ],

        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 1.0,
      };
    }
    Sentry.init(options);
    this.sentry = true;
  }

  setContext(context) {
    if (this.honeybadger) {
      Honeybadger.setConext(context);
    }
  }

  notify(msg, context = {}, scopeFn = undefined) {
    console.log('ErrorReporter postMessage', msg);
    if (this.honeybadger) {
      Honeybadger.notify(msg, context);
    }
    if (this.sentry) {
      Sentry.captureMessage(msg, scopeFn);
    }
  }
}

const errorReporter = new ErrorReporter();

module.exports = errorReporter;
