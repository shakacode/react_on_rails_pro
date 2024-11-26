import log from './log';
import type { TracingContext } from './tracing';

export type MessageNotifier = (msg: string, tracingContext?: TracingContext) => void;
export type ErrorNotifier = (err: Error, tracingContext?: TracingContext) => void;

const messageNotifiers: MessageNotifier[] = [];
const errorNotifiers: ErrorNotifier[] = [];

/**
 * Adds a callback to notify a service on string error messages.
 */
export function addMessageNotifier(notifier: MessageNotifier) {
  messageNotifiers.push(notifier);
}

/**
 * Adds a callback to notify an error tracking service on JavaScript {@link Error}s.
 */
export function addErrorNotifier(notifier: ErrorNotifier) {
  errorNotifiers.push(notifier);
}

/**
 * Adds a callback to notify an error tracking service on both string error messages and JavaScript {@link Error}s.
 */
export function addNotifier(notifier: (msg: string | Error) => void) {
  messageNotifiers.push(notifier);
  errorNotifiers.push(notifier);
}

/**
 * Reports an error message.
 */
export function message(msg: string, tracingContext?: TracingContext) {
  log.error(`ErrorReporter notification: ${msg}`);
  messageNotifiers.forEach((notifier) => {
    notifier(msg, tracingContext);
  });
}

/**
 * Reports an error.
 */
export function error(err: Error, tracingContext?: TracingContext) {
  log.error(`ErrorReporter notification: ${err}`);
  errorNotifiers.forEach((notifier) => {
    notifier(err, tracingContext);
  });
}
