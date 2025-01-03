"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
const Sentry = __importStar(require("@sentry/node"));
const api_1 = require("./api");
function init({ fastify = false, tracing = false } = {}) {
    (0, api_1.addMessageNotifier)((msg) => {
        Sentry.captureMessage(msg);
    });
    (0, api_1.addErrorNotifier)((msg) => {
        Sentry.captureException(msg);
    });
    if (tracing) {
        (0, api_1.setupTracing)({
            startSsrRequestOptions: () => ({
                sentry: {
                    op: 'handleRenderRequest',
                    name: 'SSR Request',
                },
            }),
            executor: (fn, unitOfWorkOptions) => 
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            Sentry.startSpan(unitOfWorkOptions.sentry, () => fn()),
        });
    }
    if (fastify) {
        // The check and the cast can be removed if/when we require Sentry SDK v8
        if ('setupFastifyErrorHandler' in Sentry) {
            (0, api_1.configureFastify)(Sentry.setupFastifyErrorHandler);
        }
        else {
            (0, api_1.message)('Please upgrade to Sentry SDK v8 to use Fastify integration');
        }
    }
}
//# sourceMappingURL=sentry.js.map