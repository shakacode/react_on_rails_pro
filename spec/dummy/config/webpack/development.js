process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const { devServer, inliningCss } = require('shakapacker');

const webpackConfig = require('./ServerClientOrBoth.js');

const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const developmentEnvOnly = (clientWebpackConfig, _serverWebpackConfig) => {
  if (inliningCss) {
    clientWebpackConfig.plugins.push(
      new ReactRefreshWebpackPlugin({
        overlay: {
          sockPort: devServer.port,
        },
      }),
    );
  }
};

module.exports = webpackConfig(developmentEnvOnly);
