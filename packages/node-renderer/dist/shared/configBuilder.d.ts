import { LevelWithSilent } from 'pino';
export interface Config {
    port: number;
    logLevel: LevelWithSilent;
    logHttpLevel: LevelWithSilent;
    bundlePath: string;
    supportModules: boolean;
    additionalContext: Record<string, unknown> | null;
    workersCount: number;
    password: string | undefined;
    allWorkersRestartInterval: number | undefined;
    delayBetweenIndividualWorkerRestarts: number | undefined;
    maxDebugSnippetLength: number;
    honeybadgerApiKey?: string | null;
    sentryDsn?: string | null;
    sentryTracing?: boolean;
    sentryTracesSampleRate?: string | number;
    includeTimerPolyfills: boolean;
    replayServerAsyncOperationLogs: boolean;
}
export declare function getConfig(): Config;
export declare function logSanitizedConfig(): void;
/**
 * Lazily create the config
 */
export declare function buildConfig(providedUserConfig?: Partial<Config>): Config;
//# sourceMappingURL=configBuilder.d.ts.map