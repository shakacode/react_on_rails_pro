"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactOnRailsProNodeRenderer = reactOnRailsProNodeRenderer;
const cluster_1 = __importDefault(require("cluster"));
const package_json_1 = require("fastify/package.json");
const log_1 = __importDefault(require("./shared/log"));
const utils_1 = require("./shared/utils");
async function reactOnRailsProNodeRenderer(config = {}) {
    const fastify5Supported = (0, utils_1.majorVersion)(process.versions.node) >= 20;
    const fastify5OrNewer = (0, utils_1.majorVersion)(package_json_1.version) >= 5;
    if (fastify5OrNewer && !fastify5Supported) {
        log_1.default.error(`Node.js version ${process.versions.node} is not supported by Fastify ${package_json_1.version}.
Please either use Node.js v20 or higher or downgrade Fastify by setting the following resolutions in your package.json:
{
  "@fastify/formbody": "^7.4.0",
  "@fastify/multipart": "^8.3.0",
  "fastify": "^4.28.1",
}`);
        process.exit(1);
    }
    else if (!fastify5OrNewer && fastify5Supported) {
        log_1.default.warn(`Fastify 5+ supports Node.js ${process.versions.node}, but the current version of Fastify is ${package_json_1.version}.
You have probably forced an older version of Fastify by adding resolutions for it
and for "@fastify/..." dependencies in your package.json. Consider removing them.`);
    }
    /* eslint-disable global-require,@typescript-eslint/no-var-requires --
     * Using normal `import` fails before the check above.
     */
    if (cluster_1.default.isPrimary) {
        require('./master')(config);
    }
    else {
        await require('./worker').default(config).ready();
    }
    /* eslint-enable global-require,@typescript-eslint/no-var-requires */
}
//# sourceMappingURL=ReactOnRailsProNodeRenderer.js.map