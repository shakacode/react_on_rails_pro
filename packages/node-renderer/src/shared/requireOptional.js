module.exports = function requireOptional(path) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(path);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(`requireOptional: ${path} couldn't be loaded.`);
      return null;
    }

    throw e;
  }
};
