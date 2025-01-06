"use strict";
/**
 * Isolates logic for handling render request. We don't want this module to
 * Fastify server and its Request and Reply objects. This allows to test
 * module in isolation and without async calls.
 * @module worker/handleRenderRequest
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const cluster_1 = __importDefault(require("cluster"));
const path_1 = __importDefault(require("path"));
const locks_1 = require("../shared/locks");
const fileExistsAsync_1 = __importDefault(require("../shared/fileExistsAsync"));
const log_1 = __importDefault(require("../shared/log"));
const utils_1 = require("../shared/utils");
const configBuilder_1 = require("../shared/configBuilder");
const errorReporter_1 = __importDefault(require("../shared/errorReporter"));
const vm_1 = require("./vm");
async function prepareResult(renderingRequest) {
    try {
        const result = await (0, vm_1.runInVM)(renderingRequest, cluster_1.default);
        let exceptionMessage = null;
        if (!result) {
            const error = new Error('INVALID NIL or NULL result for rendering');
            exceptionMessage = (0, utils_1.formatExceptionMessage)(renderingRequest, error, 'INVALID result for prepareResult');
        }
        else if ((0, utils_1.isErrorRenderResult)(result)) {
            ({ exceptionMessage } = result);
        }
        if (exceptionMessage) {
            return Promise.resolve((0, utils_1.errorResponseResult)(exceptionMessage));
        }
        if ((0, utils_1.isReadableStream)(result)) {
            const newStreamAfterHandlingError = (0, utils_1.handleStreamError)(result, (error) => {
                const msg = (0, utils_1.formatExceptionMessage)(renderingRequest, error, 'Error in a rendering stream');
                errorReporter_1.default.notify(msg);
            });
            return Promise.resolve({
                headers: { 'Cache-Control': 'public, max-age=31536000' },
                status: 200,
                stream: newStreamAfterHandlingError,
            });
        }
        return Promise.resolve({
            headers: { 'Cache-Control': 'public, max-age=31536000' },
            status: 200,
            data: result,
        });
    }
    catch (err) {
        const exceptionMessage = (0, utils_1.formatExceptionMessage)(renderingRequest, err, 'Unknown error calling runInVM');
        return Promise.resolve((0, utils_1.errorResponseResult)(exceptionMessage));
    }
}
function getRequestBundleFilePath(bundleTimestamp) {
    const { bundlePath } = (0, configBuilder_1.getConfig)();
    return path_1.default.join(bundlePath, `${bundleTimestamp}.js`);
}
/**
 * @param bundleFilePathPerTimestamp
 * @param providedNewBundle
 * @param renderingRequest
 * @param assetsToCopy might be null
 */
async function handleNewBundleProvided(bundleFilePathPerTimestamp, providedNewBundle, renderingRequest, assetsToCopy) {
    log_1.default.info('Worker received new bundle: %s', bundleFilePathPerTimestamp);
    let lockAcquired = false;
    let lockfileName;
    try {
        const { lockfileName: name, wasLockAcquired, errorMessage } = await (0, locks_1.lock)(bundleFilePathPerTimestamp);
        lockfileName = name;
        lockAcquired = wasLockAcquired;
        if (!wasLockAcquired) {
            const msg = (0, utils_1.formatExceptionMessage)(renderingRequest, errorMessage, `Failed to acquire lock ${lockfileName}. Worker: ${(0, utils_1.workerIdLabel)()}.`);
            return Promise.resolve((0, utils_1.errorResponseResult)(msg));
        }
        try {
            log_1.default.info(`Moving uploaded file ${providedNewBundle.savedFilePath} to ${bundleFilePathPerTimestamp}`);
            await (0, utils_1.moveUploadedAsset)(providedNewBundle, bundleFilePathPerTimestamp);
            if (assetsToCopy) {
                await (0, utils_1.moveUploadedAssets)(assetsToCopy);
            }
            log_1.default.info(`Completed moving uploaded file ${providedNewBundle.savedFilePath} to ${bundleFilePathPerTimestamp}`);
        }
        catch (error) {
            const fileExists = await (0, fileExistsAsync_1.default)(bundleFilePathPerTimestamp);
            if (!fileExists) {
                const msg = (0, utils_1.formatExceptionMessage)(renderingRequest, error, `Unexpected error when moving the bundle from ${providedNewBundle.savedFilePath} \
to ${bundleFilePathPerTimestamp})`);
                log_1.default.error(msg);
                return Promise.resolve((0, utils_1.errorResponseResult)(msg));
            }
            log_1.default.info('File exists when trying to overwrite bundle %s. Assuming bundle written by other thread', bundleFilePathPerTimestamp);
        }
        try {
            // Either this process or another process placed the file. Because the lock is acquired, the
            // file must be fully written
            log_1.default.info('buildVM, bundleFilePathPerTimestamp', bundleFilePathPerTimestamp);
            await (0, vm_1.buildVM)(bundleFilePathPerTimestamp);
            return prepareResult(renderingRequest);
        }
        catch (error) {
            const msg = (0, utils_1.formatExceptionMessage)(renderingRequest, error, `Unexpected error when building the VM ${bundleFilePathPerTimestamp}`);
            return Promise.resolve((0, utils_1.errorResponseResult)(msg));
        }
    }
    finally {
        if (lockAcquired) {
            log_1.default.info('About to unlock %s from worker %i', lockfileName, (0, utils_1.workerIdLabel)());
            try {
                if (lockfileName) {
                    await (0, locks_1.unlock)(lockfileName);
                }
            }
            catch (error) {
                const msg = (0, utils_1.formatExceptionMessage)(renderingRequest, error, `Error unlocking ${lockfileName} from worker ${(0, utils_1.workerIdLabel)()}.`);
                log_1.default.warn(msg);
            }
        }
    }
}
module.exports = async function handleRenderRequest({ renderingRequest, bundleTimestamp, providedNewBundle, assetsToCopy, }) {
    try {
        const bundleFilePathPerTimestamp = getRequestBundleFilePath(bundleTimestamp);
        // If the current VM has the correct bundle and is ready
        if ((0, vm_1.getVmBundleFilePath)() === bundleFilePathPerTimestamp) {
            return prepareResult(renderingRequest);
        }
        // If gem has posted updated bundle:
        if (providedNewBundle) {
            return handleNewBundleProvided(bundleFilePathPerTimestamp, providedNewBundle, renderingRequest, assetsToCopy);
        }
        // Check if the bundle exists:
        const fileExists = await (0, fileExistsAsync_1.default)(bundleFilePathPerTimestamp);
        if (!fileExists) {
            log_1.default.info(`No saved bundle ${bundleFilePathPerTimestamp}. Requesting a new bundle.`);
            return Promise.resolve({
                headers: { 'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate' },
                status: 410,
                data: 'No bundle uploaded',
            });
        }
        // The bundle exists, but the VM has not yet been created.
        // Another worker must have written it or it was saved during deployment.
        log_1.default.info('Bundle %s exists. Building VM for worker %s.', bundleFilePathPerTimestamp, (0, utils_1.workerIdLabel)());
        await (0, vm_1.buildVM)(bundleFilePathPerTimestamp);
        return prepareResult(renderingRequest);
    }
    catch (error) {
        const msg = (0, utils_1.formatExceptionMessage)(renderingRequest, error, 'Caught top level error in handleRenderRequest');
        errorReporter_1.default.notify(msg);
        return Promise.reject(error);
    }
};
//# sourceMappingURL=handleRenderRequest.js.map