const serverWebpackConfig = require('./serverWebpackConfig');
const path = require('path');
const { config } = require('shakapacker');

const configureRsc = () => {
  const rscConfig = serverWebpackConfig();

  rscConfig.resolveLoader = {
    alias: {
      'rsc-transform': path.resolve(__dirname, './rsc-transform-loader.js')
    },
  };

  rscConfig.resolve = {
    conditionNames: ['react-server', 'workerd'],
  };

  rscConfig.output = {
    path: path.join(config.outputPath, 'rsc'),
    library: {
      type: 'commonjs2',
    },
  }

  return rscConfig;
}

module.exports = configureRsc;
