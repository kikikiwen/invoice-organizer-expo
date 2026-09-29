// Run: node tests/pdf-preview.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Preview must work using only the saved PDF, even without photos or metadata.
async function checkPreview(exists, size) {
  const uri = 'file:///documents/pdfs/invoice_20260929_001.pdf';
  const state = [];
  const reads = [];
  const mocks = {
    react: {
      useCallback: (fn) => fn,
      useState: (initial) => {
        const index = state.push(initial) - 1;
        return [initial, (value) => { state[index] = value; }];
      },
    },
    'react-native': { Alert: { alert: () => assert.fail('Unexpected preview error') } },
    'expo-router': { useRouter: () => ({}) },
    '../../i18n': { useI18n: () => ({}) },
    '../../services/shareService': {},
    '../../utils/pdfId': {
      resolvePdfUriFromId: () => uri,
      pdfFileExists: async (value) => { reads.push(value); return exists; },
    },
    '../../storage/getFileSize': {
      getFileSize: async (value) => { reads.push(value); return size; },
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/features/pdf/usePdfPreviewScreen.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (id) => {
      assert.ok(Object.hasOwn(mocks, id), `Preview must not depend on rebuilding or writing files: ${id}`);
      return mocks[id];
    },
  });
  await exports.usePdfPreviewScreen('invoice_20260929_001.pdf').loadPdf();
  assert.equal(state[0], exists && size > 0 ? uri : null);
  assert.equal(state[3], !exists || size === 0);
  assert.equal(state[4], true);
  assert.deepEqual(reads, exists ? [uri, uri] : [uri]);
}

(async () => {
  await checkPreview(true, 2048);
  await checkPreview(false, 0);
  await checkPreview(true, 0);
  console.log('PDF preview regression checks passed (read-only, missing, empty).');
})().catch((error) => { console.error(error); process.exitCode = 1; });
