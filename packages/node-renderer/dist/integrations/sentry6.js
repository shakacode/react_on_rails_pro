"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
const node_1 = require("@sentry/node");
const api_1 = require("./api");
function init({ tracing = false } = {}) {
    (0, api_1.addMessageNotifier)((msg, tracingContext) => {
        (0, node_1.captureMessage)(msg, tracingContext?.sentry6);
    });
    (0, api_1.addErrorNotifier)((msg, tracingContext) => {
        (0, node_1.captureException)(msg, tracingContext?.sentry6);
    });
    if (tracing) {
        try {
            // eslint-disable-next-line global-require,import/no-unresolved -- Intentionally absent in our devDependencies
            require('@sentry/tracing');
        }
        catch (e) {
            (0, api_1.message)("Failed to load '@sentry/tracing'. Tracing is disabled.");
            return;
        }
        (0, api_1.setupTracing)({
            startSsrRequestOptions: () => ({
                sentry6: {
                    op: 'handleRenderRequest',
                    name: 'SSR Request',
                },
            }),
            executor: async (fn, unitOfWorkOptions) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const transaction = (0, node_1.startTransaction)(unitOfWorkOptions.sentry6);
                try {
                    return await fn({ sentry6: (scope) => scope.setSpan(transaction) });
                }
                finally {
                    transaction.finish();
                }
            },
        });
    }
}
//# sourceMappingURL=sentry6.js.map