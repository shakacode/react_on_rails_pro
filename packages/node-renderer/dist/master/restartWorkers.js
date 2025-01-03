"use strict";
/**
 * Perform all workers restart with provided delay
 * @module master/restartWorkers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const cluster_1 = __importDefault(require("cluster"));
const log_1 = __importDefault(require("../shared/log"));
const MILLISECONDS_IN_MINUTE = 60000;
module.exports = function restartWorkers(delayBetweenIndividualWorkerRestarts) {
    log_1.default.info('Started scheduled restart of workers');
    let delay = 0;
    if (!cluster_1.default.workers) {
        throw new Error('No workers to restart');
    }
    Object.values(cluster_1.default.workers).forEach((worker) => {
        const killWorker = () => {
            if (!worker)
                return;
            log_1.default.debug('Kill worker #%d', worker.id);
            // eslint-disable-next-line no-param-reassign -- necessary change
            worker.isScheduledRestart = true;
            worker.destroy();
        };
        setTimeout(killWorker, delay);
        delay += delayBetweenIndividualWorkerRestarts * MILLISECONDS_IN_MINUTE;
    });
    setTimeout(() => {
        log_1.default.info('Finished scheduled restart of workers');
    }, delay);
};
//# sourceMappingURL=restartWorkers.js.map