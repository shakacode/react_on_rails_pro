"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/**
 * Entry point for master process that forks workers.
 * @module master
 */
const cluster_1 = __importDefault(require("cluster"));
const log_1 = __importDefault(require("./shared/log"));
const configBuilder_1 = require("./shared/configBuilder");
const restartWorkers_1 = __importDefault(require("./master/restartWorkers"));
const errorReporter_1 = __importDefault(require("./shared/errorReporter"));
const MILLISECONDS_IN_MINUTE = 60000;
module.exports = function masterRun(runningConfig) {
    // Store config in app state. From now it can be loaded by any module using getConfig():
    const config = (0, configBuilder_1.buildConfig)(runningConfig);
    const { workersCount, allWorkersRestartInterval, delayBetweenIndividualWorkerRestarts } = config;
    (0, configBuilder_1.logSanitizedConfig)();
    for (let i = 0; i < workersCount; i += 1) {
        cluster_1.default.fork();
    }
    // Listen for dying workers:
    cluster_1.default.on('exit', (worker) => {
        if (worker.isScheduledRestart) {
            log_1.default.info('Restarting worker #%d on schedule', worker.id);
        }
        else {
            // TODO: Track last rendering request per worker.id
            // TODO: Consider blocking a given rendering request if it kills a worker more than X times
            const msg = `Worker ${worker.id} died UNEXPECTEDLY :(, restarting`;
            errorReporter_1.default.notify(msg);
        }
        // Replace the dead worker:
        cluster_1.default.fork();
    });
    // Schedule regular restarts of workers
    if (allWorkersRestartInterval && delayBetweenIndividualWorkerRestarts) {
        log_1.default.info('Scheduled workers restarts every %d minutes (%d minutes btw each)', allWorkersRestartInterval, delayBetweenIndividualWorkerRestarts);
        setInterval(() => {
            (0, restartWorkers_1.default)(delayBetweenIndividualWorkerRestarts);
        }, allWorkersRestartInterval * MILLISECONDS_IN_MINUTE);
    }
    else if (allWorkersRestartInterval || delayBetweenIndividualWorkerRestarts) {
        log_1.default.error("Misconfiguration, please provide both 'allWorkersRestartInterval' and " +
            "'delayBetweenIndividualWorkerRestarts' to enable scheduled worker restarts");
        process.exit();
    }
    else {
        log_1.default.info('No schedule for workers restarts');
    }
};
//# sourceMappingURL=master.js.map