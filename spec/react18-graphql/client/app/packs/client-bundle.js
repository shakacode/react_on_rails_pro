import ReactOnRails from 'react-on-rails';

import Loadable from '../startup/loadable-client.imports-loadable';

ReactOnRails.setOptions({
  traceTurbolinks: true,
});

ReactOnRails.register({
  Loadable,
});
