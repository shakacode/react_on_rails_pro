/**
 * Perform all workers restart with provided delay
 * @module master/restartWorkers
 */
declare module 'cluster' {
    interface Worker {
        isScheduledRestart?: boolean;
    }
}
declare const _default: (delayBetweenIndividualWorkerRestarts: number) => void;
export = _default;
//# sourceMappingURL=restartWorkers.d.ts.map