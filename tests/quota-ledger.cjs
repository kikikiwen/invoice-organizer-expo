// Run: node tests/quota-ledger.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const main = 'file:///documents/quota.json';
const backup = `${main}.backup`;
const original = JSON.stringify({ credits: 70, subscriptionExpiresAt: null, grantedTransactionIds: ['paid'] });
const compiled = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/storage/quotaLedger.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function boot(files, failure) {
  const exports = {};
  const fileSystem = {
    documentDirectory: 'file:///documents/',
    getInfoAsync: async (uri) => ({ exists: files.has(uri) }),
    readAsStringAsync: async (uri) => {
      assert.ok(files.has(uri));
      return files.get(uri);
    },
    writeAsStringAsync: async (uri, raw) => {
      if (failure === 'before') throw Error('disk full');
      files.set(uri, failure === 'partial' || failure === 'silent' ? raw.slice(0, 12) : raw);
      if (failure === 'partial' || failure === 'after') throw Error('interrupted');
    },
  };
  vm.runInNewContext(compiled, {
    exports,
    require: (id) => {
      if (id === 'expo-file-system/legacy') return fileSystem;
      assert.equal(id, '../constants/billing');
      return { FREE_SAVE_CREDITS: 20 };
    },
  });
  return exports;
}

(async () => {
  // Upgrade from the old single-file format, purchase, restart, replay, consume.
  const files = new Map([[main, original]]);
  let ledger = boot(files);
  assert.equal((await ledger.loadQuota()).credits, 70);
  assert.equal((await ledger.grantPackCredits('new', 30)).snapshot.credits, 100);
  assert.equal(files.get(main), original);
  ledger = boot(files);
  assert.equal((await ledger.grantPackCredits('new', 30)).granted, 0);
  await ledger.tryConsumeCredit();
  await ledger.setSubscriptionExpiry(123456);
  assert.equal((await boot(files).loadQuota()).credits, 99);

  // Fault injection while granting: an unacknowledged transaction can safely retry.
  for (const failure of ['before', 'partial', 'silent', 'after']) {
    const storage = new Map([[main, original]]);
    await assert.rejects(boot(storage, failure).grantPackCredits('retry', 30));
    assert.equal(storage.get(main), original);
    const restarted = boot(storage);
    assert.equal((await restarted.loadQuota()).credits, failure === 'after' ? 100 : 70);
    await restarted.grantPackCredits('retry', 30);
    assert.equal((await boot(storage).loadQuota()).credits, 100);
    assert.equal((await restarted.grantPackCredits('retry', 30)).granted, 0);
  }

  // Once a purchase is committed, interruption of a later debit/refresh preserves it.
  for (const update of [l => l.tryConsumeCredit(), l => l.setSubscriptionExpiry(null)]) {
    const storage = new Map([[main, original]]);
    await boot(storage).grantPackCredits('committed', 30);
    await assert.rejects(update(boot(storage, 'partial')));
    assert.equal((await boot(storage).loadQuota()).credits, 100);
    assert.equal((await boot(storage).grantPackCredits('committed', 30)).granted, 0);
  }

  // No valid record: preserve evidence and reject all writes instead of resetting.
  const damaged = new Map([[main, '{'], [backup, '{']]);
  for (const action of [l => l.loadQuota(), l => l.setSubscriptionExpiry(null), l => l.grantPackCredits('x', 30)]) {
    await assert.rejects(action(boot(damaged)), /damaged/);
    assert.deepEqual([...damaged], [[main, '{'], [backup, '{']]);
  }
  const onlyBackup = new Map([[backup, original]]);
  assert.equal((await boot(onlyBackup).loadQuota()).credits, 70);
  const fresh = new Map();
  assert.equal((await boot(fresh).loadQuota()).credits, 20);
  await Promise.all(Array.from({ length: 5 }, () => ledger.tryConsumeCredit()));
  assert.equal((await boot(files).loadQuota()).credits, 94);
  console.log('Quota ledger checks passed: migration, interruption/restart, replay, corruption, concurrency.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
