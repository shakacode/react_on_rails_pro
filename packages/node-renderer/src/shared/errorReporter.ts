import type { CaptureContext, Span } from '@sentry/types';
import { NodeOptions } from '@sentry/node';
import requireOptional from './requireOptional';
import log from './log';
import tracing from './tracing';

const Honeybadger = requireOptional('@honeybadger-io/js') as typeof import('@honeybadger-io/js') | null;
const Sentry = requireOptional('@sentry/node') as typeof import('@sentry/node') | null;

class ErrorReporter {
  honeybadger: boolean;
  sentry: boolean;
  // Starting with Sentry SDK v7.93, spans on scopes are set automatically.
  // Remove this logic if we ever require v7.93+.
  // See https://docs.sentry.io/platforms/javascript/migration/v7-to-v8/v7-deprecations/#deprecate-scopegetspan-and-scopesetspan
  setSpanIsNeeded: boolean;

  constructor() {
    this.honeybadger = false;
    this.sentry = false;
    this.setSpanIsNeeded = false;
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
        let initTracing = true;
        const sentryVersions = Sentry.SDK_VERSION.split('.');
        /* eslint-disable @typescript-eslint/no-non-null-assertion -- SDK_VERSION contains major and minor versions */
        const sentryMajor = Number.parseInt(sentryVersions[0]!, 10);
        const sentryMinor = Number.parseInt(sentryVersions[1]!, 10);
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
        // See https://github.com/getsentry/sentry-javascript/blob/7.47.0/MIGRATION.md/#remove-requirement-for-sentrytracing-package-since-7460
        const needsSentryTracing = sentryMajor < 7 || (sentryMajor === 7 && sentryMinor < 46);
        let integrations: NodeOptions['integrations'];
        // enable HTTP calls tracing; included in Sentry SDK 8 by default
        if (needsSentryTracing) {
          if (requireOptional('@sentry/tracing') === null) {
            log.error(
              '@sentry/tracing package is not installed. Either install it in order to use error reporting with Sentry or set config sentryTracing to false.',
            );
            initTracing = false;
          } else {
            integrations = [new Sentry.Integrations.Http({ tracing: true })];
          }
        } else if (sentryMajor === 7) {
          integrations = Sentry.autoDiscoverNodePerformanceMonitoringIntegrations();
        }
        sentryOptions = {
          ...sentryOptions,
          integrations,

          // We recommend adjusting this value in production, or using tracesSampler
          // for finer control
          tracesSampleRate: options.tracesSampleRate,
        };
        if (initTracing) {
          this.setSpanIsNeeded = sentryMajor < 7 || (sentryMajor === 7 && sentryMinor < 93);
          tracing.setSentry(Sentry);
        }
      }
      Sentry.init(sentryOptions);
      this.sentry = true;
    }
  }

  setContext(context: Record<string, unknown>) {
    if (this.honeybadger) {
      Honeybadger?.setContext(context);
    }
  }

  notify(msg: string | Error, span?: Span) {
    log.error(`ErrorReporter notification: ${msg}`);
    if (this.honeybadger) {
      Honeybadger?.notify(msg);
    }
    if (this.sentry) {
      const scopeFn: CaptureContext | undefined =
        span && this.setSpanIsNeeded ? (scope) => scope.setSpan(span) : undefined;
      if (typeof msg === 'string') {
        Sentry?.captureMessage(msg, scopeFn);
      } else {
        Sentry?.captureException(msg, scopeFn);
      }
    }
  }
}

const errorReporter = new ErrorReporter();

export = errorReporter;
