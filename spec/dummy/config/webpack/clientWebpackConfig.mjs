import LoadablePlugin from '@loadable/webpack-plugin';
import commonWebpackConfig from './commonWebpackConfig.mjs';
import RSDWPlugin from 'react-server-dom-webpack/plugin';

const isHMR = process.env.HMR;

const configureClient = () => {
  const clientConfig = commonWebpackConfig();

  // server-bundle is special and should ONLY be built by the serverConfig
  // In case this entry is not deleted, a very strange "window" not found
  // error shows referring to window["webpackJsonp"]. That is because the
  // client config is going to try to load chunks.
  delete clientConfig.entry['server-bundle'];

  clientConfig.plugins.push(new RSDWPlugin({ isServer: false }));

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
