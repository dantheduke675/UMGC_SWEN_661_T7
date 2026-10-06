// Jest port of tests/zoom.test.cjs (the node:test original is kept and still runs with npm test)
const { setupApp } = require('./jest-harness');

// Stand-in for the preload bridge (webFrame zoom)
function zoomApi() {
  const api = { factor: 1, sets: [], getZoom: () => api.factor, setZoom: f => { api.factor = f; api.sets.push(f); } };
  return api;
}

test('Ctrl + and Ctrl - step through the zoom levels and announce them', () => {
  const z = zoomApi();
  const h = setupApp({}, { zoomApi: z });
  expect(h.ctrl('=')).toBe(true);
  expect(z.factor).toBe(1.1); expect(h.toastText()).toMatch(/Zoom 110%/);
  h.ctrl('+', { shiftKey: true, code: 'Equal' }); expect(z.factor).toBe(1.25);
  h.ctrl('+', { code: 'NumpadAdd' }); expect(z.factor).toBe(1.5);
  h.ctrl('-'); expect(z.factor).toBe(1.25);
  h.ctrl('_', { shiftKey: true, code: 'Minus' }); expect(z.factor).toBe(1.1);
  h.ctrl('-', { code: 'NumpadSubtract' }); expect(z.factor).toBe(1);
  expect(h.w.localStorage.getItem('cc.zoom')).toBe('1');
});

test('Ctrl 0 resets zoom to 100%', () => {
  const z = zoomApi();
  const h = setupApp({}, { zoomApi: z });
  z.factor = 1.75; // e.g. zoomed with Ctrl+wheel
  h.ctrl('0', { code: 'Digit0' }); expect(z.factor).toBe(1); expect(h.toastText()).toMatch(/Zoom 100%/);
  z.factor = 1.5;
  h.ctrl('0', { code: 'Numpad0' }); expect(z.factor).toBe(1);
});

test('zoom stops at 200% and 80% and says so', () => {
  const z = zoomApi();
  const h = setupApp({}, { zoomApi: z });
  z.factor = 2;
  const before = z.sets.length;
  h.ctrl('='); expect(z.factor).toBe(2); expect(z.sets.length).toBe(before);
  expect(h.toastText()).toMatch(/already at its maximum \(200%\)/);
  z.factor = 0.8;
  h.ctrl('-'); expect(z.factor).toBe(0.8); expect(h.toastText()).toMatch(/already at its minimum \(80%\)/);
});

test('zoom steps from an off-grid level (e.g. after Ctrl+wheel) to the next step', () => {
  const z = zoomApi();
  const h = setupApp({}, { zoomApi: z });
  z.factor = 1.17;
  h.ctrl('='); expect(z.factor).toBe(1.25);
  z.factor = 1.17;
  h.ctrl('-'); expect(z.factor).toBe(1.1);
});

test('saved zoom is restored on launch without a toast', () => {
  const z = zoomApi();
  const h = setupApp({ zoom: '1.5' }, { zoomApi: z });
  expect(z.factor).toBe(1.5);
  expect(h.toastShown()).toBe(false);
});

test('zoom works on the sign-in screens too', () => {
  const z = zoomApi();
  const h = setupApp({}, { zoomApi: z });
  expect(h.read('state.screen')).toBe('landing');
  h.ctrl('='); expect(z.factor).toBe(1.1);
});

test('Account page zoom buttons change zoom and show the current level', () => {
  const z = zoomApi();
  const h = setupApp({}, { zoomApi: z });
  h.signIn(); h.go('account');
  const label = () => [...h.w.document.querySelectorAll('.row')].find(r => /Zoom/.test(r.textContent)).querySelector('.sub2').textContent;
  expect(label()).toBe('100%');
  h.click('[data-act="zoom-in"]'); expect(z.factor).toBe(1.1); expect(label()).toBe('110%');
  h.click('[data-act="zoom-in"]'); expect(label()).toBe('125%');
  h.click('[data-act="zoom-out"]'); expect(z.factor).toBe(1.1); expect(label()).toBe('110%');
});

test('without the preload bridge, zoom falls back to CSS zoom', () => {
  const h = setupApp();
  const cssZoom = () => Number(h.w.document.documentElement.style.zoom);
  h.ctrl('='); expect(cssZoom()).toBe(1.1);
  h.ctrl('='); expect(cssZoom()).toBe(1.25);
  expect(h.read('getZoom()')).toBe(1.25);
});

test('zoom keys ignore Alt (AltGr) and the Meta key', () => {
  const z = zoomApi();
  const h = setupApp({}, { zoomApi: z });
  expect(h.ctrl('=', { altKey: true })).toBe(false);
  h.key('=', { metaKey: true });
  expect(z.factor).toBe(1);
});
