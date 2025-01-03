"use strict";
/**
 * Public API for integrations with error reporting and tracing services.
 *
 * @example
 * ```ts
 * import Bugsnag from '@bugsnag/js';
 * import { addNotifier, setupTracing } from '@shakacode-tools/react-on-rails-pro-node-renderer/integrations/api';
 * Bugsnag.start({ ... });
 *
 * addNotifier((msg) => { Bugsnag.notify(msg); });
 * setupTracing({
 *   executor: async (fn) => {
 *     Bugsnag.startSession();
 *     try {
 *       return await fn();
 *     } finally {
 *       Bugsnag.pauseSession();
 *     }
 *   },
 * });
 * ```
 *
 * @module
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureFastify = exports.setupTracing = exports.message = exports.error = exports.addNotifier = exports.addMessageNotifier = exports.addErrorNotifier = exports.log = void 0;
var log_1 = require("../shared/log");
Object.defineProperty(exports, "log", { enumerable: true, get: function () { return __importDefault(log_1).default; } });
var errorReporter_1 = require("../shared/errorReporter");
Object.defineProperty(exports, "addErrorNotifier", { enumerable: true, get: function () { return errorReporter_1.addErrorNotifier; } });
Object.defineProperty(exports, "addMessageNotifier", { enumerable: true, get: function () { return errorReporter_1.addMessageNotifier; } });
Object.defineProperty(exports, "addNotifier", { enumerable: true, get: function () { return errorReporter_1.addNotifier; } });
Object.defineProperty(exports, "error", { enumerable: true, get: function () { return errorReporter_1.error; } });
Object.defineProperty(exports, "message", { enumerable: true, get: function () { return errorReporter_1.message; } });
var tracing_1 = require("../shared/tracing");
Object.defineProperty(exports, "setupTracing", { enumerable: true, get: function () { return tracing_1.setupTracing; } });
var worker_1 = require("../worker");
Object.defineProperty(exports, "configureFastify", { enumerable: true, get: function () { return worker_1.configureFastify; } });
//# sourceMappingURL=api.js.map