const serverWebpackConfig = require('./serverWebpackConfig');
const { extractLoader } = require('./serverWebpackConfig');

const configureRsc = () => {
  const rscConfig = serverWebpackConfig();

  const rscEntry = {
    'rsc-bundle': rscConfig.entry['server-bundle'],
  };
  rscConfig.entry = rscEntry;

  if (!rscEntry['rsc-bundle']) {
    throw new Error(
      "Create a pack with the file name 'server-bundle.js' containing all the server rendering files",
    );
  }

  const rules = rscConfig.module.rules;
  rules.forEach((rule) => {
    if (Array.isArray(rule.use)) {
      const babelLoader = extractLoader(rule, 'babel-loader');
      if (babelLoader) {
        rule.use.push({
          loader: 'react-on-rails/RSCWebpackLoader',
        });
      }
    }
  });

  rscConfig.resolve = {
    ...rscConfig.resolve,
    conditionNames: ['rsc-server', 'react-server', 'workerd'],
  };

  rscConfig.output.filename = 'rsc-bundle.js';
  return rscConfig;
};

module.exports = configureRsc;
