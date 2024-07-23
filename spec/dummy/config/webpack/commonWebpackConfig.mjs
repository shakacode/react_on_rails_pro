import shakapacker from 'shakapacker';
import webpack from 'webpack';
import aliasConfig from './alias.mjs';

const { generateWebpackConfig, webpackConfig: baseClientWebpackConfig, merge } = shakapacker;

const sassResources = ['./client/app/assets/styles/app-variables.scss'];

const commonOptions = {
  resolve: {
    extensions: ['.css', '.ts', '.tsx'],
  },
};

const isHMR = process.env.HMR;

const sassLoaderConfig = {
  loader: 'sass-resources-loader',
  options: {
    resources: sassResources,
  },
};

const baseClientWebpackConfig = generateWebpackConfig();
const scssConfigIndex = baseClientWebpackConfig.module.rules.findIndex((config) =>
  '.scss'.match(config.test),
);
baseClientWebpackConfig.module.rules[scssConfigIndex].use.push(sassLoaderConfig);

if (isHMR) {
  baseClientWebpackConfig.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/(.*)\.imports-loadable(\.jsx)?/, (resource) => {
      resource.request = resource.request.replace(/imports-loadable/, 'imports-hmr');
      return resource.request;
    }),
  );
}

const commonWebpackConfig = () => merge({}, baseClientWebpackConfig, commonOptions, aliasConfig);

export default commonWebpackConfig;