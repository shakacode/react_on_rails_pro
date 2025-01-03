"use strict";
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
const log_1 = __importDefault(require("./log"));
const packageJson_1 = __importDefault(require("./packageJson"));
const truthy_1 = __importDefault(require("./truthy"));
// usually remote renderers are on staging or production, so, use production folder always
const DEFAULT_PORT = 3800;
const DEFAULT_LOG_LEVEL = 'info';
const { env } = process;
const MAX_DEBUG_SNIPPET_LENGTH = 1000;
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
function logLevel(level) {
    switch (level) {
        case 'fatal':
        case 'error':
        case 'warn':
        case 'info':
        case 'debug':
        case 'trace':
        case 'silent':
            return level;
        default:
            log_1.default.error(`Unexpected log level: ${level}`);
            return DEFAULT_LOG_LEVEL;
    }
}
const defaultConfig = {
    // Use env port if we run on Heroku
    port: Number(env.RENDERER_PORT) || DEFAULT_PORT,
    // Show only important messages by default
    logLevel: logLevel(env.RENDERER_LOG_LEVEL || DEFAULT_LOG_LEVEL),
    // Do not log HTTP messages by default
    logHttpLevel: logLevel(env.RENDERER_LOG_HTTP_LEVEL || 'silent'),
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
    // default to true if empty, otherwise it is set to false
    includeTimerPolyfills: env.INCLUDE_TIMER_POLYFILLS === 'true' || !env.INCLUDE_TIMER_POLYFILLS,
    // default to true in development, otherwise it is set to false
    replayServerAsyncOperationLogs: (0, truthy_1.default)(env.REPLAY_SERVER_ASYNC_OPERATION_LOGS ?? NODE_ENV === 'development'),
};
function envValuesUsed() {
    return {
        RENDERER_PORT: !userConfig.port && env.RENDERER_PORT,
        RENDERER_LOG_LEVEL: !userConfig.logLevel && env.RENDERER_LOG_LEVEL,
        RENDERER_LOG_HTTP_LEVEL: !userConfig.logHttpLevel && env.RENDERER_LOG_HTTP_LEVEL,
        RENDERER_BUNDLE_PATH: !userConfig.bundlePath && env.RENDERER_BUNDLE_PATH,
        RENDERER_WORKERS_COUNT: !userConfig.workersCount && env.RENDERER_WORKERS_COUNT,
        RENDERER_PASSWORD: !userConfig.password && env.RENDERER_PASSWORD && '<MASKED>',
        RENDERER_SUPPORT_MODULES: !userConfig.supportModules && env.RENDERER_SUPPORT_MODULES,
        RENDERER_ALL_WORKERS_RESTART_INTERVAL: !userConfig.allWorkersRestartInterval && env.RENDERER_ALL_WORKERS_RESTART_INTERVAL,
        RENDERER_DELAY_BETWEEN_INDIVIDUAL_WORKER_RESTARTS: !userConfig.delayBetweenIndividualWorkerRestarts &&
            env.RENDERER_DELAY_BETWEEN_INDIVIDUAL_WORKER_RESTARTS,
        INCLUDE_TIMER_POLYFILLS: !userConfig.includeTimerPolyfills && env.INCLUDE_TIMER_POLYFILLS,
        REPLAY_SERVER_ASYNC_OPERATION_LOGS: !userConfig.replayServerAsyncOperationLogs && env.REPLAY_SERVER_ASYNC_OPERATION_LOGS,
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
    log_1.default.info({
        'Node Renderer version': packageJson_1.default.version,
        'Protocol version': packageJson_1.default.protocolVersion,
        'Default settings': defaultConfig,
        'ENV values used for settings (use "RENDERER_" prefix)': envValuesUsed(),
        'Customized values for settings from config object (overrides ENV)': sanitizedSettings(userConfig),
        'Final renderer settings': sanitizedSettings(config, '<NOT PROVIDED>'),
    });
}
/**
 * Lazily create the config
 */
function buildConfig(providedUserConfig) {
    userConfig = providedUserConfig || {};
    config = { ...defaultConfig, ...userConfig };
    config.supportModules = (0, truthy_1.default)(config.supportModules);
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
    if ('honeybadgerApiKey' in config ||
        'sentryDsn' in config ||
        'sentryTracing' in config ||
        'sentryTracesSampleRate' in config) {
        log_1.default.error('honeybadgerApiKey, sentryDsn, sentryTracing, and sentryTracesSampleRate are not used since RORP 4.0. ' +
            'See https://www.shakacode.com/react-on-rails-pro/docs/node-renderer/error-reporting-and-tracing.');
    }
    log_1.default.level = config.logLevel;
    return config;
}
//# sourceMappingURL=configBuilder.js.map