const clientWebpackConfig = require('./clientWebpackConfig.js');
const serverWebpackConfig = require('./serverWebpackConfig.js');
const rscWebpackConfig = require('./rscWebpackConfig.js');

const webpackConfig = (envSpecific) => {
  const clientConfig = clientWebpackConfig();
  const serverConfig = serverWebpackConfig();
  const rscConfig = rscWebpackConfig();

  if (envSpecific) {
    envSpecific(clientConfig, serverConfig);
  }

  let result;
  if (process.env.WEBPACK_SERVE || process.env.CLIENT_BUNDLE_ONLY) {
    console.log('[React on Rails] Creating only the client bundles.');
    result = clientConfig;
  } else if (process.env.SERVER_BUNDLE_ONLY) {
    console.log('[React on Rails] Creating only the server bundle.');
    result = serverConfig;
  } else if (process.env.RSC_BUNDLE_ONLY) {
    console.log('[React on Rails] Creating only the RSC bundle.');
    result = rscConfig;
  } else {
    console.log('[React on Rails] Creating both client and server bundles.');
    result = [clientConfig, serverConfig, rscConfig];
  }

  return result;
};

module.exports = webpackConfig;
