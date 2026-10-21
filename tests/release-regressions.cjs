// Run: node tests/release-regressions.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, extra = '', globals = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8') + extra;
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, ...globals,
    require: (id) => {
      assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency: ${id}`);
      return mocks[id];
    },
  });
  return exports;
}

function hooks() {
  const state = [];
  let index = 0;
  return {
    render: () => { index = 0; },
    react: {
      createContext: () => ({ Provider: 'Provider' }),
      useCallback: (fn) => fn,
      useMemo: (fn) => fn(),
      useEffect: () => {},
      useRef: (value) => {
        const i = index++;
        state[i] ??= { current: value };
        return state[i];
      },
      useState: (initial) => {
        const i = index++;
        if (!(i in state)) state[i] = initial;
        return [state[i], (value) => { state[i] = value; }];
      },
    },
  };
}

async function allowanceChecks() {
  let now = 100;
  let snapshot = { credits: 0, subscriptionExpiresAt: 200 };
  let debitFails = false;
  let readFails = false;
  let debits = 0;
  const h = hooks();
  const api = load('src/features/billing/EntitlementProvider.tsx', {
    react: h.react, 'react/jsx-runtime': {}, 'react-native': {}, 'expo-iap': {},
    '../../components/billing/PaywallSheet': {}, '../../constants/billing': {},
    '../../i18n': { useI18n: () => ({}) }, '../../services/purchaseFulfillment': {},
    '../../storage/quotaLedger': {
      isCachedUnlimited: (s) => s.subscriptionExpiresAt > now,
      loadQuota: async () => { if (readFails) throw Error('read'); return snapshot; },
      tryConsumeCredit: async () => {
        debits++;
        if (debitFails) throw Error('disk full');
        snapshot = { ...snapshot, credits: snapshot.credits - 1 };
        return { consumed: true, snapshot };
      },
    },
  }, '\nexport { useSaveAllowance };', { Date: { now: () => now } });
  function render(store = true) { h.render(); return api.useSaveAllowance(store); }
  let a = render();
  a.applyAndSettle(snapshot);
  assert.equal(await a.canStartCapture(), true);
  now = 200;
  assert.equal(await a.canStartCapture(), false);
  assert.equal(render().unlimited, false);
  let writes = 0;
  assert.equal((await a.saveWithinAllowance(['a'], async () => writes++)).blocked, true);
  assert.equal(writes, 0);
  snapshot = { credits: 0, subscriptionExpiresAt: 300 };
  a.applyAndSettle(snapshot);
  assert.equal(render().unlimited, true);
  assert.equal(await render(false).canStartCapture(), false);

  snapshot = { credits: 3, subscriptionExpiresAt: null };
  a = render(false);
  debitFails = true;
  const failed = await a.saveWithinAllowance(['a', 'b'], async () => writes++);
  assert.equal(failed.saved, 1);
  assert.equal(failed.quotaError, true);
  assert.equal(writes, 1);
  assert.equal(debits, 1); // Never blindly retry an ambiguously committed debit.
  readFails = true;
  assert.equal((await a.saveWithinAllowance(['c'], async () => writes++)).saved, 0);
  assert.equal(writes, 1);
  readFails = false;
  debitFails = false;
  const ok = await a.saveWithinAllowance(['bad', 'good'], async (uri) => {
    if (uri === 'bad') throw Error('photo failed');
    writes++;
  });
  assert.equal(ok.saved, 1);
  assert.equal(ok.quotaError, false);
  assert.equal(debits, 2);
}

async function pdfChecks() {
  const writes = [];
  const api = load('src/services/pdfService.ts', {
    'expo-file-system/legacy': { getInfoAsync: async () => ({ exists: false }) },
    '../constants/media': { PDF_EXTENSIONS: new Set(['pdf']) },
    '../i18n/getStrings': { getStrings: () => ({}) },
    '../pdf/buildInvoicePdf': { buildInvoicePdf: async () => new Uint8Array([37, 80, 68, 70]) },
    '../storage/listDirectoryFiles': { listDirectoryFiles: async () => [] },
    '../storage/paths': { ensurePdfDir: async () => {}, pdfDir: () => '/pdfs/' },
    '../storage/writeBinaryFile': { writeBinaryFile: async (uri) => writes.push(uri) },
    '../utils/perf': { measureAsync: (_, fn) => fn() },
    '../utils/fileNames': { invoiceDate: () => '', parseInvoicePdfName: () => null, pdfFileName: () => 'invoice.pdf' },
    './pdfMetadataService': { savePdfMetadata: async () => assert.fail('Metadata must not be written') },
  });
  assert.equal(await api.createPdfFromPhotos([{ id: 'a' }]), '/pdfs/invoice.pdf');
  assert.deepEqual(writes, ['/pdfs/invoice.pdf']);

  let fail = true;
  let context;
  const h = hooks();
  const data = load('src/features/invoices/InvoiceDataProvider.tsx', {
    react: h.react,
    'react/jsx-runtime': { jsx: (_, props) => { context = props.value; } },
    '../../services/pdfService': { listPdfs: async () => { if (fail) throw Error('read'); return ['pdf']; } },
    '../../services/photoService': {}, '../../storage/paths': {},
    '../../utils/perf': { measureAsync: (_, fn) => fn() },
  });
  function render() { h.render(); data.InvoiceDataProvider({ children: null }); }
  render();
  await context.refreshPdfs();
  render();
  assert.equal(context.pdfsReady, true);
  assert.equal(context.pdfsLoadError, true);
  fail = false;
  await context.refreshPdfs();
  render();
  assert.equal(context.pdfsLoadError, false);
  assert.deepEqual(context.pdfs, ['pdf']);
}

async function albumChecks() {
  const alerts = [];
  let refreshes = 0;
  let refreshFails = false;
  const api = load('src/features/album/useAlbumScreen.ts', {
    react: hooks().react,
    'react-native': { Alert: { alert: (_, message) => alerts.push(message) } },
    'expo-router': { useRouter: () => ({}) },
    '../../i18n': { useI18n: () => ({
      quotaUpdateFailed: (n) => `quota: saved ${n}`,
      savedPhotosRefreshFailed: (n) => `refresh: saved ${n}`,
      savePhotoFailed: 'WRONG: save failed',
    }) },
    '../../services/documentScannerService': {},
    '../../services/galleryService': { pickPhotosFromGallery: async () => ['a', 'b'] },
    '../../services/pdfService': {}, '../../services/photoService': {},
    '../../services/shareService': {},
    '../billing/EntitlementProvider': { useEntitlement: () => ({
      canStartCapture: async () => true, requestSave: async () => true,
      saveWithinAllowance: async () => ({ saved: 1, blocked: false, quotaError: true }),
    }) },
    '../invoices/useInvoiceData': { useInvoiceData: () => ({
      photos: [], refreshPhotos: async () => { refreshes++; if (refreshFails) throw Error('read'); },
    }) },
    '../selection/usePhotoSelection': { usePhotoSelection: () => ({}) },
    '../viewer/usePhotoViewer': { usePhotoViewer: () => ({}) },
  });
  const album = api.useAlbumScreen();
  await album.handlePickFromGallery();
  assert.equal(refreshes, 1);
  assert.equal(alerts.pop(), 'quota: saved 1');
  refreshFails = true;
  await album.handlePickFromGallery();
  assert.equal(alerts.pop(), 'refresh: saved 1');
}

(async () => {
  await allowanceChecks();
  await pdfChecks();
  await albumChecks();
  console.log('Release regressions passed: expiry, partial saves, PDF creation, list failure/retry.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
