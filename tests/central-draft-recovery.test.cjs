const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../postoscredenciados-covreecia/app.js'), 'utf8');
function harness() {
  const elements = {};
  const storage = new Map();
  let driver = 'd1', changes = 0, confirms = false;
  function element(tagName = 'DIV', id = '') {
    const el = { tagName, id, type: 'text', value: '', dataset: {}, style: {}, children: [], options: [],
      appendChild(child) { this.children.push(child); if (tagName === 'SELECT') this.options.push(child); },
      append(...children) { children.forEach(c => this.appendChild(c)); }, prepend(child) { this.children.unshift(child); },
      setAttribute() {}, remove() {}, querySelector() { return null; },
      contains(field) { return Object.values(elements).includes(field); },
      dispatchEvent() { changes++; throw Error('Recovery must not dispatch change'); }
    };
    Object.defineProperty(el, 'innerHTML', { set() { el.children = []; el.options = []; } });
    return el;
  }
  for (const [id, tag] of [['fuel-form','FORM'], ['fuel-city','SELECT'], ['fuel-station','SELECT'], ['fuel-value','INPUT'], ['receipt','INPUT'], ['driver-name','SELECT']]) elements[id] = element(tag, id);
  elements.receipt.type = 'file'; elements['driver-name'].disabled = true; elements['driver-name'].value = 'Current driver';
  const c = vm.createContext({ Date, Array, String, Object, console,
    centralOrganizationContext: { workspaceId: 'tenant' }, getDriverProfile: () => ({ driverId: driver, vehicleId: 'v1' }),
    centralTenantStorageKey: k => 'tenant:' + k, currentFuelFormMode: 'rapido', postosPorCidade: {},
    localStorage: { getItem: k => storage.get(k), removeItem: k => storage.delete(k), setItem: (k,v) => storage.set(k,v) },
    document: { getElementById: id => elements[id], createElement: tag => element(tag.toUpperCase()) },
    applyFuelFormMode() {}, toggleCustomDriverField() {}, toggleLooseCustomDriverField() {},
    prepareFuelForm() {}, prepareLooseNoteForm() {}, window: { confirm: () => confirms }
  });
  vm.runInContext(source.slice(source.indexOf('function centralFormDraftKey('), source.indexOf("document.addEventListener('input',")), c);
  vm.runInContext(source.slice(source.indexOf('function refreshCentralStationCityOptions('), source.indexOf('async function loadManagedCentralStations(')), c);
  const key = c.centralFormDraftKey('fuel-form');
  storage.set(key, JSON.stringify({ savedAt: Date.now(), mode: 'completo', fields: {
    'fuel-city': { value: 'Cidade offline' }, 'fuel-station': { value: 'Posto offline' },
    'fuel-value': { value: '123,45' }, receipt: { value: 'must-not-restore' }, 'driver-name': { value: 'Old name' }
  } }));
  return { c, elements, storage, key, switchDriver: () => driver = 'd2', confirm: () => confirms = true, changes: () => changes };
}
test('restores all text immediately without network, events or rewriting saved draft', () => {
  const h = harness(), original = h.storage.get(h.key); h.c.offerCentralFormDraft('fuel-form');
  assert.equal(h.elements['fuel-city'].value, 'Cidade offline');
  assert.equal(h.elements['fuel-station'].value, 'Posto offline');
  assert.equal(h.elements['fuel-value'].value, '123,45');
  assert.equal(h.changes(), 0); assert.equal(h.storage.get(h.key), original);
  assert.equal(h.elements.receipt.value, ''); assert.equal(h.elements['driver-name'].value, 'Current driver');
});
test('directory refresh preserves restored city absent from remote list', () => {
  const h = harness(); h.c.offerCentralFormDraft('fuel-form'); h.c.refreshCentralStationCityOptions();
  assert.equal(h.elements['fuel-city'].value, 'Cidade offline');
  assert.ok(h.elements['fuel-city'].options.some(o => o.value === 'Cidade offline'));
  assert.equal(h.elements['fuel-station'].value, 'Posto offline');
});
test('other driver never receives draft', () => {
  const h = harness(); h.switchDriver(); h.c.offerCentralFormDraft('fuel-form'); assert.equal(h.elements['fuel-value'].value, '');
});
test('a quick draft cannot switch the explicitly selected complete mode', () => {
  const h = harness(); h.c.currentFuelFormMode = 'completo';
  h.c.applyFuelFormMode = mode => { h.c.currentFuelFormMode = mode; };
  const draft = JSON.parse(h.storage.get(h.key)); draft.mode = 'rapido'; h.storage.set(h.key, JSON.stringify(draft));
  h.c.offerCentralFormDraft('fuel-form'); assert.equal(h.c.currentFuelFormMode, 'completo');
});
test('legacy defaults alone do not display a recovery message and are not deleted', () => {
  const h = harness(); const draft = { savedAt: Date.now(), fields: { 'driver-name': { value: 'Driver' }, 'fuel-date': { value: '2026-10-03' }, 'fuel-city': { value: 'Default' } } };
  h.storage.set(h.key, JSON.stringify(draft)); h.c.offerCentralFormDraft('fuel-form');
  assert.equal(h.elements['fuel-form'].children.length, 0); assert.ok(h.storage.has(h.key));
});
test('untouched baseline does not create a draft when camera/save is clicked', () => {
  const h = harness(); h.storage.delete(h.key);
  const form = h.elements['fuel-form']; form.querySelectorAll = () => [h.elements['fuel-city'], h.elements['fuel-value']];
  form.dataset.draftBaseline = JSON.stringify(h.c.centralDraftFields(form));
  assert.equal(h.c.persistCentralFormDraft('fuel-form'), false); assert.equal(h.storage.size, 0);
  h.elements['fuel-value'].value = '100'; assert.equal(h.c.persistCentralFormDraft('fuel-form'), true);
});
test('discard requires confirmation and removes only this draft, not queue', () => {
  const h = harness(); h.storage.set('pending-queue', 'preserved'); h.c.offerCentralFormDraft('fuel-form');
  const button = h.elements['fuel-form'].children[0].children[1]; button.onclick(); assert.ok(h.storage.has(h.key));
  h.confirm(); button.onclick(); assert.equal(h.storage.has(h.key), false); assert.equal(h.storage.get('pending-queue'), 'preserved');
});
test('card opens history with pointer and keyboard without nested buttons', () => {
  const html = fs.readFileSync(path.join(__dirname, '../postoscredenciados-covreecia/index.html'), 'utf8');
  const card = html.slice(html.indexOf('<article class="home-overview-card home-last-send-card"'), html.indexOf('</article>', html.indexOf('<article class="home-overview-card home-last-send-card"')));
  assert.match(card, /role="button" tabindex="0"/); assert.match(card, /onclick="openMySubmissions\(\)"/);
  assert.match(card, /event.key === 'Enter'/); assert.match(card, /event.key === ' '/); assert.doesNotMatch(card, /<button/);
});
