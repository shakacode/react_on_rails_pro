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

class SharedConsoleHistory {
  private asyncLocalStorage: AsyncLocalStorage<{ consoleHistory: ConsoleMessage[] }>;
  private isRunningSyncOperation: boolean;
  private syncHistory: ConsoleMessage[];

  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage();
    this.isRunningSyncOperation = false;
    this.syncHistory = [];
  }

  get useAsyncLocalStorage(): boolean {
    return getConfig().replayServerAsyncOperationLogs;
  }

  getConsoleHistory(): ConsoleMessage[] {
    if (this.useAsyncLocalStorage) {
      return this.asyncLocalStorage.getStore()?.consoleHistory ?? [];
    }
    return this.isRunningSyncOperation ? this.syncHistory : [];
  }

  addToConsoleHistory(message: ConsoleMessage): void {
    if (this.useAsyncLocalStorage) {
      const store = this.asyncLocalStorage.getStore();
      if (store) {
        store.consoleHistory.push(message);
      }
    } else if (this.isRunningSyncOperation) {
      this.syncHistory.push(message);
    }
  }

  setConsoleHistory(consoleHistory: ConsoleMessage[]): void {
    if (this.useAsyncLocalStorage) {
      const store = this.asyncLocalStorage.getStore();
      if (store) {
        store.consoleHistory = consoleHistory;
      }
    } else {
      this.syncHistory = consoleHistory;
    }
  }

  trackConsoleHistoryInRenderRequest(renderRequestFunction: () => string | Promise<string>): string | Promise<string> {
    this.isRunningSyncOperation = true;
    let result: string | Promise<string>;

    try {
      if (this.useAsyncLocalStorage) {
        const storage = { consoleHistory: [] };
        result = this.asyncLocalStorage.run(storage, renderRequestFunction);
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
