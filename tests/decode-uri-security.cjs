// Upstream fixtures: fa479dafeede7bedf04e5c89aa78f2a78c664005 (MIT).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const routerRequire = createRequire(require.resolve('expo-router/package.json'));
const queryPath = routerRequire.resolve('query-string');
const decode = createRequire(queryPath)('decode-uri-component');
const query = require(queryPath);
const { getStateFromPath } = require('expo-router/build/react-navigation/core/getStateFromPath');
const config = { screens: { Callback: 'callback', Preview: 'pdf-preview', Invoice: 'invoice/:id' } };
const params = (url) => getStateFromPath(url, config).routes[0].params;

if (process.argv.includes('--hostile')) {
  // A separate process bounds failures if the vulnerable dependency returns.
  const bad = '%80'.repeat(100000);
  assert.equal(decode(bad), bad);
  assert.equal(query.parse(`state=${bad}`).state, bad);
  assert.equal(params(`/callback?state=${bad}`).state, bad);
  const long = 'a'.repeat(1000000);
  assert.equal(params(`/callback?code=${long}`).code, long);
  assert.equal(decode('%G0%'.repeat(100000)), '%G0%'.repeat(100000));
  assert.equal(decode('%41'.repeat(100000) + '%80'), 'A'.repeat(100000) + '%80');
  console.log('Hostile and oversized URL cases passed.');
  process.exit(0);
}

require('../scripts/verify-decoder-patch.cjs');
let upstreamCount = 0;
const test = (...args) => {
  if (typeof args[0] === 'string') args.shift();
  const fn = args.shift();
  fn({ is: assert.equal, throws: assert.throws }, ...args);
  upstreamCount++;
};
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/decode-uri-component/upstream-test.mjs'), 'utf8');
vm.runInNewContext(fixture.replace(/^import .*\r?\n/gm, ''), {
  test,
  // Upstream 0.5 preserves literal '+'. Our 0.2.2 API must still turn it into space.
  // Escape '+' for these upstream-only fixtures; legacy behavior is tested below.
  m: (value) => decode(typeof value === 'string' ? value.replace(/\+/g, '%2B') : value),
});
assert.equal(upstreamCount, 135);
for (const [encoded, expected] of [
  ['a+b', 'a b'], ['a%2Bb', 'a+b'], ['a+b%', 'a b%'],
  ['%61+%4d%4D', 'a MM'], ['%252F', '%2F'], ['%', '%'],
  ['%C2', '\uFFFD'], ['%FE%FF', '\uFFFD\uFFFD'],
]) assert.equal(decode(encoded), expected);

for (let codepoint = 32; codepoint < 10032; codepoint++) {
  const value = String.fromCodePoint(codepoint) + ' +/&=?#';
  assert.equal(decode(encodeURIComponent(value)), value);
}

assert.deepEqual(params('/callback?code=a%2Bb%2Fc%3D&state=hello+world'), {
  code: 'a+b/c=', state: 'hello world',
});
assert.deepEqual(params('/callback?code=abc&state=%252F&redirect_uri=myapp%3A%2F%2Fcallback'), {
  code: 'abc', state: '%2F', redirect_uri: 'myapp://callback',
});
assert.deepEqual(params('/pdf-preview?id=invoice_20261022_001.pdf&name=%E5%8F%91%E7%A5%A8'), {
  id: 'invoice_20261022_001.pdf', name: '发票',
});
assert.equal(params('/invoice/123?name=caf%C3%A9').id, '123');
assert.equal(query.parseUrl('invoice-organizer://callback?state=a%2Bb#fragment').query.state, 'a+b');
for (const malformed of ['%', '%0', '%GG', '%C0%AF', '%ED%A0%80', '%F4%90%80%80']) {
  assert.equal(params(`/callback?state=${malformed}`).state, decode(malformed));
}

const hostile = spawnSync(process.execPath, [__filename, '--hostile'], {
  encoding: 'utf8', timeout: 10000,
});
assert.ifError(hostile.error);
assert.equal(hostile.status, 0, hostile.stderr);
console.log(`${upstreamCount} upstream cases, 10,000 valid Unicode cases, Router/callback/deep-link parsing and bounded hostile-input tests passed.`);
