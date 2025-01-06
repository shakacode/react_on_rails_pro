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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.logSanitizedConfig = logSanitizedConfig;
exports.buildConfig = buildConfig;
/**
 * Reads CLI arguments and build the config.
 *
 * @module worker/configBuilder
 */
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const requireOptional_1 = __importDefault(require("./requireOptional"));
const log_1 = __importStar(require("./log"));
const errorReporter_1 = __importDefault(require("./errorReporter"));
const tracing_1 = __importDefault(require("./tracing"));
const packageJson_1 = __importDefault(require("./packageJson"));
const truthy_1 = __importDefault(require("./truthy"));
const Sentry = (0, requireOptional_1.default)('@sentry/node');
// usually remote renderers are on staging or production, so, use production folder always
const DEFAULT_PORT = 3800;
const DEFAULT_LOG_LEVEL = 'info';
const { env } = process;
const MAX_DEBUG_SNIPPET_LENGTH = 1000;
const DEFAULT_SAMPLE_RATE = 0.1;
const NODE_ENV = env.NODE_ENV || 'production';
let config;
let userConfig = {};
function getConfig() {
    if (!config) {
        throw Error('Call buildConfig before calling getConfig');
    }
    return config;
}
function defaultWorkersCount() {
    // Create a worker for each CPU except one that is used for master process
    return os_1.default.cpus().length - 1 || 1;
}
// Find the .node-renderer-bundles folder if it exists, otherwise use /tmp
function defaultBundlePath() {
    let currentDir = process.cwd();
    const maxDepth = 10;
    for (let i = 0; i < maxDepth; i += 1) {
        const nodeRendererBundlesPath = path_1.default.resolve(currentDir, '.node-renderer-bundles');
        if (fs_1.default.existsSync(nodeRendererBundlesPath)) {
            return nodeRendererBundlesPath;
        }
        const parentDir = path_1.default.dirname(currentDir);
        if (parentDir === currentDir) {
            // We're at the root and didn't find the folder
            break;
        }
        currentDir = parentDir;
    }
    return '/tmp/react-on-rails-pro-node-renderer-bundles';
}
const defaultConfig = {
    // Use env port if we run on Heroku
    port: Number(env.RENDERER_PORT) || DEFAULT_PORT,
    // Show only important messages by default
    logLevel: env.RENDERER_LOG_LEVEL || DEFAULT_LOG_LEVEL,
    bundlePath: env.RENDERER_BUNDLE_PATH || defaultBundlePath(),
    supportModules: (0, truthy_1.default)(env.RENDERER_SUPPORT_MODULES),
    additionalContext: null,
    // Workers count defaults to number of CPUs minus 1
    workersCount: (env.RENDERER_WORKERS_COUNT && parseInt(env.RENDERER_WORKERS_COUNT, 10)) || defaultWorkersCount(),
    // No default for password, means no auth
    password: env.RENDERER_PASSWORD,
    allWorkersRestartInterval: env.RENDERER_ALL_WORKERS_RESTART_INTERVAL
        ? parseInt(env.RENDERER_ALL_WORKERS_RESTART_INTERVAL, 10)
        : undefined,
    delayBetweenIndividualWorkerRestarts: env.RENDERER_DELAY_BETWEEN_INDIVIDUAL_WORKER_RESTARTS
        ? parseInt(env.RENDERER_DELAY_BETWEEN_INDIVIDUAL_WORKER_RESTARTS, 10)
        : undefined,
    maxDebugSnippetLength: MAX_DEBUG_SNIPPET_LENGTH,
    honeybadgerApiKey: env.HONEYBADGER_API_KEY || null,
    sentryDsn: env.SENTRY_DSN || null,
    sentryTracing: (0, truthy_1.default)(env.SENTRY_TRACING),
    sentryTracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE || DEFAULT_SAMPLE_RATE,
    // default to true if empty, otherwise it is set to false
    includeTimerPolyfills: env.INCLUDE_TIMER_POLYFILLS === 'true' || !env.INCLUDE_TIMER_POLYFILLS,
    // default to true in development, otherwise it is set to false
    replayServerAsyncOperationLogs: (0, truthy_1.default)(env.REPLAY_SERVER_ASYNC_OPERATION_LOGS ?? NODE_ENV === 'development'),
};
function envValuesUsed() {
    return {
        RENDERER_PORT: !userConfig.port && env.RENDERER_PORT,
        RENDERER_LOG_LEVEL: !userConfig.logLevel && env.RENDERER_LOG_LEVEL,
        RENDERER_BUNDLE_PATH: !userConfig.bundlePath && env.RENDERER_BUNDLE_PATH,
        RENDERER_WORKERS_COUNT: !userConfig.workersCount && env.RENDERER_WORKERS_COUNT,
        RENDERER_PASSWORD: !userConfig.password && env.RENDERER_PASSWORD && '<MASKED>',
        RENDERER_SUPPORT_MODULES: !userConfig.supportModules && env.RENDERER_SUPPORT_MODULES,
        RENDERER_ALL_WORKERS_RESTART_INTERVAL: !userConfig.allWorkersRestartInterval && env.RENDERER_ALL_WORKERS_RESTART_INTERVAL,
        RENDERER_DELAY_BETWEEN_INDIVIDUAL_WORKER_RESTARTS: !userConfig.delayBetweenIndividualWorkerRestarts &&
            env.RENDERER_DELAY_BETWEEN_INDIVIDUAL_WORKER_RESTARTS,
    };
}
function sanitizedSettings(aConfig, defaultValue) {
    return aConfig && Object.keys(aConfig).length > 0
        ? {
            ...aConfig,
            password: aConfig.password != null ? '<MASKED>' : defaultValue,
            allWorkersRestartInterval: aConfig.allWorkersRestartInterval || defaultValue,
            delayBetweenIndividualWorkerRestarts: aConfig.delayBetweenIndividualWorkerRestarts || defaultValue,
        }
        : {};
}
function logSanitizedConfig() {
    log_1.default.info(`Node Renderer v${packageJson_1.default.version}, protocol v${packageJson_1.default.protocolVersion}`);
    log_1.default.info('NOTE: renderer settings names do not have prefix "RENDERER_"');
    log_1.default.info('Default values for settings:\n%O', defaultConfig);
    log_1.default.info('ENV values used for settings (use "RENDERER_" prefix):\n%O', envValuesUsed());
    log_1.default.info('Customized values for settings from config object (overides ENV):\n%O', sanitizedSettings(userConfig));
    log_1.default.info('Final renderer settings used:\n%O', sanitizedSettings(config, '<NOT PROVIDED>'));
}
/**
 * Lazily create the config
 */
function buildConfig(providedUserConfig) {
    userConfig = providedUserConfig || {};
    config = { ...defaultConfig, ...userConfig };
    config.supportModules = (0, truthy_1.default)(config.supportModules);
    config.sentryTracing = (0, truthy_1.default)(config.sentryTracing);
    let currentArg;
    process.argv.forEach((val) => {
        if (val[0] === '-') {
            currentArg = val.slice(1);
            return;
        }
        if (currentArg === 'p') {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- config is still guaranteed to be defined here
            config.port = parseInt(val, 10);
        }
    });
    if (config.honeybadgerApiKey) {
        errorReporter_1.default.addHoneybadgerApiKey(config.honeybadgerApiKey);
    }
    if (config.sentryDsn) {
        if (config.sentryTracing) {
            let sampleRate = typeof config.sentryTracesSampleRate === 'number'
                ? config.sentryTracesSampleRate
                : parseFloat(config.sentryTracesSampleRate);
            if (Number.isNaN(sampleRate)) {
                log_1.default.warn(`SENTRY_TRACES_SAMPLE_RATE "${config.sentryTracesSampleRate}" is not a number. Using default of ${DEFAULT_SAMPLE_RATE}`);
                sampleRate = DEFAULT_SAMPLE_RATE;
            }
            errorReporter_1.default.addSentryDsn(config.sentryDsn, {
                tracing: config.sentryTracing,
                tracesSampleRate: sampleRate,
            });
            if (Sentry) {
                tracing_1.default.setSentry(Sentry);
            }
        }
        else {
            errorReporter_1.default.addSentryDsn(config.sentryDsn);
        }
    }
    (0, log_1.configureLogger)(log_1.default, config.logLevel);
    return config;
}
//# sourceMappingURL=configBuilder.js.map