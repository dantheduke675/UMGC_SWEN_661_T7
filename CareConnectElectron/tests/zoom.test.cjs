const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./harness.cjs');

// Stand-in for the preload bridge (webFrame zoom)
function zoomApi() {
  const api = { factor: 1, sets: [], getZoom: () => api.factor, setZoom: f => { api.factor = f; api.sets.push(f); } };
  return api;
}

test('Ctrl + and Ctrl - step through the zoom levels and announce them', t => {
  const z = zoomApi();
  const h = setup(t, {}, { zoomApi: z });
  assert.equal(h.ctrl('='), true, 'Ctrl+= (unshifted plus key) is handled');
  assert.equal(z.factor, 1.1); assert.match(h.toastText(), /Zoom 110%/);
  h.ctrl('+', { shiftKey: true, code: 'Equal' }); assert.equal(z.factor, 1.25);
  h.ctrl('+', { code: 'NumpadAdd' }); assert.equal(z.factor, 1.5);
  h.ctrl('-'); assert.equal(z.factor, 1.25);
  h.ctrl('_', { shiftKey: true, code: 'Minus' }); assert.equal(z.factor, 1.1);
  h.ctrl('-', { code: 'NumpadSubtract' }); assert.equal(z.factor, 1);
  assert.equal(h.w.localStorage.getItem('cc.zoom'), '1');
});

test('Ctrl 0 resets zoom to 100%', t => {
  const z = zoomApi();
  const h = setup(t, {}, { zoomApi: z });
  z.factor = 1.75; // e.g. zoomed with Ctrl+wheel
  h.ctrl('0', { code: 'Digit0' }); assert.equal(z.factor, 1); assert.match(h.toastText(), /Zoom 100%/);
  z.factor = 1.5;
  h.ctrl('0', { code: 'Numpad0' }); assert.equal(z.factor, 1);
});

test('zoom stops at 200% and 80% and says so', t => {
  const z = zoomApi();
  const h = setup(t, {}, { zoomApi: z });
  z.factor = 2;
  const before = z.sets.length;
  h.ctrl('='); assert.equal(z.factor, 2); assert.equal(z.sets.length, before, 'No change past the maximum');
  assert.match(h.toastText(), /already at its maximum \(200%\)/);
  z.factor = 0.8;
  h.ctrl('-'); assert.equal(z.factor, 0.8); assert.match(h.toastText(), /already at its minimum \(80%\)/);
});

test('zoom steps from an off-grid level (e.g. after Ctrl+wheel) to the next step', t => {
  const z = zoomApi();
  const h = setup(t, {}, { zoomApi: z });
  z.factor = 1.17;
  h.ctrl('='); assert.equal(z.factor, 1.25);
  z.factor = 1.17;
  h.ctrl('-'); assert.equal(z.factor, 1.1);
});

test('saved zoom is restored on launch without a toast', t => {
  const z = zoomApi();
  const h = setup(t, { zoom: '1.5' }, { zoomApi: z });
  assert.equal(z.factor, 1.5);
  assert.equal(h.toastShown(), false);
});

test('zoom works on the sign-in screens too', t => {
  const z = zoomApi();
  const h = setup(t, {}, { zoomApi: z });
  assert.equal(h.read('state.screen'), 'landing');
  h.ctrl('='); assert.equal(z.factor, 1.1);
});

test('Account page zoom buttons change zoom and show the current level', t => {
  const z = zoomApi();
  const h = setup(t, {}, { zoomApi: z });
  h.signIn(); h.go('account');
  const label = () => [...h.w.document.querySelectorAll('.row')].find(r => /Zoom/.test(r.textContent)).querySelector('.sub2').textContent;
  assert.equal(label(), '100%');
  h.click('[data-act="zoom-in"]'); assert.equal(z.factor, 1.1); assert.equal(label(), '110%');
  h.click('[data-act="zoom-in"]'); assert.equal(label(), '125%');
  h.click('[data-act="zoom-out"]'); assert.equal(z.factor, 1.1); assert.equal(label(), '110%');
});

test('without the preload bridge, zoom falls back to CSS zoom', t => {
  const h = setup(t);
  const cssZoom = () => Number(h.w.document.documentElement.style.zoom);
  h.ctrl('='); assert.equal(cssZoom(), 1.1);
  h.ctrl('='); assert.equal(cssZoom(), 1.25);
  assert.equal(h.read('getZoom()'), 1.25);
});

test('zoom keys ignore Alt (AltGr) and the Meta key', t => {
  const z = zoomApi();
  const h = setup(t, {}, { zoomApi: z });
  assert.equal(h.ctrl('=', { altKey: true }), false);
  h.key('=', { metaKey: true });
  assert.equal(z.factor, 1);
});
