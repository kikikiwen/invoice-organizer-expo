// Verify the module actually resolved by Expo Router, including nested installs.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');

const routerRequire = createRequire(require.resolve('expo-router/package.json'));
const queryRequire = createRequire(routerRequire.resolve('query-string'));
const decoderPath = queryRequire.resolve('decode-uri-component');
const source = readFileSync(decoderPath, 'utf8').replace(/\r\n/g, '\n');
assert.equal(
  createHash('sha256').update(source).digest('hex'),
  'de7bea07ef15e632b2ba1cb470ebd3dfca803422c5b9cfa9c83bf380c14f8684',
  'Expo Router decoder security patch is missing or changed. Run npm install and review the patch before building.',
);
assert.equal(typeof queryRequire('decode-uri-component'), 'function');
console.log('Expo Router resolves the verified CommonJS decoder security patch.');
