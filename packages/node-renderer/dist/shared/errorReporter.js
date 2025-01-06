"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const requireOptional_1 = __importDefault(require("./requireOptional"));
const log_1 = __importDefault(require("./log"));
const Honeybadger = (0, requireOptional_1.default)('@honeybadger-io/js');
const Sentry = (0, requireOptional_1.default)('@sentry/node');
const SentryTracing = (0, requireOptional_1.default)('@sentry/tracing');
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
        if (Honeybadger === null) {
            log_1.default.error('Honeybadger package is not installed. Either install it in order to use error reporting with Honeybadger or remove the honeybadgerApiKey from your config.');
        }
        else {
            Honeybadger.configure({ apiKey });
            this.honeybadger = true;
        }
    }
    addSentryDsn(sentryDsn, options = {}) {
        if (Sentry === null) {
            log_1.default.error('@sentry/node package is not installed. Either install it in order to use error reporting with Sentry or remove the sentryDsn from your config.');
        }
        else {
            let sentryOptions = {
                dsn: sentryDsn,
            };
            if (options.tracing) {
                if (SentryTracing === null) {
                    log_1.default.error('@sentry/tracing package is not installed. Either install it in order to use error reporting with Sentry or set config sentryTracing to false.');
                }
                else {
                    sentryOptions = {
                        ...sentryOptions,
                        integrations: [
                            // enable HTTP calls tracing
                            new Sentry.Integrations.Http({ tracing: true }),
                        ],
                        // We recommend adjusting this value in production, or using tracesSampler
                        // for finer control
                        tracesSampleRate: options.tracesSampleRate,
                    };
                }
            }
            Sentry.init(sentryOptions);
            this.sentry = true;
        }
    }
    setContext(context) {
        if (this.honeybadger) {
            Honeybadger?.setContext(context);
        }
    }
    notify(msg, context = {}, scopeFn = undefined) {
        log_1.default.error(`ErrorReporter notification: ${msg}`);
        if (this.honeybadger) {
            Honeybadger?.notify(msg, context);
        }
        if (this.sentry) {
            if (typeof msg === 'string') {
                Sentry?.captureMessage(msg, scopeFn);
            }
            else {
                Sentry?.captureException(msg, scopeFn);
            }
        }
    }
}
const errorReporter = new ErrorReporter();
module.exports = errorReporter;
//# sourceMappingURL=errorReporter.js.map