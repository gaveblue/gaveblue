const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../postoscredenciados-covreecia/app.js'), 'utf8');
const KEY = 'central-pending-test';
const payload = (id = 'record-0001', workspaceId = 'covre-e-cia') => ({ rowId: id, data: { workspaceId, motorista: 'PRIVATE DRIVER NAME', valorNumero: 45, protocolo: id } });

function harness(options = {}) {
  const values = options.values || new Map(), requests = [], logs = [];
  const localStorage = {
    get length() { return values.size; }, key: (index) => [...values.keys()][index] || null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { if (options.storageError) throw new Error('quota exceeded'); if (!options.ignoreWrites) values.set(key, String(value)); },
    removeItem: (key) => values.delete(key)
  };
  const ctx = {
    localStorage, Map, Set, JSON, Error, Object, Date, String, Array, encodeURIComponent,
    CENTRAL_CLOUD_ENABLED: options.cloudEnabled !== false,
    CENTRAL_DEFAULT_ORGANIZATION_SLUG: 'covre-e-cia', CENTRAL_PENDING_RECORDS_KEY: KEY,
    CENTRAL_DEVICE_STATE_RECORD_KEY: 'state', DRIVER_PROFILE_STORAGE_KEY: 'profile', DRIVER_ONBOARDING_VERSION_KEY: 'onboarding',
    CENTRAL_DEVICE_ID_KEY: 'device', CENTRAL_PUSH_SUBSCRIPTION_ID_KEY: 'subscription',
    centralOrganizationContext: { workspaceId: options.workspaceId || 'covre-e-cia', slug: options.workspaceId || 'covre-e-cia' },
    centralRetryInProgress: false, navigator: { onLine: true },
    console: { warn: (...args) => logs.push(args), info: (...args) => logs.push(args) },
    persistCentralDeviceState: options.backup || (async () => true),
    executeCentralPushFunction: async (request) => { requests.push(request); return options.execute ? options.execute(request, ctx) : { ok: true, record: { $id: request.rowId } }; }
  };
  ctx.centralTenantStorageKey = (key) => ctx.centralOrganizationContext.slug === 'covre-e-cia' ? key : `${key}:${ctx.centralOrganizationContext.slug}`;
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function saveCentralRegistroToCloud('), source.indexOf('function getRequestedCentralOrganizationSlug(')), ctx);
  vm.runInContext(source.slice(source.indexOf('async function retryPendingCentralRegistro('), source.indexOf('function updateReceiptUploadStatus(')), ctx);
  vm.runInContext(source.slice(source.indexOf('function getCentralDeviceStateSnapshot('), source.indexOf('function persistCentralDeviceState(')), ctx);
  return { ctx, values, requests, logs };
}

test('adding a pending record preserves all 30 legacy records', async () => {
  const h = harness(), legacy = Array.from({ length: 30 }, (_, i) => payload(`legacy-${String(i).padStart(4, '0')}`));
  h.values.set(KEY, JSON.stringify(legacy));
  assert.equal(await h.ctx.saveCentralRetryPayload(payload()), true);
  assert.equal(h.ctx.getCentralRetryPayloads().length, 31);
  assert.equal(JSON.parse(h.values.get(KEY)).length, 30);
});
test('new queue does not silently cap itself at 20 entries', async () => {
  const h = harness();
  for (let i = 0; i < 75; i++) assert.equal(await h.ctx.saveCentralRetryPayload(payload(`record-${String(i).padStart(4, '0')}`)), true);
  assert.equal(h.ctx.getCentralRetryPayloads().length, 75);
});
test('simultaneous tabs retain separately queued records', async () => {
  const values = new Map(), left = harness({ values }), right = harness({ values });
  await Promise.all([left.ctx.saveCentralRetryPayload(payload('record-left')), right.ctx.saveCentralRetryPayload(payload('record-right'))]);
  assert.deepEqual([...left.ctx.getCentralRetryPayloads()].map((row) => row.rowId).sort(), ['record-left', 'record-right']);
});
test('saving exactly the same pending item is idempotent', async () => {
  const h = harness();
  await h.ctx.saveCentralRetryPayload(payload());
  assert.equal(await h.ctx.saveCentralRetryPayload(payload()), true);
  assert.equal(h.ctx.getCentralRetryPayloads().length, 1);
});
test('same ID with changed content cannot overwrite unsent data', async () => {
  const h = harness(); await h.ctx.saveCentralRetryPayload(payload());
  const changed = payload(); changed.data.valorNumero = 999;
  assert.equal(await h.ctx.saveCentralRetryPayload(changed), false);
  assert.equal(h.ctx.getCentralRetryPayloads()[0].data.valorNumero, 45);
});
test('failed local write prevents any server request', async () => {
  const h = harness({ storageError: true });
  await assert.rejects(h.ctx.saveCentralRegistroWithRetry(payload()), (error) => error.localQueueConfirmed === false);
  assert.equal(h.requests.length, 0);
});
test('silent storage failure is detected by readback', async () => {
  const h = harness({ ignoreWrites: true });
  assert.equal(await h.ctx.saveCentralRetryPayload(payload()), false);
  assert.equal(h.ctx.getCentralRetryPayloads().length, 0);
});
test('invalid legacy JSON is preserved and refuses new writes', async () => {
  const h = harness(); h.values.set(KEY, '{private broken data');
  assert.equal(await h.ctx.saveCentralRetryPayload(payload()), false);
  assert.equal(h.values.get(KEY), '{private broken data');
  assert.throws(() => h.ctx.getCentralRetryPayloads(), /recuperada/);
});
test('valid legacy singleton payload remains readable', () => {
  const h = harness(); h.values.set(KEY, JSON.stringify(payload()));
  assert.equal(h.ctx.getCentralRetryPayloads()[0].rowId, 'record-0001');
});
test('legacy object with unknown format is not treated as an empty queue', () => {
  const h = harness(); h.values.set(KEY, JSON.stringify({ unknown: 'private data' }));
  assert.throws(() => h.ctx.getCentralRetryPayloads(), /formato inesperado/);
});
test('server failure keeps pending payload and marks confirmed local copy', async () => {
  const h = harness({ execute: async () => { throw Object.assign(new Error('network unavailable'), { isNetworkError: true }); } });
  await assert.rejects(h.ctx.saveCentralRegistroWithRetry(payload()), (error) => error.localQueueConfirmed === true);
  assert.equal(h.ctx.getCentralRetryPayloads().length, 1);
});
test('an HTTP success without a matching durable record acknowledgement retains the queue', async () => {
  const h = harness({ execute: async () => ({ ok: true }) });
  await assert.rejects(h.ctx.saveCentralRegistroWithRetry(payload()), /não confirmou o identificador/);
  assert.equal(h.ctx.getCentralRetryPayloads().length, 1);
});
test('an acknowledgement for a different record never clears this pending payload', async () => {
  const h = harness({ execute: async () => ({ ok: true, record: { $id: 'different-record' } }) });
  await assert.rejects(h.ctx.saveCentralRegistroWithRetry(payload()));
  assert.equal(h.ctx.getCentralRetryPayloads().length, 1);
});
test('a disabled cloud channel never clears local pending records', async () => {
  const h = harness({ cloudEnabled: false });
  await assert.rejects(h.ctx.saveCentralRegistroWithRetry(payload()));
  assert.equal(h.ctx.getCentralRetryPayloads().length, 1); assert.equal(h.requests.length, 0);
});
test('only the server-confirmed record is cleared from the pending set', async () => {
  const h = harness(); await h.ctx.saveCentralRetryPayload(payload('unconfirmed-record'));
  await h.ctx.saveCentralRegistroWithRetry(payload('confirmed-record'));
  assert.deepEqual([...h.ctx.getCentralRetryPayloads()].map((row) => row.rowId), ['unconfirmed-record']);
});
test('stale legacy backup cannot revive an acknowledged record', async () => {
  const h = harness(); h.values.set(KEY, JSON.stringify([payload()]));
  await h.ctx.saveCentralRegistroWithRetry(payload());
  h.values.set(KEY, JSON.stringify([payload()]));
  assert.equal(h.ctx.getCentralRetryPayloads().length, 0);
});
test('simultaneous acknowledgements do not resurrect each other', async () => {
  const values = new Map([[KEY, JSON.stringify([payload('record-left'), payload('record-right')])]]);
  const left = harness({ values }), right = harness({ values });
  await Promise.all([left.ctx.clearCentralRetryPayload('record-left'), right.ctx.clearCentralRetryPayload('record-right')]);
  assert.equal(left.ctx.getCentralRetryPayloads().length, 0);
});
test('blank clear request never bulk-deletes pending records', async () => {
  const h = harness(); await h.ctx.saveCentralRetryPayload(payload());
  assert.equal(await h.ctx.clearCentralRetryPayload(), false);
  assert.equal(h.ctx.getCentralRetryPayloads().length, 1);
});
test('other tenant cannot read or enqueue Covre records', async () => {
  const values = new Map(), covre = harness({ values }), other = harness({ values, workspaceId: 'gave-blue-technologies' });
  await covre.ctx.saveCentralRetryPayload(payload());
  assert.equal(other.ctx.getCentralRetryPayloads().length, 0);
  assert.equal(await other.ctx.saveCentralRetryPayload(payload()), false);
  assert.equal(covre.ctx.getCentralRetryPayloads().length, 1);
});
test('tenant-scoped backup includes both legacy and new queue entries', async () => {
  const h = harness(); h.values.set(KEY, JSON.stringify([payload('legacy-record')]));
  await h.ctx.saveCentralRetryPayload(payload('new-record'));
  assert.equal(JSON.parse(h.ctx.getCentralDeviceStateSnapshot().pendingRecords).length, 2);
});
test('company switching during network request does not acknowledge another tenant queue', async () => {
  const h = harness({ execute: async (request, ctx) => { ctx.centralOrganizationContext = { slug: 'gave-blue-technologies', workspaceId: 'gave-blue-technologies' }; return { ok: true, record: { $id: request.rowId } }; } });
  await h.ctx.saveCentralRegistroWithRetry(payload());
  assert.equal(h.requests[0].organizationSlug, 'covre-e-cia');
  assert.equal([...h.values.keys()].some((key) => key.includes('gave-blue-technologies')), false);
  h.ctx.centralOrganizationContext = { slug: 'covre-e-cia', workspaceId: 'covre-e-cia' };
  assert.equal(h.ctx.getCentralRetryPayloads().length, 1);
});
test('offline success wording requires a verified local copy', () => {
  const h = harness();
  assert.doesNotMatch(h.ctx.getCentralCloudErrorMessage({ isNetworkError: true, message: 'network unavailable', localQueueConfirmed: false }), /ficou salvo neste aparelho/);
  assert.match(h.ctx.getCentralCloudErrorMessage({ isNetworkError: true, localQueueConfirmed: true }), /ficou salvo neste aparelho/);
});
test('queue failure logs do not expose raw records or corrupt storage data', async () => {
  const h = harness(); h.values.set(KEY, '{PRIVATE DRIVER NAME');
  await h.ctx.saveCentralRetryPayload(payload()); await h.ctx.retryPendingCentralRegistro();
  assert.doesNotMatch(JSON.stringify(h.logs), /PRIVATE DRIVER NAME/);
});
