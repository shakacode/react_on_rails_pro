const { resolve } = require('path');

const aliasConfig = {
  resolve: {
    alias: {
      Assets: resolve(__dirname, '..', '..', 'client', 'app', 'assets'),
    },
  },
};

module.exports = aliasConfig;
