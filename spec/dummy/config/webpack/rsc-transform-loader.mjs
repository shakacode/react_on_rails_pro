import * as RSDWNodeLoader from 'react-server-dom-webpack/node-loader';

export default function(source) {
  const callback = this.async();

  const resolve = async (specifier, { parentURL }) => {
    if (!specifier) {
      return {
        url: ''
      };
    }
    const url = (await this.resolve(specifier, parentURL)).id;
    return {
      url
    };
  };

  const id = this.resourcePath;
  const load = async (url) => {
    let source1 = url === id ? source : (await this.load({
      id: url
    })).code;
    // HACK move directives before import statements.
    source1 = source1.replace(/^(import {.*?} from ".*?";)\s*"use (client|server)";/, '"use $2";$1');
    return {
      format: 'module',
      source: source1,
    };
  };

  RSDWNodeLoader.resolve('', {
    conditions: ['react-server', 'workerd'],
    parentURL: ''
  }, resolve);

  RSDWNodeLoader.load(this.resourcePath, null, load)
    .then(({ source }) => {
      callback(null, source);
    })
    .catch(callback);
};
