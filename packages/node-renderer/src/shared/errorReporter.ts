import log from './log';
import type { TracingContext } from './tracing';

export type MessageNotifier = (msg: string, tracingContext?: TracingContext) => void;
export type ErrorNotifier = (err: Error, tracingContext?: TracingContext) => void;

const messageNotifiers: MessageNotifier[] = [];
const errorNotifiers: ErrorNotifier[] = [];

export function addMessageNotifier(notifier: MessageNotifier) {
  messageNotifiers.push(notifier);
}

export function addErrorNotifier(notifier: ErrorNotifier) {
  errorNotifiers.push(notifier);
}

export function addNotifier(notifier: (msg: string | Error) => void) {
  messageNotifiers.push(notifier);
  errorNotifiers.push(notifier);
}

export function message(msg: string, tracingContext?: TracingContext) {
  log.error(`ErrorReporter notification: ${msg}`);
  messageNotifiers.forEach((notifier) => {
    notifier(msg, tracingContext);
  });
}

export function error(err: Error, tracingContext?: TracingContext) {
  log.error(`ErrorReporter notification: ${err}`);
  errorNotifiers.forEach((notifier) => {
    notifier(err, tracingContext);
  });
}
