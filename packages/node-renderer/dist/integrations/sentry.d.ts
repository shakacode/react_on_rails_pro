import { StartSpanOptions } from '@sentry/types';
declare module '../shared/tracing' {
    interface UnitOfWorkOptions {
        sentry?: StartSpanOptions;
    }
}
export declare function init({ fastify, tracing }?: {
    fastify?: boolean | undefined;
    tracing?: boolean | undefined;
}): void;
//# sourceMappingURL=sentry.d.ts.map