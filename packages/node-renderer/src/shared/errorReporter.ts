import log from './log';

export type MessageNotifier = (msg: string, integrationData?: Record<string, unknown>) => void;
export type ErrorNotifier = (err: Error, integrationData?: Record<string, unknown>) => void;

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

export function message(msg: string, integrationData?: Record<string, unknown>) {
  log.error(`ErrorReporter notification: ${msg}`);
  messageNotifiers.forEach((notifier) => {
    notifier(msg, integrationData);
  });
}

export function error(err: Error, integrationData?: Record<string, unknown>) {
  log.error(`ErrorReporter notification: ${err}`);
  errorNotifiers.forEach((notifier) => {
    notifier(err, integrationData);
  });
}
