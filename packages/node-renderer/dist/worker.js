"use strict";
/**
 * Entry point for worker process that handles requests.
 * @module worker
 */
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
exports.disableHttp2 = void 0;
exports.configureFastify = configureFastify;
exports.default = run;
const path_1 = __importDefault(require("path"));
const cluster_1 = __importDefault(require("cluster"));
const fastify_1 = __importDefault(require("fastify"));
const formbody_1 = __importDefault(require("@fastify/formbody"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const log_1 = __importStar(require("./shared/log"));
const packageJson_1 = __importDefault(require("./shared/packageJson"));
const configBuilder_1 = require("./shared/configBuilder");
const fileExistsAsync_1 = __importDefault(require("./shared/fileExistsAsync"));
const checkProtocolVersionHandler_1 = __importDefault(require("./worker/checkProtocolVersionHandler"));
const authHandler_1 = __importDefault(require("./worker/authHandler"));
const handleRenderRequest_1 = __importDefault(require("./worker/handleRenderRequest"));
const utils_1 = require("./shared/utils");
const errorReporter = __importStar(require("./shared/errorReporter"));
const locks_1 = require("./shared/locks");
const tracing_1 = require("./shared/tracing");
const fastifyConfigFunctions = [];
/**
 * Configures Fastify instance before starting the server.
 * @param configFunction The configuring function. Normally it will be something like `(app) => { app.register(...); }`
 *  or `(app) => { app.addHook(...); }` to report data from Fastify to an external service.
 *  Note that we call `await app.ready()` in our code, so you don't need to `await` the results.
 */
function configureFastify(configFunction) {
    fastifyConfigFunctions.push(configFunction);
}
function setHeaders(headers, res) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- fixing it with `void` just violates no-void
    Object.entries(headers).forEach(([key, header]) => res.header(key, header));
}
const setResponse = async (result, res) => {
    const { status, data, headers, stream } = result;
    if (status !== 200 && status !== 410) {
        log_1.default.info({ msg: 'Sending non-200, non-410 data back', data });
    }
    setHeaders(headers, res);
    res.status(status);
    if (stream) {
        await res.send(stream);
    }
    else {
        res.send(data);
    }
};
const isAsset = (value) => value.type === 'asset';
// Remove after this issue is resolved: https://github.com/fastify/light-my-request/issues/315
let useHttp2 = true;
// Call before any test using `app.inject()`
const disableHttp2 = () => {
    useHttp2 = false;
};
exports.disableHttp2 = disableHttp2;
function run(config) {
    // Store config in app state. From now it can be loaded by any module using
    // getConfig():
    (0, configBuilder_1.buildConfig)(config);
    const { bundlePath, logHttpLevel, port } = (0, configBuilder_1.getConfig)();
    const app = (0, fastify_1.default)({
        http2: useHttp2,
        logger: logHttpLevel !== 'silent' ? { name: 'RORP HTTP', level: logHttpLevel, ...log_1.sharedLoggerOptions } : false,
    });
    // We shouldn't have unhandled errors here, but just in case
    app.addHook('onError', (req, res, err, done) => {
        // Not errorReporter.error so that integrations can decide how to log the errors.
        app.log.error({ msg: 'Unhandled Fastify error', err, req, res });
        done();
    });
    // 10 MB limit for code including props
    const fieldSizeLimit = 1024 * 1024 * 10;
    // Supports application/x-www-form-urlencoded
    void app.register(formbody_1.default);
    // Supports multipart/form-data
    void app.register(multipart_1.default, {
        attachFieldsToBody: 'keyValues',
        limits: {
            fieldSize: fieldSizeLimit,
            // For bundles and assets
            fileSize: Infinity,
        },
        onFile: async (part) => {
            const destinationPath = path_1.default.join(bundlePath, 'uploads', part.filename);
            // TODO: inline here
            await (0, utils_1.saveMultipartFile)(part, destinationPath);
            // eslint-disable-next-line no-param-reassign
            part.value = {
                filename: part.filename,
                savedFilePath: destinationPath,
                type: 'asset',
            };
        },
    });
    const isProtocolVersionMatch = async (req, res) => {
        // Check protocol version
        const protocolVersionCheckingResult = (0, checkProtocolVersionHandler_1.default)(req);
        if (typeof protocolVersionCheckingResult === 'object') {
            await setResponse(protocolVersionCheckingResult, res);
            return false;
        }
        return true;
    };
    const isAuthenticated = async (req, res) => {
        // Authenticate Ruby client
        const authResult = (0, authHandler_1.default)(req);
        if (typeof authResult === 'object') {
            await setResponse(authResult, res);
            return false;
        }
        return true;
    };
    const requestPrechecks = async (req, res) => {
        if (!(await isProtocolVersionMatch(req, res))) {
            return false;
        }
        if (!(await isAuthenticated(req, res))) {
            return false;
        }
        return true;
    };
    // See https://github.com/shakacode/react_on_rails_pro/issues/119 for why
    // the digest is part of the request URL. Yes, it's not used here, but the
    // server logs might show it to distinguish different requests.
    app.post('/bundles/:bundleTimestamp/render/:renderRequestDigest', async (req, res) => {
        if (!(await requestPrechecks(req, res))) {
            return;
        }
        // DO NOT REMOVE (REQUIRED FOR TIMEOUT TESTING)
        // if(TESTING_TIMEOUTS && getRandomInt(2) === 1) {
        //   console.log(
        //     'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ');
        //   console.log(`Sleeping, to test timeouts`);
        //   console.log(
        //     'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ');
        //
        //   await delay(100000);
        // }
        const { renderingRequest } = req.body;
        const { bundleTimestamp } = req.params;
        let providedNewBundle;
        const assetsToCopy = [];
        Object.entries(req.body).forEach(([key, value]) => {
            if (key === 'bundle') {
                providedNewBundle = value;
            }
            else if (isAsset(value)) {
                assetsToCopy.push(value);
            }
        });
        try {
            await (0, tracing_1.trace)(async (context) => {
                try {
                    const result = await (0, handleRenderRequest_1.default)({
                        renderingRequest,
                        bundleTimestamp,
                        providedNewBundle,
                        assetsToCopy,
                    });
                    await setResponse(result, res);
                }
                catch (err) {
                    const exceptionMessage = (0, utils_1.formatExceptionMessage)(renderingRequest, err, 'UNHANDLED error in handleRenderRequest');
                    errorReporter.message(exceptionMessage, context);
                    await setResponse((0, utils_1.errorResponseResult)(exceptionMessage), res);
                }
            }, (0, tracing_1.startSsrRequestOptions)({ renderingRequest }));
        }
        catch (theErr) {
            const exceptionMessage = (0, utils_1.formatExceptionMessage)(renderingRequest, theErr);
            errorReporter.message(`Unhandled top level error: ${exceptionMessage}`);
            await setResponse((0, utils_1.errorResponseResult)(exceptionMessage), res);
        }
    });
    // There can be additional files that might be required at the runtime.
    // Since the remote renderer doesn't contain any assets, they must be uploaded manually.
    app.post('/upload-assets', async (req, res) => {
        if (!(await requestPrechecks(req, res))) {
            return;
        }
        let lockAcquired = false;
        let lockfileName;
        const assets = Object.values(req.body).filter(isAsset);
        const assetsDescription = JSON.stringify(assets.map((asset) => asset.filename));
        const taskDescription = `Uploading files ${assetsDescription} to ${bundlePath}`;
        try {
            const { lockfileName: name, wasLockAcquired, errorMessage } = await (0, locks_1.lock)('transferring-assets');
            lockfileName = name;
            lockAcquired = wasLockAcquired;
            if (!wasLockAcquired) {
                const msg = (0, utils_1.formatExceptionMessage)(taskDescription, errorMessage, `Failed to acquire lock ${lockfileName}. Worker: ${(0, utils_1.workerIdLabel)()}.`);
                await setResponse((0, utils_1.errorResponseResult)(msg), res);
            }
            else {
                log_1.default.info(taskDescription);
                try {
                    await (0, utils_1.moveUploadedAssets)(assets);
                    await setResponse({
                        status: 200,
                        headers: {},
                    }, res);
                }
                catch (err) {
                    const msg = 'ERROR when trying to copy assets';
                    const message = `${msg}. ${err}. Task: ${taskDescription}`;
                    log_1.default.error({
                        msg,
                        err,
                        task: taskDescription,
                    });
                    await setResponse((0, utils_1.errorResponseResult)(message), res);
                }
            }
        }
        finally {
            if (lockAcquired) {
                try {
                    if (lockfileName) {
                        await (0, locks_1.unlock)(lockfileName);
                    }
                }
                catch (error) {
                    log_1.default.warn({
                        msg: `Error unlocking ${lockfileName} from worker ${(0, utils_1.workerIdLabel)()}`,
                        err: error,
                        task: taskDescription,
                    });
                }
            }
        }
    });
    // Checks if file exist
    app.post('/asset-exists', async (req, res) => {
        if (!(await isAuthenticated(req, res))) {
            return;
        }
        const { filename } = req.query;
        if (!filename) {
            const message = `ERROR: filename param not provided to GET /asset-exists`;
            log_1.default.info(message);
            await setResponse((0, utils_1.errorResponseResult)(message), res);
            return;
        }
        const assetPath = path_1.default.join(bundlePath, filename);
        const fileExists = await (0, fileExistsAsync_1.default)(assetPath);
        if (fileExists) {
            log_1.default.info(`/asset-exists Uploaded asset DOES exist: ${assetPath}`);
            await setResponse({ status: 200, data: { exists: true }, headers: {} }, res);
        }
        else {
            log_1.default.info(`/asset-exists Uploaded asset DOES NOT exist: ${assetPath}`);
            await setResponse({ status: 200, data: { exists: false }, headers: {} }, res);
        }
    });
    app.get('/info', (_req, res) => {
        res.send({
            node_version: process.version,
            renderer_version: packageJson_1.default.version,
        });
    });
    // In tests we will run worker in master thread, so we need to ensure server
    // will not listen:
    // we are extracting worker from cluster to avoid false TS error
    const { worker } = cluster_1.default;
    if (cluster_1.default.isWorker && worker !== undefined) {
        app.listen({ port }, () => {
            log_1.default.info(`Node renderer worker #${worker.id} listening on port ${port}!`);
        });
    }
    fastifyConfigFunctions.forEach((configFunction) => {
        configFunction(app);
    });
    return app;
}
//# sourceMappingURL=worker.js.map