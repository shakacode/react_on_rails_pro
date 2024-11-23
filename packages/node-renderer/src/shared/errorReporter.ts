import { NodeOptions } from '@sentry/node';
import requireOptional from './requireOptional';
import log from './log';
import tracing from './tracing';

const Honeybadger = requireOptional('@honeybadger-io/js') as typeof import('@honeybadger-io/js') | null;
const Sentry = requireOptional('@sentry/node') as typeof import('@sentry/node') | null;

class ErrorReporter {
  honeybadger: boolean;
  sentry: boolean;

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

  addHoneybadgerApiKey(apiKey: string) {
    if (Honeybadger === null) {
      log.error(
        'Honeybadger package is not installed. Either install it in order to use error reporting with Honeybadger or remove the honeybadgerApiKey from your config.',
      );
    } else {
      Honeybadger.configure({ apiKey });
      this.honeybadger = true;
    }
  }

  addSentryDsn(sentryDsn: string, options: { tracing?: boolean; tracesSampleRate?: number } = {}) {
    if (Sentry === null) {
      log.error(
        '@sentry/node package is not installed. Either install it in order to use error reporting with Sentry or remove the sentryDsn from your config.',
      );
    } else {
      let sentryOptions: NodeOptions = {
        dsn: sentryDsn,
      };

      if (options.tracing) {
        const integrations: NodeOptions['integrations'] =
          // enable HTTP calls tracing; included in Sentry SDK 8 by default
          Sentry.SDK_VERSION.startsWith('7.')
            ? Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()
            : undefined;
        sentryOptions = {
          ...sentryOptions,
          integrations,

          // We recommend adjusting this value in production, or using tracesSampler
          // for finer control
          tracesSampleRate: options.tracesSampleRate ?? 1.0,
        };
        tracing.setSentry(Sentry);
      }
      Sentry.init(sentryOptions);
      this.sentry = true;
    }
  }

  /* eslint-disable @typescript-eslint/no-non-null-assertion -- Accesses happen under `if`s ensuring non-null values */
  setContext(context: Record<string, unknown>) {
    if (this.honeybadger) {
      Honeybadger!.setContext(context);
    }
  }

  notify(msg: string | Error) {
    log.error(`ErrorReporter notification: ${msg}`);
    if (this.honeybadger) {
      Honeybadger!.notify(msg);
    }
    if (this.sentry) {
      if (typeof msg === 'string') {
        Sentry!.captureMessage(msg);
      } else {
        Sentry!.captureException(msg);
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
}

const errorReporter = new ErrorReporter();

export = errorReporter;
