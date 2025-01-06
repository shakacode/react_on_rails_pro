import type { Types } from '@honeybadger-io/js/dist/server/honeybadger';
import type { CaptureContext } from '@sentry/types';
declare class ErrorReporter {
    honeybadger: boolean;
    sentry: boolean;
    constructor();
    reportingServices(): string[] | null;
    addHoneybadgerApiKey(apiKey: string): void;
    addSentryDsn(sentryDsn: string, options?: {
        tracing?: boolean;
        tracesSampleRate?: number;
    }): void;
    setContext(context: Record<string, unknown>): void;
    notify(msg: string | Error, context?: Partial<Types.Notice>, scopeFn?: CaptureContext | undefined): void;
}
declare const errorReporter: ErrorReporter;
export = errorReporter;
//# sourceMappingURL=errorReporter.d.ts.map