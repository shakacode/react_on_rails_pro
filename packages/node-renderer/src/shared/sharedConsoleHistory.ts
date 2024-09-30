import { AsyncLocalStorage } from 'async_hooks';
import { getConfig } from './configBuilder';
import log from './log';

type ConsoleMessage = { level: 'error' | 'log' | 'info' | 'warn'; arguments: unknown[] };

function replayConsoleOnRenderer(consoleHistory: ConsoleMessage[]) {
  if (log.level !== 'debug') return;

  consoleHistory.forEach((msg) => {
    const stringifiedList = msg.arguments.map((arg) => {
      let val;
      try {
        val = typeof arg === 'string' || arg instanceof String ? arg : JSON.stringify(arg);
      } catch (e) {
        val = `${(e as Error).message}: ${arg}`;
      }

      return val;
    });

    log.debug(stringifiedList.join(' '));
  });
}

const supportsAsyncLocalStorage = (): boolean => typeof AsyncLocalStorage !== 'undefined';
const canUseAsyncLocalStorage = (): boolean =>
  supportsAsyncLocalStorage() && getConfig().replayServerAsyncOperationLogs;

class SharedConsoleHistory {
  private asyncLocalStorageIfEnabled: AsyncLocalStorage<{ consoleHistory: ConsoleMessage[] }> | undefined;
  private isRunningSyncOperation: boolean;
  private syncHistory: ConsoleMessage[];

  constructor() {
    if (canUseAsyncLocalStorage()) {
      this.asyncLocalStorageIfEnabled = new AsyncLocalStorage();
    }
    this.isRunningSyncOperation = false;
    this.syncHistory = [];
  }

  getConsoleHistory(): ConsoleMessage[] {
    if (this.asyncLocalStorageIfEnabled) {
      return this.asyncLocalStorageIfEnabled.getStore()?.consoleHistory ?? [];
    }
    return this.isRunningSyncOperation ? this.syncHistory : [];
  }

  addToConsoleHistory(message: ConsoleMessage): void {
    if (this.asyncLocalStorageIfEnabled) {
      const store = this.asyncLocalStorageIfEnabled.getStore();
      if (store) {
        store.consoleHistory.push(message);
      }
    } else if (this.isRunningSyncOperation) {
      this.syncHistory.push(message);
    }
  }

  setConsoleHistory(consoleHistory: ConsoleMessage[]): void {
    if (this.asyncLocalStorageIfEnabled) {
      const store = this.asyncLocalStorageIfEnabled.getStore();
      if (store) {
        store.consoleHistory = consoleHistory;
      }
    } else {
      this.syncHistory = consoleHistory;
    }
  }

  trackConsoleHistoryInRenderRequest(
    renderRequestFunction: () => string | Promise<string>,
  ): string | Promise<string> {
    this.isRunningSyncOperation = true;
    let result: string | Promise<string>;

    try {
      if (this.asyncLocalStorageIfEnabled) {
        const storage = { consoleHistory: [] };
        result = this.asyncLocalStorageIfEnabled.run(storage, renderRequestFunction);
        if (result && typeof result === 'object' && 'then' in result) {
          result = result.then((value) => {
            replayConsoleOnRenderer(storage.consoleHistory);
            return value;
          });
        } else {
          replayConsoleOnRenderer(storage.consoleHistory);
        }
      } else {
        this.syncHistory = [];
        result = renderRequestFunction();
        replayConsoleOnRenderer(this.syncHistory);
      }
    } finally {
      this.isRunningSyncOperation = false;
      this.syncHistory = [];
    }
    return result;
  }
}

export default SharedConsoleHistory;
