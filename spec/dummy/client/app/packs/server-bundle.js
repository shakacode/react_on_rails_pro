import ReactOnRails from 'react-on-rails';

import BrokenApp from '../ror-auto-load-components/BrokenApp.jsx';
import CacheDisabled from '../ror-auto-load-components/CacheDisabled.jsx';
import CssModulesImagesFontsExample from '../ror-auto-load-components/CssModulesImagesFontsExample.jsx';
// Example of server rendering with no React
import HelloString from '../non_react/HelloString';
import HelloWorld from '../ror-auto-load-components/HelloWorld.jsx';
import HelloWorldApp from '../ror-auto-load-components/HelloWorldApp.jsx';
import HelloWorldES5 from '../ror-auto-load-components/HelloWorldES5.jsx';
import HelloWorldHooks from '../ror-auto-load-components/HelloWorldHooks.jsx';
import HelloWorldHooksContext from '../ror-auto-load-components/HelloWorldHooksContext.jsx';
import HelloWorldRehydratable from '../ror-auto-load-components/HelloWorldRehydratable.jsx';
import HelloWorldWithLogAndThrow from '../ror-auto-load-components/HelloWorldWithLogAndThrow.jsx';
import ImageExample from '../ror-auto-load-components/ImageExample.jsx';
import ManualRenderApp from '../ror-auto-load-components/ManualRenderApp.jsx';
import PureComponent from '../ror-auto-load-components/PureComponent.jsx';
import ApolloGraphQLApp from '../ror-auto-load-components/ApolloGraphQLApp.server.jsx';
import LazyApolloGraphQLApp from '../ror-auto-load-components/LazyApolloGraphQLApp.server.tsx';
import Loadable from '../ror-auto-load-components/Loadable.server.jsx';
import ReactHelmetApp from '../ror-auto-load-components/ReactHelmetApp.server.jsx';
import ReduxApp from '../ror-auto-load-components/ReduxApp.server.jsx';
import ReduxSharedStoreApp from '../ror-auto-load-components/ReduxSharedStoreApp.server.jsx';
import RenderedHtml from '../ror-auto-load-components/RenderedHtml.server.jsx';
import RouterApp from '../ror-auto-load-components/RouterApp.server.jsx';
import SetTimeoutLoggingApp from '../ror-auto-load-components/SetTimeoutLoggingApp.server.jsx';
import SharedReduxStore from '../stores/SharedReduxStore';

ReactOnRails.register({
  BrokenApp,
  CacheDisabled,
  CssModulesImagesFontsExample,
  HelloString,
  HelloWorld,
  HelloWorldApp,
  HelloWorldES5,
  HelloWorldHooks,
  HelloWorldHooksContext,
  HelloWorldRehydratable,
  HelloWorldWithLogAndThrow,
  ImageExample,
  ManualRenderApp,
  PureComponent,
  ApolloGraphQLApp,
  LazyApolloGraphQLApp,
  Loadable,
  ReactHelmetApp,
  ReduxApp,
  ReduxSharedStoreApp,
  RenderedHtml,
  RouterApp,
  SetTimeoutLoggingApp,
});

ReactOnRails.registerStore({
  SharedReduxStore,
});
