const { env, webpackConfig } = require('shakapacker');
const { existsSync } = require('fs');
const { resolve } = require('path');
const LoadablePlugin = require("@loadable/webpack-plugin");

const envSpecificConfig = () => {
  const path = resolve(__dirname, `${env.nodeEnv}.js`);
  if (existsSync(path)) {
    console.log(`Loading ENV specific webpack configuration file ${path}`);
    return require(path);
  } else {
    webpackConfig.resolve.fallback ||= {};
    webpackConfig.resolve.fallback["path"] = require.resolve("path-browserify");
    webpackConfig.resolve.fallback["fs"] = false;
    // webpackConfig.plugins.unshift(new LoadablePlugin({ filename: 'loadable-stats.json', writeToDisk: true }));
    console.log(">>> webpackConfig:", webpackConfig);
    // throw new Error("not calling client");
    return webpackConfig;
  }
};

module.exports = envSpecificConfig();
