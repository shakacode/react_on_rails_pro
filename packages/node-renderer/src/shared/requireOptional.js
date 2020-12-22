module.exports = function requireOptional(path) {
  try {
    return require(path)
  } catch {
    console.log(`requireOptional: ${path} couldn't be loaded.`)
    return null;
  }
};
