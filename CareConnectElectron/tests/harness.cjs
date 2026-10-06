const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const sourcePath = path.resolve(__dirname, '../src/app.js');

// Execute the unchanged browser script against a fresh DOM for each case.
// opts.zoomApi: stand-in for the preload's window.careconnect zoom bridge.
// Shared by the node:test suites (setup) and the Jest suites (createApp).
function createApp(storage = {}, opts = {}) {
  const dom = new JSDOM(fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8'), {
    url: 'https://careconnect.test/', runScripts: 'outside-only'
  });
  const w = dom.window;
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem('cc.' + key, value);
  // Keep greetings and displayed timestamps independent of the machine clock.
  const NativeDate = w.Date;
  w.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [new NativeDate(2026, 8, 28, 9, 10).getTime()])); }
    static now() { return new NativeDate(2026, 8, 28, 9, 10).getTime() + time; }
  };
  let time = 0, id = 0;
  const timers = new Map();
  w.setTimeout = (fn, delay = 0) => { timers.set(++id, { fn, due: time + delay }); return id; };
  w.setInterval = (fn, delay) => { timers.set(++id, { fn, due: time + delay, interval: delay }); return id; };
  w.clearTimeout = w.clearInterval = key => timers.delete(key);
  if (opts.zoomApi) w.careconnect = opts.zoomApi;
  const errors = [];
  w.addEventListener('error', e => { errors.push(e.error); });

  // jsdom has no layout engine. layout() gives matching elements a fixed
  // on-screen rect so focus movement can be tested geometrically; anything
  // without a rect counts as not rendered (like display: none).
  let table = null;
  const scrolls = [];
  const rectOf = el => {
    if (!table) return null;
    for (const [selector, r] of table) if (el.matches(selector)) return r;
    return null;
  };
  const domRect = ([left, top, width, height]) => ({ left, top, width, height, x: left, y: top, right: left + width, bottom: top + height });
  const P = w.Element.prototype;
  const nativeRect = P.getBoundingClientRect, nativeRects = P.getClientRects;
  P.getBoundingClientRect = function () { const r = rectOf(this); return r ? domRect(r) : nativeRect.call(this); };
  P.getClientRects = function () { const r = rectOf(this); return r ? [domRect(r)] : nativeRects.call(this); };
  P.checkVisibility = function () { return !!rectOf(this); };
  P.scrollIntoView = function (options) { scrolls.push({ el: this, intoView: options }); };
  P.scrollBy = function (options) { scrolls.push({ el: this, by: options }); };

  vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), dom.getInternalVMContext(), { filename: sourcePath });
  const q = selector => w.document.querySelector(selector);
  const read = expression => vm.runInContext(expression, dom.getInternalVMContext());
  const click = selector => { assert.ok(q(selector), `Missing ${selector}`); q(selector).click(); };
  const input = (selector, value) => { q(selector).value = value; q(selector).dispatchEvent(new w.Event('input', { bubbles: true })); };
  const submit = selector => q(selector).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  const tick = duration => {
    const end = time + duration;
    while (true) {
      const next = [...timers].filter(([, x]) => x.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      const [key, timer] = next; time = timer.due;
      if (timer.interval) timer.due += timer.interval; else timers.delete(key);
      timer.fn();
    }
    time = end;
  };
  // Dispatch a keydown at the focused element; returns true when the app
  // called preventDefault (i.e. it handled the key)
  const key = (k, mods = {}) => {
    const target = w.document.activeElement || w.document.body;
    const code = mods.code || (k.length === 1 ? 'Key' + k.toUpperCase() : k);
    const ev = new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...mods, code });
    return !target.dispatchEvent(ev);
  };
  const ctrl = (k, mods = {}) => key(k, { ctrlKey: true, ...mods });
  // Move the pointer to client coordinates (screen coordinates follow them)
  const pointer = (type, x, y, target) => {
    target = target || w.document.elementFromPoint?.(x, y) || w.document.body;
    target.dispatchEvent(new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, screenX: x, screenY: y }));
  };
  const focused = () => w.document.activeElement;
  const toastText = () => q('#toast').textContent.replace(/\s+/g, ' ').trim();
  const toastShown = () => q('#toast').classList.contains('show');
  const layout = rects => { table = rects; };

  // Fails the test if the page threw, then tears the DOM down
  const dispose = () => { timers.clear(); dom.window.close(); assert.deepEqual(errors, [], 'No uncaught DOM errors'); };
  return {
    dispose,
    w, q, read, click, input, submit, tick, key, ctrl, pointer, focused, toastText, toastShown, layout, scrolls,
    go: screen => read(`go(${JSON.stringify(screen)})`),
    signIn: () => read(`state.history = []; go('today', { replace: true })`)
  };
}

// node:test entry point
function setup(t, storage = {}, opts = {}) {
  const h = createApp(storage, opts);
  t.after(h.dispose);
  return h;
}

module.exports = { setup, createApp };
