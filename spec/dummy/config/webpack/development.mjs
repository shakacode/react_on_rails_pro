process.env.NODE_ENV = process.env.NODE_ENV || 'development';
import shakapacker from 'shakapacker';

import webpackConfig from './ServerClientOrBoth.mjs';

const { devServer, inliningCss } = shakapacker;

const developmentEnvOnly = (clientWebpackConfig, _serverWebpackConfig) => {
  if (inliningCss) {
    // eslint-disable-next-line global-require
    const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
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
