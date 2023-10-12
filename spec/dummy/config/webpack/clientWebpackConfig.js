const webpack = require('webpack');
const commonWebpackConfig = require('./commonWebpackConfig');
const LoadablePlugin = require('@loadable/webpack-plugin');
const ReactServerWebpackPlugin = require('react-server-dom-webpack/plugin');

const isHMR = process.env.HMR;

const configureClient = () => {
  const clientConfig = commonWebpackConfig();

  // server-bundle is special and should ONLY be built by the serverConfig
  // In case this entry is not deleted, a very strange "window" not found
  // error shows referring to window["webpackJsonp"]. That is because the
  // client config is going to try to load chunks.
  delete clientConfig.entry['server-bundle'];

  if (!isHMR) {
    clientConfig.plugins.unshift(new LoadablePlugin({ filename: 'loadable-stats.json', writeToDisk: true }));
  }

  clientConfig.plugins.unshift(new ReactServerWebpackPlugin({
    isServer: false, clientReferences: [
      {
        directory: './client/app/',
        recursive: true,
        include: /\.(js|ts|jsx|tsx)$/,
      },
    ]
  }));

  clientConfig.resolve.conditionNames = ['browser', 'import', 'require', 'default'];

  return clientConfig;
};

module.exports = configureClient;
