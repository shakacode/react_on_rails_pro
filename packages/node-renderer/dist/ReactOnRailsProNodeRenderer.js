"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactOnRailsProNodeRenderer = reactOnRailsProNodeRenderer;
const cluster_1 = __importDefault(require("cluster"));
const master_1 = __importDefault(require("./master"));
const worker_1 = __importDefault(require("./worker"));
async function reactOnRailsProNodeRenderer(config = {}) {
    if (cluster_1.default.isPrimary) {
        (0, master_1.default)(config);
    }
    else {
        await (0, worker_1.default)(config).ready();
    }
}
//# sourceMappingURL=ReactOnRailsProNodeRenderer.js.map