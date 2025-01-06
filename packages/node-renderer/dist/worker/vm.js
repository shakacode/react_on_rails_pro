"use strict";
/**
 * Manages the virtual machine for rendering code in isolated context.
 * @module worker/vm
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVmBundleFilePath = getVmBundleFilePath;
exports.buildVM = buildVM;
exports.runInVM = runInVM;
exports.resetVM = resetVM;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vm_1 = __importDefault(require("vm"));
const module_1 = __importDefault(require("module"));
const cluster_1 = __importDefault(require("cluster"));
const util_1 = require("util");
const sharedConsoleHistory_1 = __importDefault(require("../shared/sharedConsoleHistory"));
const log_1 = __importDefault(require("../shared/log"));
const configBuilder_1 = require("../shared/configBuilder");
const utils_1 = require("../shared/utils");
const errorReporter_1 = __importDefault(require("../shared/errorReporter"));
const readFileAsync = (0, util_1.promisify)(fs_1.default.readFile);
const writeFileAsync = (0, util_1.promisify)(fs_1.default.writeFile);
// Both context and vmBundleFilePath are set when the VM is ready.
let context;
let sharedConsoleHistory;
// vmBundleFilePath is cleared at the beginning of creating the context and set only when the
// context is properly created.
let vmBundleFilePath;
/**
 * Value is set after VM created from the bundleFilePath. This value is undefined if the context is
 * not ready.
 */
function getVmBundleFilePath() {
    return vmBundleFilePath;
}
async function buildVM(filePath) {
    if (filePath === vmBundleFilePath && context) {
        return Promise.resolve(true);
    }
    try {
        const { supportModules, includeTimerPolyfills, additionalContext } = (0, configBuilder_1.getConfig)();
        const additionalContextIsObject = additionalContext !== null && additionalContext.constructor === Object;
        vmBundleFilePath = undefined;
        sharedConsoleHistory = new sharedConsoleHistory_1.default();
        const contextObject = { sharedConsoleHistory };
        if (supportModules) {
            log_1.default.debug('Adding Buffer, process, setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate to context object.');
            Object.assign(contextObject, {
                Buffer,
                process,
                setTimeout,
                setInterval,
                setImmediate,
                clearTimeout,
                clearInterval,
                clearImmediate,
            });
        }
        if (additionalContextIsObject) {
            const keysString = Object.keys(additionalContext).join(', ');
            log_1.default.debug(`Adding ${keysString} to context object.`);
            Object.assign(contextObject, additionalContext);
        }
        context = vm_1.default.createContext(contextObject);
        // Create explicit reference to global context, just in case (some libs can use it):
        vm_1.default.runInContext('global = this', context);
        // Reimplement console methods for replaying on the client:
        vm_1.default.runInContext(`
    console = {
      get history() {
        return sharedConsoleHistory.getConsoleHistory();
      },
      set history(value) {
        // Do nothing. It's just for the backward compatibility.
      },
    };
    ['error', 'log', 'info', 'warn'].forEach(function (level) {
      console[level] = function () {
        var argArray = Array.prototype.slice.call(arguments);
        if (argArray.length > 0) {
          argArray[0] = '[SERVER] ' + argArray[0];
        }
        sharedConsoleHistory.addToConsoleHistory({level: level, arguments: argArray});
      };
    });`, context);
        // Define global getStackTrace() function:
        vm_1.default.runInContext(`
    function getStackTrace() {
      var stack;
      try {
        throw new Error('');
      }
      catch (error) {
        stack = error.stack || '';
      }
      stack = stack.split('\\n').map(function (line) { return line.trim(); });
      return stack.splice(stack[0] == 'Error' ? 2 : 1);
    }`, context);
        if (includeTimerPolyfills) {
            // Define timer polyfills:
            vm_1.default.runInContext(`function setInterval() {}`, context);
            vm_1.default.runInContext(`function setTimeout() {}`, context);
            vm_1.default.runInContext(`function setImmediate() {}`, context);
            vm_1.default.runInContext(`function clearTimeout() {}`, context);
            vm_1.default.runInContext(`function clearInterval() {}`, context);
            vm_1.default.runInContext(`function clearImmediate() {}`, context);
        }
        // Run bundle code in created context:
        const bundleContents = await readFileAsync(filePath, 'utf8');
        // If node-specific code is provided then it must be wrapped into a module wrapper. The bundle
        // may need the `require` function, which is not available when running in vm unless passed in.
        if (additionalContextIsObject || supportModules) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            vm_1.default.runInContext(module_1.default.wrap(bundleContents), context)(exports, require, module, filePath, path_1.default.dirname(filePath));
        }
        else {
            vm_1.default.runInContext(bundleContents, context);
        }
        // isWorker check is required for JS unit testing:
        if (cluster_1.default.isWorker && cluster_1.default.worker !== undefined) {
            log_1.default.debug(`Built VM for worker #${cluster_1.default.worker.id}`);
        }
        if (log_1.default.level === 'debug') {
            log_1.default.debug('Required objects now in VM sandbox context: %s', vm_1.default.runInContext('global.ReactOnRails', context) !== undefined);
            log_1.default.debug('Required objects should not leak to the global context (true means OK): %s', !!global.ReactOnRails);
        }
        vmBundleFilePath = filePath;
        return Promise.resolve(true);
    }
    catch (error) {
        log_1.default.error('Caught Error when creating context in buildVM, %O', error);
        errorReporter_1.default.notify(error);
        return Promise.reject(error);
    }
}
/**
 *
 * @param renderingRequest JS Code to execute for SSR
 * @param vmCluster
 */
async function runInVM(renderingRequest, vmCluster) {
    const { bundlePath } = (0, configBuilder_1.getConfig)();
    try {
        if (context == null || sharedConsoleHistory == null) {
            throw new Error('runInVM called before buildVM');
        }
        if (log_1.default.level === 'debug') {
            // worker is nullable in the primary process
            const workerId = vmCluster?.worker?.id;
            log_1.default.debug(`worker ${workerId ? `${workerId} ` : ''}received render request with code
${(0, utils_1.smartTrim)(renderingRequest)}`);
            const debugOutputPathCode = path_1.default.join(bundlePath, 'code.js');
            log_1.default.debug(`Full code executed written to: ${debugOutputPathCode}`);
            await writeFileAsync(debugOutputPathCode, renderingRequest);
        }
        // Capture context to ensure TypeScript sees it as defined within the callback
        const localContext = context;
        let result = sharedConsoleHistory.trackConsoleHistoryInRenderRequest(() => vm_1.default.runInContext(renderingRequest, localContext));
        if ((0, utils_1.isReadableStream)(result)) {
            return result;
        }
        if (typeof result !== 'string') {
            const objectResult = await result;
            result = JSON.stringify(objectResult);
        }
        if (log_1.default.level === 'debug') {
            log_1.default.debug(`result from JS:
${(0, utils_1.smartTrim)(result)}`);
            const debugOutputPathResult = path_1.default.join(bundlePath, 'result.json');
            log_1.default.debug(`Wrote result to file: ${debugOutputPathResult}`);
            await writeFileAsync(debugOutputPathResult, result);
        }
        return Promise.resolve(result);
    }
    catch (exception) {
        const exceptionMessage = (0, utils_1.formatExceptionMessage)(renderingRequest, exception);
        log_1.default.debug('Caught exception in rendering request', exceptionMessage);
        return Promise.resolve({ exceptionMessage });
    }
}
function resetVM() {
    context = undefined;
    vmBundleFilePath = undefined;
}
//# sourceMappingURL=vm.js.map