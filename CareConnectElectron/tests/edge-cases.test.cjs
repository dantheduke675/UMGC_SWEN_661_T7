const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./harness.cjs');

// Edge cases of focus handling: the other half of conditions the main
// keyboard and undo tests exercise one way only.

const SIGNIN = [
  ['#app', [0, 0, 1440, 768]],
  ['#si-email', [470, 300, 500, 64]],
  ['#si-pass', [470, 400, 500, 64]],
  ['#signin-form [type="submit"]', [470, 500, 500, 70]]
];
const SHELL = [
  ['#app', [0, 0, 1440, 768]],
  ['.content', [300, 72, 1140, 696]],
  ['[data-act="eye"]', [1220, 13, 46, 46]],
  ['[data-act="sos"]', [1340, 13, 80, 46]],
  ['[data-med-take="2"]', [335, 300, 300, 52]],
  ['.modal [data-close]', [700, 500, 100, 52]],
  ['[data-act="sos-confirm"]', [810, 500, 140, 52]],
  ['#toast', [1000, 680, 400, 70]],
  ['.toast-undo', [1250, 690, 70, 44]],
  ['.toast-close', [1330, 690, 44, 44]]
];
const desc = el => el === el.ownerDocument.body ? 'BODY' : el.outerHTML.slice(0, 80);
function assertFocus(h, selector, message) {
  assert.equal(h.focused(), h.q(selector), `${message || 'focus'}: expected ${selector}, got ${desc(h.focused())}`);
}

test('Left with text selected collapses the selection instead of leaving the field', t => {
  const h = setup(t); h.layout(SIGNIN); h.go('signin');
  // The password field: email fields don't expose a caret or selection at all
  const pass = h.q('#si-pass');
  pass.focus(); pass.value = 'secret'; pass.setSelectionRange(0, pass.value.length);
  assert.equal(h.key('ArrowLeft'), false, 'Left is left to the field'); assertFocus(h, '#si-pass');
  pass.setSelectionRange(0, 0);
  assert.equal(h.key('ArrowLeft'), true, 'Caret at the start: the arrow navigates');
});

test('an arrow key with nothing focused puts focus on a control', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  h.focused().blur(); assert.equal(h.focused(), h.w.document.body);
  h.key('ArrowDown');
  assert.notEqual(h.focused(), h.w.document.body, 'Focus landed on a control');
  assert.ok(h.q('#app').contains(h.focused()));
});

test('focus is not pulled back while the window is in the background', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  h.q('[data-act="eye"]').focus();
  // The user switched to another window: blur happens, but nothing should grab focus
  h.w.document.hasFocus = () => false;
  h.focused().blur(); h.tick(0);
  assert.equal(h.focused(), h.w.document.body, 'Left alone while in the background');
  // Back in the window, the next lost focus is restored as usual
  h.w.document.hasFocus = () => true;
  h.q('[data-act="eye"]').focus(); h.focused().blur(); h.tick(0);
  assertFocus(h, '[data-act="eye"]');
});

test('Shift+Tab on the first control of a dialog wraps to the last', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  h.click('[data-act="sos"]');
  const controls = [...h.q('#modal-root').querySelectorAll('button')];
  controls[0].focus();
  assert.equal(h.key('Tab', { shiftKey: true }), true);
  assert.equal(h.focused(), controls[controls.length - 1], 'Wrapped to the last control');
  assert.ok(h.q('#modal-root').contains(h.focused()), 'Still inside the dialog');
});

test('pressing Undo on the toast by keyboard keeps focus on the follow-up toast', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  h.click('[data-med-take="2"]');
  h.q('.toast-undo').focus();
  h.click('.toast-undo');
  assert.match(h.toastText(), /Undone/);
  // The new toast has no Undo, so focus goes to its Dismiss button rather than the page
  assertFocus(h, '.toast-close', 'Focus stays in the toast');
});
