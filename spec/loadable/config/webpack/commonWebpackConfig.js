const { webpackConfig: baseClientWebpackConfig, merge } = require('@rails/webpacker');
const webpack = require('webpack');

const commonOptions = {
  resolve: {
    extensions: ['.css', '.ts', '.tsx'],
    fallback: { path: false, fs: false },
  },
};

baseClientWebpackConfig.plugins.push(
  new webpack.ProvidePlugin({
    path: 'path-browserify',
  }),
);

const commonWebpackConfig = () => merge({}, baseClientWebpackConfig, commonOptions);

module.exports = commonWebpackConfig;
