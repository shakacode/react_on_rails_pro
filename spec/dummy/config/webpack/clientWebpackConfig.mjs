import LoadablePlugin from '@loadable/webpack-plugin';
import commonWebpackConfig from './commonWebpackConfig.mjs';

const isHMR = process.env.HMR;

const configureClient = async () => {
  const clientConfig = commonWebpackConfig();

  // server-bundle is special and should ONLY be built by the serverConfig
  // In case this entry is not deleted, a very strange "window" not found
  // error shows referring to window["webpackJsonp"]. That is because the
  // client config is going to try to load chunks.
  delete clientConfig.entry['server-bundle'];

  const RSDWPlugin = await import('react-server-dom-webpack/plugin');
  clientConfig.plugins.push(new RSDWPlugin.default({ isServer: false }));

  if (!isHMR) {
    clientConfig.plugins.unshift(new LoadablePlugin({ filename: 'loadable-stats.json', writeToDisk: true }));
  }

  clientConfig.resolve.fallback = {
    fs: false,
    path: false,
  };

  return clientConfig;
};

export default configureClient;
