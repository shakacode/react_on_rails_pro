import type { Transaction } from '@sentry/types';
type SentryModule = typeof import('@sentry/node');
declare class Tracing {
    Sentry: null | SentryModule;
    constructor();
    tracingServices(): string[] | null;
    setSentry(Sentry: SentryModule): void;
    withinTransaction<T>(fn: (transaction?: Transaction) => Promise<T>, op: string, name: string): Promise<T>;
}
declare const tracing: Tracing;
export = tracing;
//# sourceMappingURL=tracing.d.ts.map