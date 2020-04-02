import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

export default {
  input: 'packages/vm-renderer/src/ReactOnRailsProVmRenderer.js',
  output: {
    file: 'packages/vm-renderer/lib/ReactOnRailsProVmRenderer.js',
    format: 'cjs',
  },
  plugins: [
    json(),
    replace({
      delimiters: ['', ''],
      values: {
        "require('readable-stream/transform')": "require('stream').Transform",
        'require("readable-stream/transform")': "require('stream').Transform",
        "require('readable-stream/duplex')": "require('stream').Duplex",
        'require("readable-stream/duplex")': "require('stream').Duplex",
        "require('readable-stream/writable')": "require('stream').Writable",
        'require("readable-stream/writable")': "require('stream').Writable",
        'readable-stream': 'stream',
        'if(process.argv[1] && process.argv[1].match(__filename))': 'if(false)'
      }
    }),
    resolve({
      preferBuiltins: true,
      // browser: true,
    }),
    commonjs({
      namedExports: {
        // left-hand side can be an absolute path, a path
        // relative to the current directory, or the name
        // of a module in node_modules
        // winston: ['winston'],
      },
    }),
  ],
  external: [
    'cluster',
    'path',
    'os',
    'util',
    'fs',
    'module',
    'vm',
    'constants',
    'events',
    'domain',
    'url',
    'net',
    'http',
    'assert',
    'crypto',
    'querystring',
    'https',
    'zlib',
    'buffer',
    'stream',
    'tty',
    'string_decoder',
    'punycode',
    'tls',
  ],
};
