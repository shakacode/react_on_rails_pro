// TODO: Check why importing "react-on-rails" is required.
// TODO: Check why we have to register using ReactOnRailsPro only.
// import statement added by react_on_rails:generate_packs rake task
import "./../generated/server-bundle-generated.js"
// Shows the mapping from the exported object to the name used by the server rendering.
import ReactOnRails from 'react-on-rails';
import 'react-on-rails-pro';

// Example of server rendering with no React
import HelloString from '../non_react/HelloString';

import SharedReduxStore from '../stores/SharedReduxStore';

ReactOnRails.register({
  HelloString,
});

ReactOnRails.registerStore({
  SharedReduxStore,
});
