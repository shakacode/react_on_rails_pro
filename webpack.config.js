const path = require('path');

module.exports = {
  target: 'node',
  entry: path.resolve(__dirname, 'packages/vm-renderer/src/ReactOnRailsProVmRenderer.js'),
  output: {
    path: path.resolve(__dirname, 'packages/vm-renderer/lib'),
    filename: 'ReactOnRailsProVmRenderer.js',
    libraryTarget: 'commonjs2',
  },
  node: {
    __dirname: false,
  },
}
