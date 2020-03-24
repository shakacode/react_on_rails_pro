import 'idempotent-babel-polyfill';
import ReactOnRails from 'react-on-rails';
import App from './client-bundle.imports-loadable';

ReactOnRails.register({
  App,
});
