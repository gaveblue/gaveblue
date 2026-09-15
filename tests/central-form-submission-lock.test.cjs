// Actual form handlers, payload builder and durable retry queue in an isolated
// VM. Only synthetic data and in-memory persistence; no network or browser.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../postoscredenciados-covreecia/app.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function block(start, end) {
  const begin = source.indexOf(start), finish = source.indexOf(end, begin + start.length);
  assert.ok(begin >= 0 && finish > begin, `Missing source block: ${start}`);
  return source.slice(begin, finish);
}

function harness(options = {}) {
  const storage = new Map(), requests = [], offline = [], errors = [], success = [], whatsApp = [];
  const state = { profileCalls: 0, protocolCalls: 0, profileGate: null, saveGate: null, queueGate: null,
    profileError: null, saveError: null, queueError: null, storageError: null, resets: 0, closed: 0, localBackupCalls: 0 };
  const profile = { name: 'Pessoa de exemplo', driverId: 'driver-fixture', vehicleId: 'vehicle-fixture', plate: 'ABC1D23' };
  const fields = { motorista: profile.name, data: '2026-09-05', dataFormatada: '05/09/2026', horaFormatada: '10:00',
    km: '100', cidade: 'Cidade de exemplo', posto: 'Fornecedor de exemplo', fornecedor: 'Fornecedor de exemplo',
    tipoServico: 'Serviço fictício', valor: '25', litros: '5', tipoCombustivel: 'Diesel', observacoes: 'Teste local', file: { name: 'fixture.png', size: 123, lastModified: 1, type: 'image/png' } };
  function form() {
    const attributes = new Map();
    const buttons = [{ disabled: false }, { disabled: true }];
    return { buttons, attributes, querySelectorAll: () => buttons,
      getAttribute: key => attributes.get(key) ?? null, setAttribute: (key, value) => attributes.set(key, value),
      removeAttribute: key => attributes.delete(key), reset: () => { state.resets++; } };
  }
  const forms = { 'fuel-form': form(), 'loose-note-form': form() };
  const nodes = { ...forms, 'fuel-form-modal': { classList: { add: () => { state.closed++; } } } };
  const localStorage = { get length() { return storage.size; }, key: index => [...storage.keys()][index] ?? null,
    getItem: key => storage.get(key) ?? null, setItem: (key, value) => { if (state.storageError) throw state.storageError; storage.set(key, String(value)); }, removeItem: key => storage.delete(key) };
  const context = vm.createContext({ Error, console: { error() {}, warn() {}, info() {} }, document: { getElementById: id => nodes[id] || null },
    navigator: { onLine: options.online !== false }, localStorage,
    CENTRAL_CLOUD_ENABLED: true, CENTRAL_CLOUD_ORIGIN: 'fixture', CENTRAL_DEFAULT_ORGANIZATION_SLUG: 'fixture-company',
    CENTRAL_PENDING_RECORDS_KEY: 'fixture-queue', centralOrganizationContext: { workspaceId: 'fixture-company', slug: 'fixture-company' },
    centralRetryInProgress: false, centralTenantStorageKey: key => `${key}:${context.centralOrganizationContext.workspaceId}`,
    persistCentralDeviceState: async () => { state.localBackupCalls++; },
    getDriverProfile: () => profile, getCentralDeviceId: () => 'device-fixture', getCentralPushSubscriptionId: () => '',
    createCentralProtocol: () => `fixture-protocol-${++state.protocolCalls}`, createCentralRowId: protocol => protocol,
    cleanCentralPayload: value => clone(value), parseKmValue: Number, parseCentralMoney: Number, parseCentralDecimal: Number,
    requireAuthorizedDriverProfile: async () => {
      state.profileCalls++;
      if (state.profileGate) await state.profileGate.promise;
      if (state.profileError) throw state.profileError;
      return profile;
    },
    normalizeDirectoryValue: value => String(value || '').trim().toLowerCase(), DRIVER_PROFILE_PERMISSION_ERROR: 'Perfil inválido',
    getFuelFormData: () => ({ ...fields }), getLooseNoteFormData: () => ({ ...fields }),
    getFuelReceiptUploadKey: () => 'fuel-fixture', getLooseNoteReceiptUploadKey: () => 'loose-fixture', currentFuelFormMode: 'completo',
    uploadedFuelReceipt: { key: 'fuel-fixture', result: { offline: options.offline === true, secure_url: 'https://assets.example.invalid/receipt.png' }, offlineFile: fields.file },
    uploadedLooseNoteReceipt: { key: 'loose-fixture', result: { offline: options.offline === true, secure_url: 'https://assets.example.invalid/receipt.png' }, offlineFile: fields.file },
    executeCentralPushFunction: async request => {
      requests.push(clone(request));
      if (state.saveGate) await state.saveGate.promise;
      if (state.saveError) throw state.saveError;
      return { ok: true, record: { $id: request.rowId } };
    },
    queueCentralOfflineSubmission: async submission => {
      if (state.queueGate) await state.queueGate.promise;
      if (state.queueError) throw state.queueError;
      offline.push(clone(submission));
    },
    buildFuelWhatsAppMessage: () => 'Mensagem fictícia', buildLooseWhatsAppMessage: () => 'Mensagem fictícia',
    openWhatsAppDirect: (...args) => whatsApp.push(args), FUEL_WHATSAPP_NUMBER: 'fixture-no-destination',
    getCentralCloudErrorMessage: error => error.message, showErrorMessage: message => errors.push(message), showSuccessMessage: message => success.push(message),
    saveDriverNameSuggestion() {}, saveLastFuelEntry() {}, saveCentralLastSentRecord() {},
    clearConfirmedCentralFormDraft() {},
    resetFuelPhotoState() {}, setFuelDateToToday() {}, applyFuelFormMode() {}, populateDriverOptions() {}, closeLooseNoteForm: () => { state.closed++; }
  });
  vm.runInContext(block('function buildCentralRegistroPayload(', 'function getRequestedCentralOrganizationSlug('), context);
  vm.runInContext(block('async function retryPendingCentralRegistro(', 'function getCentralCloudErrorMessage('), context);
  vm.runInContext(block('const centralFormSubmissionsInProgress =', 'function showSuccessMessage('), context);
  return { context, state, fields, profile, forms, requests, storage, offline, errors, success, whatsApp,
    submit: kind => context[kind === 'fuel' ? 'submitFuelForm' : 'submitLooseNoteForm']({ preventDefault() {} }),
    queue: () => clone(context.getCentralRetryPayloads()) };
}

for (const kind of ['fuel', 'loose']) {
  const formId = kind === 'fuel' ? 'fuel-form' : 'loose-note-form';
  test(`${kind}: concurrent clicks are blocked before profile validation's first await`, async () => {
    const h = harness(); h.state.profileGate = deferred();
    const first = h.submit(kind), second = h.submit(kind);
    assert.equal(h.state.profileCalls, 1);
    assert.equal(h.forms[formId].buttons[0].disabled, true);
    assert.equal(h.forms[formId].getAttribute('aria-busy'), 'true');
    h.state.profileGate.resolve(); await Promise.all([first, second]);
    assert.equal(h.requests.length, 1);
    assert.equal(h.state.protocolCalls, 1);
    assert.equal(h.whatsApp.length, 1);
    assert.deepEqual(h.queue(), []);
    assert.equal(h.forms[formId].buttons[0].disabled, false);
    assert.equal(h.forms[formId].buttons[1].disabled, true);
    assert.equal(h.forms[formId].getAttribute('aria-busy'), null);
  });

  test(`${kind}: another click while the server acknowledgement is pending cannot create a second row ID`, async () => {
    const h = harness(); h.state.saveGate = deferred();
    const first = h.submit(kind); await settle();
    assert.equal(h.requests.length, 1);
    await h.submit(kind);
    assert.equal(h.requests.length, 1);
    assert.equal(h.state.protocolCalls, 1);
    assert.equal(h.forms[formId].buttons[0].disabled, true);
    h.state.saveGate.resolve(); await first;
    assert.equal(h.forms[formId].buttons[0].disabled, false);
  });

  test(`${kind}: server failure releases the form while the real durable queue retries the same ID`, async () => {
    const h = harness(); h.state.saveError = new Error('Falha sintética no servidor');
    await h.submit(kind);
    assert.equal(h.forms[formId].buttons[0].disabled, false);
    assert.equal(h.state.closed, 0);
    assert.equal(h.state.resets, 0);
    assert.match(h.errors[0], /ainda aguarda confirmação.*mesmo registro/);
    const queued = h.queue();
    assert.equal(queued.length, 1);
    assert.equal(queued[0].rowId, h.requests[0].rowId);
    h.state.saveError = null;
    await h.context.retryPendingCentralRegistro();
    assert.equal(h.requests.length, 2);
    assert.equal(h.requests[1].rowId, h.requests[0].rowId);
    assert.equal(h.state.protocolCalls, 1);
    assert.deepEqual(h.queue(), []);
  });

  test(`${kind}: manual retry after HTTP 500 reuses the original payload and ID despite the advancing clock`, async () => {
    const h = harness(); h.state.saveError = Object.assign(new Error('HTTP 500'), { status: 500 });
    await h.submit(kind);
    const original = clone(h.requests[0]);
    h.fields.horaFormatada = '10:04'; h.state.saveError = null;
    await h.submit(kind);
    assert.equal(h.requests.length, 2);
    assert.deepEqual(h.requests[1], original);
    assert.equal(h.state.protocolCalls, 1);
    assert.equal(h.whatsApp.length, 1);
    assert.equal(h.state.closed, 1);
    assert.deepEqual(h.queue(), []);
  });

  test(`${kind}: an automatic retry ACK is consumed by the manual form without another POST`, async () => {
    const h = harness(); h.state.saveError = new Error('HTTP 500');
    await h.submit(kind); h.state.saveError = null;
    await h.context.retryPendingCentralRegistro();
    assert.equal(h.requests.length, 2);
    await h.submit(kind);
    assert.equal(h.requests.length, 2);
    assert.equal(h.state.protocolCalls, 1);
    assert.equal(h.state.closed, 1);
    assert.equal(h.success.length, 1);
  });

  test(`${kind}: concurrent manual and automatic retries after HTTP 500 share exactly one immutable record ID`, async () => {
    const h = harness(); h.state.saveError = new Error('HTTP 500');
    await h.submit(kind); const original = clone(h.requests[0]);
    h.state.saveError = null; h.state.saveGate = deferred();
    const manual = h.submit(kind), automatic = h.context.retryPendingCentralRegistro(); await settle();
    assert.ok(h.requests.length >= 2);
    for (const request of h.requests) assert.deepEqual(request, original);
    h.state.saveGate.resolve(); await Promise.all([manual, automatic]);
    assert.equal(h.state.protocolCalls, 1);
    assert.equal(h.state.closed, 1);
    assert.equal(h.success.length, 1);
    assert.deepEqual(h.queue(), []);
  });

  for (const changed of ['fields', 'receipt', 'file', 'profile']) {
    test(`${kind}: changing ${changed} during an uncertain attempt preserves it and refuses another record`, async () => {
      const h = harness(); h.state.saveError = new Error('HTTP 500');
      await h.submit(kind); const original = h.queue()[0];
      if (changed === 'fields') h.fields.valor = '40';
      if (changed === 'receipt') h.context[kind === 'fuel' ? 'uploadedFuelReceipt' : 'uploadedLooseNoteReceipt'].result.secure_url = 'https://assets.example.invalid/changed.png';
      if (changed === 'file') h.fields.file = { ...h.fields.file, lastModified: 2 };
      if (changed === 'profile') h.profile.vehicleId = 'changed-vehicle-fixture';
      h.state.saveError = null; await h.submit(kind);
      assert.equal(h.requests.length, 1);
      assert.equal(h.state.protocolCalls, 1);
      assert.equal(h.state.closed, 0);
      assert.equal(h.state.resets, 0);
      assert.equal(h.forms[formId].buttons[0].disabled, false);
      assert.match(h.errors.at(-1), /aguardando confirmação.*campos foram alterados.*Nenhum novo registro/);
      assert.deepEqual(h.queue()[0], original);
      if (changed === 'fields') assert.equal(h.fields.valor, '40');
    });
  }

  test(`${kind}: edits can become a new record only after the previous exact ID has an ACK`, async () => {
    const h = harness(); h.state.saveError = new Error('HTTP 500');
    await h.submit(kind); h.fields.valor = '40'; h.state.saveError = null;
    await h.context.retryPendingCentralRegistro(); await h.submit(kind);
    assert.equal(h.requests.length, 3);
    assert.equal(h.requests[1].rowId, h.requests[0].rowId);
    assert.notEqual(h.requests[2].rowId, h.requests[0].rowId);
    assert.equal(h.requests[2].data.valor, '40');
    assert.equal(h.state.protocolCalls, 2);
    assert.deepEqual(h.queue(), []);
  });

  test(`${kind}: editing while awaiting ACK cannot reset or silently submit the changed draft`, async () => {
    const h = harness(); h.state.saveGate = deferred();
    const pending = h.submit(kind); await settle();
    h.fields.valor = '50'; h.state.saveGate.resolve(); await pending;
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].data.valor, '25');
    assert.equal(h.state.closed, 0);
    assert.equal(h.state.resets, 0);
    assert.equal(h.fields.valor, '50');
    assert.match(h.success.at(-1), /envio anterior foi confirmado.*campos alterados.*mantidos/);
    await h.submit(kind);
    assert.equal(h.requests.length, 2);
    assert.notEqual(h.requests[1].rowId, h.requests[0].rowId);
    assert.equal(h.requests[1].data.valor, '50');
    assert.equal(h.state.closed, 1);
  });

  test(`${kind}: a pending online attempt cannot regenerate an ID when its receipt becomes locally available offline`, async () => {
    const h = harness(); h.state.saveError = new Error('HTTP 500'); await h.submit(kind);
    h.context[kind === 'fuel' ? 'uploadedFuelReceipt' : 'uploadedLooseNoteReceipt'].result.offline = true;
    h.state.saveError = null; await h.submit(kind);
    assert.equal(h.requests.length, 2);
    assert.equal(h.requests[1].rowId, h.requests[0].rowId);
    assert.equal(h.state.protocolCalls, 1);
    assert.equal(h.offline.length, 0);
  });

  test(`${kind}: a failed write before persistence releases the attempt and never sends it`, async () => {
    const h = harness(); h.state.storageError = new Error('Quota sintética');
    await h.submit(kind);
    assert.equal(h.requests.length, 0);
    assert.equal(h.state.closed, 0);
    assert.equal(h.queue().length, 0);
    h.fields.valor = '45'; h.state.storageError = null;
    await h.submit(kind);
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].data.valor, '45');
    assert.equal(h.state.protocolCalls, 2);
  });

  test(`${kind}: switching company while validating the profile cancels without creating any payload`, async () => {
    const h = harness(); h.state.profileGate = deferred();
    const pending = h.submit(kind);
    h.context.centralOrganizationContext = { workspaceId: 'another-company', slug: 'another-company' };
    h.state.profileGate.resolve(); await pending;
    assert.equal(h.requests.length, 0);
    assert.equal(h.state.protocolCalls, 0);
    assert.equal(h.state.closed, 0);
    assert.match(h.errors.at(-1), /empresa mudou durante a validação/);
    assert.equal(h.forms[formId].buttons[0].disabled, false);
  });

  test(`${kind}: switching company during server confirmation cannot reset the other company's form`, async () => {
    const h = harness(); h.state.saveGate = deferred();
    const pending = h.submit(kind); await settle();
    assert.equal(h.requests.length, 1);
    h.context.centralOrganizationContext = { workspaceId: 'another-company', slug: 'another-company' };
    h.state.saveGate.resolve(); await pending;
    assert.equal(h.state.closed, 0);
    assert.equal(h.state.resets, 0);
    assert.equal(h.success.length, 0);
    assert.match(h.errors.at(-1), /confirmado na empresa de origem/);
    assert.equal(h.requests[0].organizationSlug, 'fixture-company');
    assert.deepEqual(h.queue(), []);
    h.context.centralOrganizationContext = { workspaceId: 'fixture-company', slug: 'fixture-company' };
    await h.submit(kind);
    assert.equal(h.requests.length, 1);
    assert.equal(h.state.protocolCalls, 1);
    assert.equal(h.state.closed, 1);
  });

  test(`${kind}: uncertain attempts remain separated by company and are resumed only in their original workspace`, async () => {
    const h = harness(); h.state.saveError = new Error('HTTP 500');
    await h.submit(kind); const original = h.queue()[0];
    h.context.centralOrganizationContext = { workspaceId: 'another-company', slug: 'another-company' };
    h.state.saveError = null; await h.submit(kind);
    assert.equal(h.requests[1].organizationSlug, 'another-company');
    assert.notEqual(h.requests[1].rowId, original.rowId);
    h.context.centralOrganizationContext = { workspaceId: 'fixture-company', slug: 'fixture-company' };
    assert.deepEqual(h.queue(), [original]);
    await h.submit(kind);
    assert.equal(h.requests[2].rowId, original.rowId);
    assert.equal(h.requests[2].organizationSlug, 'fixture-company');
    assert.equal(h.state.protocolCalls, 2);
    assert.deepEqual(h.queue(), []);
  });

  test(`${kind}: unexpected profile failure is caught and a later click works`, async () => {
    const h = harness(); h.state.profileError = new Error('Perfil temporariamente indisponível');
    await h.submit(kind);
    assert.equal(h.forms[formId].buttons[0].disabled, false);
    assert.equal(h.requests.length, 0);
    assert.match(h.errors[0], /Perfil temporariamente/);
    h.state.profileError = null;
    await h.submit(kind);
    assert.equal(h.requests.length, 1);
    assert.equal(h.forms[formId].buttons[0].disabled, false);
  });

  test(`${kind}: validation exits restore the controls without sending or resetting data`, async () => {
    const h = harness(), file = h.fields.file; h.fields.file = null;
    await h.submit(kind);
    assert.equal(h.requests.length, 0);
    assert.equal(h.state.resets, 0);
    assert.equal(h.forms[formId].buttons[0].disabled, false);
    h.fields.file = file;
    await h.submit(kind);
    assert.equal(h.requests.length, 1);
  });

  test(`${kind}: concurrent offline submits queue exactly one payload and receipt`, async () => {
    const h = harness({ offline: true, online: false }); h.state.queueGate = deferred();
    const first = h.submit(kind); await settle();
    await h.submit(kind);
    assert.equal(h.state.protocolCalls, 1);
    h.state.queueGate.resolve(); await first;
    assert.equal(h.offline.length, 1);
    assert.equal(h.offline[0].payload.rowId, h.offline[0].offlineRecord.id);
    assert.ok(h.offline[0].receiptFile);
    assert.equal(h.requests.length, 0);
    assert.equal(h.whatsApp.length, 0);
    assert.equal(h.forms[formId].buttons[0].disabled, false);
  });

  test(`${kind}: offline write failure retains the form and permits a later retry`, async () => {
    const h = harness({ offline: true, online: false }); h.state.queueError = new Error('IndexedDB indisponível');
    await h.submit(kind);
    assert.equal(h.offline.length, 0);
    assert.equal(h.state.closed, 0);
    assert.equal(h.forms[formId].buttons[0].disabled, false);
    h.state.queueError = null;
    await h.submit(kind);
    assert.equal(h.offline.length, 1);
    assert.equal(h.requests.length, 0);
  });
}

test('each form has its own lock and an existing aria-busy value is restored', async () => {
  const h = harness(); h.state.saveGate = deferred();
  h.forms['fuel-form'].setAttribute('aria-busy', 'false');
  const fuel = h.submit('fuel'), loose = h.submit('loose'); await settle();
  assert.equal(h.requests.length, 2);
  assert.equal(new Set(h.requests.map(request => request.rowId)).size, 2);
  h.state.saveGate.resolve(); await Promise.all([fuel, loose]);
  assert.equal(h.forms['fuel-form'].getAttribute('aria-busy'), 'false');
  assert.equal(h.forms['loose-note-form'].getAttribute('aria-busy'), null);
});
