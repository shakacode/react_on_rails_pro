import { AsyncLocalStorage } from 'async_hooks';

class ALSContext {
  constructor(parent = null) {
    this.parent = parent;
    this.children = [];
    this.createdAt = Date.now(); // optional: metadata
    this.data = {}; // optional: you can use this to store custom data
    this.stack = new Error().stack;

    if (parent) {
      parent.children.push(this);
    }
  }

  // Recursively build tree
  getStack() {
    const stack = [];
    let current = this;
    while (current) {
      stack.unshift(current);
      current = current.parent;
    }
    return stack;
  }
}

// eslint-disable-next-line import/prefer-default-export
export const contextStore = new AsyncLocalStorage();

const originalRun = AsyncLocalStorage.prototype.run;

// eslint-disable-next-line func-names
AsyncLocalStorage.prototype.run = function (store, callback, ...args) {
  const parentContext = contextStore.getStore() || null;
  const currentContext = new ALSContext(parentContext);

  return originalRun.call(contextStore, currentContext, () => {
    return originalRun.call(this, store, callback, ...args);
  });
};
