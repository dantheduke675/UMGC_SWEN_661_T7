const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sourcePath = path.resolve(__dirname, '../main.js');

for (const platform of ['linux', 'win32', 'darwin']) test(`Electron lifecycle on ${platform}`, async () => {
  const events = new Map(), windows = [];
  let quitCount = 0, ready;
  const app = { whenReady: () => new Promise(resolve => { ready = resolve; }), on: (event, fn) => events.set(event, fn), quit: () => quitCount++ };
  class BrowserWindow {
    constructor(options) { this.options = options; windows.push(this); }
    loadFile(file) { this.file = file; }
    static getAllWindows() { return windows; }
  }
  vm.runInNewContext(fs.readFileSync(sourcePath, 'utf8'), {
    require: name => name === 'electron' ? { app, BrowserWindow } : require(name),
    __dirname: path.dirname(sourcePath), process: { platform }
  }, { filename: sourcePath });
  assert.equal(windows.length, 0, 'Wait for app readiness');
  ready(); await Promise.resolve();
  assert.equal(windows.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(windows[0].options)), {
    width: 1440, height: 900, minWidth: 1024, minHeight: 700, title: 'CareConnect', backgroundColor: '#0f1420', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  assert.equal(windows[0].file, path.resolve(__dirname, '../src/index.html'));
  events.get('activate')(); assert.equal(windows.length, 1, 'Do not duplicate an open window');
  windows.length = 0; events.get('activate')(); assert.equal(windows.length, 1, 'Reopen when all windows closed');
  events.get('window-all-closed')(); assert.equal(quitCount, platform === 'darwin' ? 0 : 1);
});
