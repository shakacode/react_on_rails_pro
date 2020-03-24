const _ = require('lodash/fp');

const entries = {
  'client-bundle': './app/javascript/packs/client-bundle',
};

function setEntry(builderConfig, webpackConfig) {
  if (builderConfig.serverRendering) {
    return _.set(
      'entry',
      {
        'server-bundle': './app/javascript/packs/server-bundle',
      },
      webpackConfig,
    );
  }

  return _.set('entry', entries, webpackConfig);
}

module.exports = _.curry(setEntry);
