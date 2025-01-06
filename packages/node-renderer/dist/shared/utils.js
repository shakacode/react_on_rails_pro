"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isErrorRenderResult = exports.handleStreamError = exports.isReadableStream = exports.TRUNCATION_FILLER = void 0;
exports.workerIdLabel = workerIdLabel;
exports.smartTrim = smartTrim;
exports.errorResponseResult = errorResponseResult;
exports.formatExceptionMessage = formatExceptionMessage;
exports.saveMultipartFile = saveMultipartFile;
exports.moveUploadedAsset = moveUploadedAsset;
exports.moveUploadedAssets = moveUploadedAssets;
exports.isPromise = isPromise;
const cluster_1 = __importDefault(require("cluster"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = require("fs-extra");
const stream_1 = require("stream");
const util_1 = require("util");
const errorReporter_1 = __importDefault(require("./errorReporter"));
const configBuilder_1 = require("./configBuilder");
const log_1 = __importDefault(require("./log"));
exports.TRUNCATION_FILLER = '\n... TRUNCATED ...\n';
function workerIdLabel() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- worker is nullable in the primary process
    return cluster_1.default?.worker?.id || 'NO WORKER ID';
}
// From https://stackoverflow.com/a/831583/1009332
function smartTrim(value, maxLength = (0, configBuilder_1.getConfig)().maxDebugSnippetLength) {
    let string;
    if (value == null)
        return null;
    if (typeof value === 'string') {
        string = value;
    }
    else if (value instanceof String) {
        string = value.toString();
    }
    else {
        string = JSON.stringify(value);
    }
    if (maxLength < 1)
        return string;
    if (string.length <= maxLength)
        return string;
    if (maxLength === 1)
        return string.substring(0, 1) + exports.TRUNCATION_FILLER;
    const midpoint = Math.ceil(string.length / 2);
    const toRemove = string.length - maxLength;
    const lstrip = Math.ceil(toRemove / 2);
    const rstrip = toRemove - lstrip;
    return string.substring(0, midpoint - lstrip) + exports.TRUNCATION_FILLER + string.substring(midpoint + rstrip);
}
function errorResponseResult(msg) {
    errorReporter_1.default.notify(msg);
    return {
        headers: { 'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate' },
        status: 400,
        data: msg,
    };
}
/**
 * @param renderingRequest The JavaScript code which threw an error
 * @param error The error that was thrown (typed as `unknown` to minimize casts in `catch`)
 * @param context Optional context to include in the error message
 */
function formatExceptionMessage(renderingRequest, error, context) {
    return `${context ? `\nContext:\n${context}\n` : ''}
JS code for rendering request was:
${smartTrim(renderingRequest)}
    
EXCEPTION MESSAGE:
${error.message || error}

STACK:
${error.stack}`;
}
// https://github.com/fastify/fastify-multipart?tab=readme-ov-file#usage
const pump = (0, util_1.promisify)(stream_1.pipeline);
async function saveMultipartFile(multipartFile, destinationPath) {
    await (0, fs_extra_1.ensureDir)(path_1.default.dirname(destinationPath));
    return pump(multipartFile.file, (0, fs_extra_1.createWriteStream)(destinationPath));
}
function moveUploadedAsset(asset, destinationPath, options = {}) {
    return (0, fs_extra_1.move)(asset.savedFilePath, destinationPath, options);
}
async function moveUploadedAssets(uploadedAssets) {
    const { bundlePath } = (0, configBuilder_1.getConfig)();
    const moveMultipleAssets = uploadedAssets.map((asset) => {
        const destinationAssetFilePath = path_1.default.join(bundlePath, asset.filename);
        return moveUploadedAsset(asset, destinationAssetFilePath, { overwrite: true });
    });
    await Promise.all(moveMultipleAssets);
    log_1.default.info(`Moved assets ${JSON.stringify(uploadedAssets.map((fileDescriptor) => fileDescriptor.filename))}`);
}
function isPromise(value) {
    return value && typeof value.then === 'function';
}
const isReadableStream = (stream) => typeof stream === 'object' &&
    stream !== null &&
    typeof stream.pipe === 'function' &&
    typeof stream.read === 'function';
exports.isReadableStream = isReadableStream;
const handleStreamError = (stream, onError) => {
    stream.on('error', onError);
    const newStreamAfterHandlingError = new stream_1.PassThrough();
    stream.pipe(newStreamAfterHandlingError);
    return newStreamAfterHandlingError;
};
exports.handleStreamError = handleStreamError;
const isErrorRenderResult = (result) => typeof result === 'object' && !(0, exports.isReadableStream)(result) && 'exceptionMessage' in result;
exports.isErrorRenderResult = isErrorRenderResult;
//# sourceMappingURL=utils.js.map