import Honeybadger from '@honeybadger-io/js';
import { addNotifier } from '../shared/errorReporter';
import { globalContext } from '../shared/log';

export function init() {
  Honeybadger.setContext(globalContext);

  addNotifier((msg) => Honeybadger.notify(msg));
}
