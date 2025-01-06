"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const requireOptional_1 = __importDefault(require("./requireOptional"));
const log_1 = __importDefault(require("./log"));
const sentryTracing = (0, requireOptional_1.default)('@sentry/tracing');
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
        if (sentryTracing === null) {
            log_1.default.error('@sentry/tracing package is not installed. Either install it in order to use tracing with Sentry or set sentryTracing to false in your config.');
        }
        else {
            this.Sentry = Sentry;
        }
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
        }
        finally {
            transaction.finish();
        }
    }
}
const tracing = new Tracing();
module.exports = tracing;
//# sourceMappingURL=tracing.js.map