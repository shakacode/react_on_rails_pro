import { message } from './errorReporter';

// This is the options necessary to start a unit of work (transaction/span/etc.).
// Integrations should augment it using their name as the property.
export interface UnitOfWorkOptions {}

// Augmented by integrations that need to associate error reports with units of work manually.
export interface TracingContext {}

let setupRun = false;

type UnitOfWork<T> = (tracingContext?: TracingContext) => Promise<T>;

type Executor = <T>(fn: UnitOfWork<T>, unitOfWorkOptions: UnitOfWorkOptions) => Promise<T>;

let executor: Executor = (fn) => fn();

// Data describing an SSR request.
// TODO: determine else to pass here. Maybe Ruby could send the component name, or
// It will also be augmentable by integrations, to support distributed tracing
// https://github.com/shakacode/react_on_rails_pro/issues/473
interface SsrRequestData {
  renderingRequest: string;
}

type StartSsrRequestOptions = (request: SsrRequestData) => UnitOfWorkOptions;

let mutableStartSsrRequestOptions: StartSsrRequestOptions = () => ({});

export const startSsrRequestOptions: StartSsrRequestOptions = (request) =>
  mutableStartSsrRequestOptions(request);

// TODO: maybe make UnitOfWorkOptions a generic parameter for this and for setupTracing
//  instead of sharing between all integrations.
export interface TracingIntegrationOptions {
  executor: Executor;
  startSsrRequestOptions?: StartSsrRequestOptions;
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
  if (options.startSsrRequestOptions) {
    mutableStartSsrRequestOptions = options.startSsrRequestOptions;
  }
  setupRun = true;
}

export function trace<T>(fn: UnitOfWork<T>, unitOfWorkOptions: UnitOfWorkOptions): Promise<T> {
  return executor(fn, unitOfWorkOptions);
}
