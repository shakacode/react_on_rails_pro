process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import webpackConfig from './ServerClientOrBoth.mjs';

const testOnly = () => {
  // place any code here that is for test only
};

export default webpackConfig(testOnly);
