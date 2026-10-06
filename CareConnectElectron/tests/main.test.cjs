const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sourcePath = path.resolve(__dirname, '../main.js');
const preloadPath = path.resolve(__dirname, '../preload.js');

// Run main.js against a fake Electron and hand back what it did
function bootMain(platform) {
  const events = new Map(), windows = [], menus = [];
  let quitCount = 0, ready;
  const app = { whenReady: () => new Promise(resolve => { ready = resolve; }), on: (event, fn) => events.set(event, fn), quit: () => quitCount++ };
  const Menu = { setApplicationMenu: menu => menus.push(menu) };
  class BrowserWindow {
    constructor(options) {
      this.options = options;
      this.inputHandlers = [];
      this.devToolsToggles = 0;
      this.webContents = {
        on: (event, fn) => { if (event === 'before-input-event') this.inputHandlers.push(fn); },
        toggleDevTools: () => this.devToolsToggles++
      };
      windows.push(this);
    }
    loadFile(file) { this.file = file; }
    static getAllWindows() { return windows; }
  }
  vm.runInNewContext(fs.readFileSync(sourcePath, 'utf8'), {
    require: name => name === 'electron' ? { app, BrowserWindow, Menu } : require(name),
    __dirname: path.dirname(sourcePath), process: { platform }
  }, { filename: sourcePath });
  return { events, windows, menus, ready: async () => { ready(); await Promise.resolve(); }, quits: () => quitCount };
}

for (const platform of ['linux', 'win32', 'darwin']) test(`Electron lifecycle on ${platform}`, async () => {
  const m = bootMain(platform);
  const { windows, events } = m;
  assert.equal(windows.length, 0, 'Wait for app readiness');
  await m.ready();
  assert.equal(windows.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(windows[0].options)), {
    width: 1440, height: 900, minWidth: 1024, minHeight: 700, title: 'CareConnect', backgroundColor: '#0f1420', autoHideMenuBar: true,
    webPreferences: { preload: preloadPath, contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  assert.equal(windows[0].file, path.resolve(__dirname, '../src/index.html'));
  events.get('activate')(); assert.equal(windows.length, 1, 'Do not duplicate an open window');
  windows.length = 0; events.get('activate')(); assert.equal(windows.length, 1, 'Reopen when all windows closed');
  events.get('window-all-closed')(); assert.equal(m.quits(), platform === 'darwin' ? 0 : 1);
});

for (const platform of ['linux', 'win32', 'darwin']) test(`default menu accelerators removed on ${platform} so app shortcuts win`, async () => {
  const m = bootMain(platform);
  await m.ready();
  // Without this, the menu's Ctrl+R (reload) and Ctrl+/- (zoom) run before the renderer sees them
  assert.deepEqual(m.menus, platform === 'darwin' ? [] : [null]);
});

test('F12 toggles developer tools; other keys and key-up events do not', async () => {
  const m = bootMain('win32');
  await m.ready();
  const win = m.windows[0];
  assert.equal(win.inputHandlers.length, 1);
  const send = input => win.inputHandlers[0]({}, input);
  send({ type: 'keyDown', key: 'F12' }); assert.equal(win.devToolsToggles, 1);
  send({ type: 'keyUp', key: 'F12' }); assert.equal(win.devToolsToggles, 1);
  send({ type: 'keyDown', key: 'r', control: true }); assert.equal(win.devToolsToggles, 1);
  send({ type: 'keyDown', key: 'F12' }); assert.equal(win.devToolsToggles, 2);
});

test('preload exposes only the zoom bridge, backed by webFrame', () => {
  const exposed = {};
  let factor = 1;
  const webFrame = { getZoomFactor: () => factor, setZoomFactor: f => { factor = f; } };
  const contextBridge = { exposeInMainWorld: (name, api) => { exposed[name] = api; } };
  vm.runInNewContext(fs.readFileSync(preloadPath, 'utf8'), {
    require: name => { assert.equal(name, 'electron'); return { contextBridge, webFrame }; }
  }, { filename: preloadPath });
  assert.deepEqual(Object.keys(exposed), ['careconnect']);
  assert.deepEqual(Object.keys(exposed.careconnect).sort(), ['getZoom', 'setZoom']);
  exposed.careconnect.setZoom(1.25);
  assert.equal(factor, 1.25);
  assert.equal(exposed.careconnect.getZoom(), 1.25);
});

test('preload rejects zoom values that are not numbers between 25% and 500%', () => {
  const exposed = {};
  const sets = [];
  const webFrame = { getZoomFactor: () => 1, setZoomFactor: f => sets.push(f) };
  vm.runInNewContext(fs.readFileSync(preloadPath, 'utf8'), {
    require: () => ({ contextBridge: { exposeInMainWorld: (name, api) => { exposed[name] = api; } }, webFrame }),
    Number
  }, { filename: preloadPath });
  for (const bad of [0, 0.1, 6, -1, NaN, Infinity, '2', null, undefined, { valueOf: () => 2 }]) exposed.careconnect.setZoom(bad);
  assert.deepEqual(sets, []);
  for (const ok of [0.25, 1, 2, 5]) exposed.careconnect.setZoom(ok);
  assert.deepEqual(sets, [0.25, 1, 2, 5]);
});
