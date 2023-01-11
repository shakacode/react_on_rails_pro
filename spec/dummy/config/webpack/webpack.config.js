const { env, webpackConfig } = require('shakapacker');
const { existsSync } = require('fs');
const { resolve } = require('path');

const envSpecificConfig = () => {
  const path = resolve(__dirname, `${env.nodeEnv}.js`);
  if (existsSync(path)) {
    console.log(`Loading ENV specific webpack configuration file ${path}`);
    return require(path);
  } else {
    webpackConfig.resolve.fallback ||= {};
    webpackConfig.resolve.fallback["path"] = require.resolve("path-browserify");
    webpackConfig.resolve.fallback["fs"] = false;
    console.log(">>> webpackConfig:", webpackConfig);
    return webpackConfig;
  }
};

module.exports = envSpecificConfig();
