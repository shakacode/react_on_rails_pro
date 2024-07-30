process.env.NODE_ENV = process.env.NODE_ENV || 'development';
import shakapacker from 'shakapacker';

import webpackConfig from './ServerClientOrBoth.mjs';

const { devServer, inliningCss } = shakapacker;

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

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

export default webpackConfig(developmentEnvOnly);
