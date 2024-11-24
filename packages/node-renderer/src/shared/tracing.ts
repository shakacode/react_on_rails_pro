import { message } from './errorReporter';

// This is the options necessary to start a unit of work (transaction/span/etc.).
// Integrations should augment it using their name as the property.
export interface UnitOfWorkOptions {}

// Augmented by integrations that need to associate error reports with units of work manually.
export interface TracingContext {}

let setupRun = false;

// TODO: this could depend on a given request, but what arguments should it receive?
//  renderingRequest? a name passed from Ruby?
export const ssrRequestUowOptions: UnitOfWorkOptions = {};

type UnitOfWork<T> = (tracingContext?: TracingContext) => Promise<T>;

type Executor = <T>(fn: UnitOfWork<T>, unitOfWorkOptions: UnitOfWorkOptions) => Promise<T>;

let executor: Executor = (fn) => fn();

// TODO: maybe make UnitOfWorkOptions a generic parameter for this and for setupTracing
//  instead of sharing between all integrations.
export interface TracingIntegrationOptions {
  executor: Executor;
  startSsrRequestOptions?: UnitOfWorkOptions;
}

// TODO: this supports only one tracing plugin.
//  Replace by a function which extends the executor and transaction context instead of replacing them.
/**
 * Sets up tracing for the given integration.
 * @param options.executor - Function that starts a trace.
 * @param options.startSsrRequestOptions - Transaction context to use for SSR requests.
 *   Should be an object with your integration name as the only property.
 *   It will be passed to the executor.
 */
export function setupTracing(options: TracingIntegrationOptions) {
  if (setupRun) {
    message('setupTracing called more than once. Currently only one tracing integration can be enabled.');
    return;
  }

  executor = options.executor;
  Object.assign(ssrRequestUowOptions, options.startSsrRequestOptions);
  setupRun = true;
}

export function trace<T>(fn: UnitOfWork<T>, unitOfWorkOptions: UnitOfWorkOptions): Promise<T> {
  return executor(fn, unitOfWorkOptions);
}
