const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./harness.cjs');

// Screen rects [left, top, width, height] for the controls each test moves
// between. Anything not listed counts as not rendered.
const LANDING = [
  ['#app', [0, 0, 1440, 768]],
  ['.theme-fab', [1366, 24, 50, 50]],
  ['[data-go="create"]', [470, 420, 500, 70]],
  ['[data-go="signin"]', [470, 506, 500, 70]]
];
const SIGNIN = [
  ['#app', [0, 0, 1440, 768]],
  ['#si-email', [470, 300, 500, 64]],
  ['#si-pass', [470, 400, 500, 64]],
  ['#signin-form [type="submit"]', [470, 500, 500, 70]]
];
const SHELL = [
  ['#app', [0, 0, 1440, 768]],
  ['.content', [300, 72, 1140, 696]],
  ['[data-act="voice"]', [1160, 13, 46, 46]],
  ['[data-act="eye"]', [1220, 13, 46, 46]],
  ['[data-act="notes"]', [1280, 13, 46, 46]],
  ['[data-act="sos"]', [1340, 13, 80, 46]],
  ['.nav [data-go="today"]', [0, 112, 300, 50]],
  ['.nav [data-go="medications"]', [0, 162, 300, 50]],
  ['[data-med-take="2"]', [335, 300, 300, 52]],
  ['[data-med-miss="2"]', [645, 300, 300, 52]],
  ['[data-med-take="3"]', [335, 520, 300, 52]],
  // dialogs
  ['.modal [data-close]', [700, 500, 100, 52]],
  ['[data-act="sos-confirm"]', [810, 500, 140, 52]],
  ['#sym-name', [500, 250, 400, 64]],
  ['#sym-note', [500, 400, 400, 100]],
  ['#sym-form [type="submit"]', [810, 560, 140, 52]],
  // messages
  ['[data-call]', [1300, 100, 100, 60]],
  ['#thread', [700, 180, 700, 400]],
  ['[data-quick="Thank you"]', [700, 600, 150, 54]],
  ['#msg-input', [700, 680, 500, 60]]
];

const desc = el => el === el.ownerDocument.body ? 'BODY' : el.outerHTML.slice(0, 80);
function assertFocus(h, selector, message) {
  assert.equal(h.focused(), h.q(selector), `${message || 'focus'}: expected ${selector}, got ${desc(h.focused())}`);
}
// Give an element fake scroll metrics
function scrollable(el, { top = 0, height, client }) {
  let st = top;
  Object.defineProperty(el, 'scrollTop', { configurable: true, get: () => st, set: v => { st = v; } });
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => height });
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => client });
  return { set top(v) { st = v; } };
}

// ---------- Focus indicator: starting point ----------

test('landing starts on Sign in; arrows and WASD move between controls', t => {
  const h = setup(t); h.layout(LANDING); h.read('render({ fresh: true })');
  assertFocus(h, '[data-go="signin"]', 'starts on a control in view');
  assert.equal(h.key('ArrowUp'), true, 'Arrow keys are handled'); assertFocus(h, '[data-go="create"]');
  h.key('w'); assertFocus(h, '.theme-fab', 'W moves up');
  h.key('s'); assertFocus(h, '[data-go="create"]', 'S moves down');
  h.key('ArrowDown'); assertFocus(h, '[data-go="signin"]');
  h.key('ArrowDown'); assertFocus(h, '[data-go="signin"]', 'Stays put when nothing is further down');
  h.key('S', { shiftKey: true }); assertFocus(h, '[data-go="signin"]', 'Shifted WASD still navigates');
});

test('a new page starts on a control that is plainly in view', t => {
  const h = setup(t); h.layout(SHELL);
  h.signIn();
  // med 1 is taken and its status bar is not on screen in this layout
  assertFocus(h, '[data-med-take="2"]', 'first visible control in the page');
  h.go('medications'); assertFocus(h, '[data-med-take="2"]');
});

// ---------- Moving the focus indicator ----------

test('arrows move along rows, columns, the top bar and from the menu into the page', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  h.key('ArrowRight'); assertFocus(h, '[data-med-miss="2"]');
  h.key('ArrowLeft'); assertFocus(h, '[data-med-take="2"]');
  h.key('ArrowDown'); assertFocus(h, '[data-med-take="3"]', 'Prefers the control lined up below');
  assert.equal(h.scrolls.at(-1).el, h.q('[data-med-take="3"]'), 'Scrolls the new control into view');

  h.q('[data-act="voice"]').focus();
  h.key('d'); assertFocus(h, '[data-act="eye"]');
  h.key('ArrowRight'); assertFocus(h, '[data-act="notes"]');
  h.key('a'); assertFocus(h, '[data-act="eye"]');

  h.q('.nav [data-go="today"]').focus();
  h.key('ArrowRight'); assertFocus(h, '[data-med-take="2"]', 'Menu -> nearest page control');
  h.key('ArrowLeft'); assertFocus(h, '.nav [data-go="medications"]', 'Back to the closest menu item');
  h.key('ArrowUp'); assertFocus(h, '.nav [data-go="today"]');
});

test('with no control further down, the arrow scrolls the page instead', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  const content = h.q('.content');
  const s = scrollable(content, { top: 0, height: 2000, client: 696 });
  h.q('[data-med-take="3"]').focus();
  h.key('ArrowDown');
  assertFocus(h, '[data-med-take="3"]', 'Focus stays');
  const last = h.scrolls.at(-1);
  assert.equal(last.el, content); assert.ok(last.by.top > 0, 'Scrolled down');
  s.top = 2000 - 696;
  const count = h.scrolls.length;
  h.key('ArrowDown'); assert.equal(h.scrolls.length, count, 'No scrolling past the bottom');
});

test('a focused message thread scrolls before focus leaves it', t => {
  const h = setup(t); h.layout(SHELL); h.signIn(); h.go('messages');
  const thread = h.q('#thread');
  const s = scrollable(thread, { top: 300, height: 1000, client: 400 });
  thread.focus();
  h.key('ArrowUp');
  assertFocus(h, '#thread'); assert.equal(h.scrolls.at(-1).el, thread); assert.ok(h.scrolls.at(-1).by.top < 0);
  s.top = 0;
  h.key('ArrowUp'); assertFocus(h, '[data-call]', 'Leaves once at the top');
});

test('in text fields WASD types and arrows leave only from the edge', t => {
  const h = setup(t); h.layout(SIGNIN); h.go('signin');
  assertFocus(h, '#si-email');
  assert.equal(h.key('w'), false, 'W is typed, not used to navigate'); assertFocus(h, '#si-email');
  assert.equal(h.key('ArrowLeft'), false, 'Left/right move the caret'); assertFocus(h, '#si-email');
  h.key('ArrowDown'); assertFocus(h, '#si-pass', 'Up/down leave a single-line field');
  const pass = h.q('#si-pass');
  pass.setSelectionRange(3, 3);
  assert.equal(h.key('ArrowRight'), false, 'Caret mid-text: stays');
  pass.setSelectionRange(pass.value.length, pass.value.length);
  assert.equal(h.key('ArrowRight'), true, 'Caret at the end: arrow navigates');
  h.key('ArrowDown'); assertFocus(h, '#signin-form [type="submit"]');
  h.key('ArrowUp'); h.key('ArrowUp'); assertFocus(h, '#si-email');
});

test('textareas and suggestion lists keep their arrow keys', t => {
  const h = setup(t); h.layout(SHELL); h.signIn(); h.go('symptoms');
  h.click('[data-act="log-symptom"]');
  assertFocus(h, '#sym-name');
  assert.equal(h.key('ArrowDown'), false, 'Down opens the symptom suggestions');
  const note = h.q('#sym-note');
  note.focus(); note.value = 'ab\ncd';
  note.setSelectionRange(3, 3);
  assert.equal(h.key('ArrowUp'), false); assert.equal(h.key('ArrowDown'), false);
  note.setSelectionRange(5, 5);
  assert.equal(h.key('ArrowDown'), true); assert.notEqual(h.focused(), note);
  assert.ok(h.q('#modal-root').contains(h.focused()), 'Still inside the dialog');
  note.focus(); note.setSelectionRange(0, 0);
  h.key('ArrowUp'); assertFocus(h, '#sym-name');
});

test('dialogs keep focus inside them and Esc returns it to the opener', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  h.q('[data-act="sos"]').focus();
  h.click('[data-act="sos"]');
  assertFocus(h, '[data-act="sos-confirm"]', 'Emergency dialog starts on Send');
  h.key('Tab'); assertFocus(h, '.modal [data-close]');
  h.key('Tab'); assertFocus(h, '[data-act="sos-confirm"]', 'Tab wraps');
  h.key('Tab', { shiftKey: true }); assertFocus(h, '.modal [data-close]');
  h.key('ArrowRight'); assertFocus(h, '[data-act="sos-confirm"]');
  h.key('ArrowUp'); assertFocus(h, '[data-act="sos-confirm"]', 'Arrows cannot reach the page behind');
  h.key('Escape');
  assert.equal(h.q('#modal-root').innerHTML, ''); assertFocus(h, '[data-act="sos"]', 'Back on the opener');
});

test('focus survives re-renders and is restored if it falls to the page', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  h.q('[data-act="eye"]').focus();
  h.read('render()'); assertFocus(h, '[data-act="eye"]', 'Same control after a re-render');
  h.ctrl('l'); assertFocus(h, '[data-act="eye"]', 'Same control after switching theme');
  h.w.document.hasFocus = () => true;
  h.focused().blur(); assert.equal(h.focused(), h.w.document.body);
  h.tick(0); assertFocus(h, '[data-act="eye"]', 'Clicking empty space does not lose the indicator');
});

// ---------- Mouse ----------

test('the mouse moves focus; whichever input was used last wins', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  const voice = h.q('[data-act="voice"]');
  h.pointer('mousemove', 1180, 36, voice); assertFocus(h, '[data-act="voice"]', 'Hover moves focus');
  h.key('ArrowRight'); assertFocus(h, '[data-act="eye"]', 'Keys override the resting mouse');
  h.pointer('mousemove', 1180, 36, h.q('[data-act="voice"]'));
  assertFocus(h, '[data-act="eye"]', 'A mousemove without movement (scroll, re-render) does not steal focus');
  h.pointer('mousemove', 1182, 36, h.q('[data-act="voice"]')); assertFocus(h, '[data-act="voice"]', 'Real movement wins again');
  h.pointer('mousemove', 800, 200, h.q('.content')); assertFocus(h, '[data-act="voice"]', 'Hovering empty space keeps focus');
});

test('hovering does not pull focus out of a field being typed in', t => {
  const h = setup(t); h.layout(SHELL); h.signIn(); h.go('messages');
  h.q('#msg-input').focus();
  h.key('h');
  h.pointer('mousemove', 760, 620, h.q('[data-quick="Thank you"]'));
  assertFocus(h, '#msg-input', 'Still typing');
  h.tick(1600);
  h.pointer('mousemove', 765, 620, h.q('[data-quick="Thank you"]'));
  assertFocus(h, '[data-quick="Thank you"]', 'Free to move after a pause');
});

test('mouse lock-on snaps to the nearest control and a click in empty space presses it', t => {
  const h = setup(t); h.layout(SHELL); h.signIn();
  assert.equal(h.ctrl('o'), true);
  assert.ok(h.w.document.documentElement.classList.contains('mouse-lock'));
  assert.equal(h.w.localStorage.getItem('cc.mouseLock'), 'true');
  const topbar = h.q('.topbar');
  h.pointer('mousemove', 1050, 36, topbar); assertFocus(h, '[data-act="voice"]', 'Snaps to a control 110px away');
  h.pointer('click', 1050, 36, topbar); assert.equal(h.read('state.voice'), true, 'Click in empty space pressed it');
  h.pointer('click', 900, 150, h.q('.content')); assert.equal(h.read('state.voice'), true, 'Nothing within reach: nothing pressed');
  h.ctrl('o'); assert.equal(h.w.document.documentElement.classList.contains('mouse-lock'), false);
  h.pointer('click', 1050, 36, topbar); assert.equal(h.read('state.voice'), true, 'Off: empty clicks do nothing');
});

// ---------- Ctrl shortcuts ----------

test('Ctrl L / \\ / I / O switch theme, voice, eye tracking and mouse lock-on', t => {
  const h = setup(t);
  assert.equal(h.ctrl('l'), true); assert.equal(h.read('state.theme'), 'light');
  assert.equal(h.w.localStorage.getItem('cc.theme'), '"light"');
  h.ctrl('\\', { code: 'Backslash' }); assert.equal(h.read('state.voice'), true); assert.match(h.toastText(), /Voice commands on/);
  h.ctrl('i'); assert.equal(h.read('state.eyeTracking'), true); assert.equal(h.w.localStorage.getItem('cc.eyeTracking'), 'true');
  assert.match(h.toastText(), /Eye tracking on/);
  h.ctrl('o'); assert.equal(h.read('state.mouseLock'), true);
  h.signIn();
  assert.equal(h.q('[data-act="voice"]').getAttribute('aria-pressed'), 'true');
  assert.equal(h.q('[data-act="eye"]').getAttribute('aria-pressed'), 'true');
  h.ctrl('l'); h.ctrl('\\', { code: 'Backslash' }); h.ctrl('i'); h.ctrl('o');
  assert.equal(h.read('state.theme'), 'dark'); assert.equal(h.read('state.voice'), false);
  assert.equal(h.read('state.eyeTracking'), false); assert.equal(h.read('state.mouseLock'), false);
  assert.equal(h.q('[data-act="eye"]').getAttribute('aria-pressed'), 'false');
});

test('Ctrl S opens the emergency dialog only when signed in', t => {
  const h = setup(t);
  assert.equal(h.ctrl('s'), true, 'Swallowed so nothing else reacts');
  assert.equal(h.q('#modal-root').innerHTML, '', 'No emergency dialog before sign-in');
  h.signIn();
  h.ctrl('s');
  assert.equal(h.q('[role="alertdialog"] h2').textContent, 'Send emergency alert?');
  h.ctrl('s'); assert.equal(h.w.document.querySelectorAll('[role="alertdialog"]').length, 1, 'Never stacks');
  h.key('Escape');
  h.click('[data-chat="AJ"]'); h.click('[data-call="AJ"]');
  h.ctrl('s'); assert.ok(h.q('[role="alertdialog"]'), 'Works during a call');
});

test('Ctrl F and Ctrl N toggle biometric unlock and notifications (undoable)', t => {
  const h = setup(t);
  h.ctrl('f'); h.ctrl('n');
  assert.equal(h.read('state.biometric'), true); assert.equal(h.read('state.notifications'), true, 'Not before sign-in');
  h.signIn();
  h.ctrl('f'); assert.equal(h.read('state.biometric'), false);
  assert.match(h.toastText(), /Biometric unlock turned off/); assert.ok(h.q('.toast-undo'));
  h.ctrl('n'); assert.equal(h.read('state.notifications'), false);
  assert.equal(h.w.localStorage.getItem('cc.notifications'), 'false');
  assert.match(h.q('[data-act="notes"]').title, /\(off\)/);
  h.click('[data-act="notes"]'); assert.match(h.q('.popover').textContent, /Notifications are turned off/);
  h.click('[data-act="toggle-notifications"]'); assert.equal(h.read('state.notifications'), true);
  h.go('account');
  assert.match(h.q('#app').textContent, /Biometric unlock\s*Disabled/);
});

test('Ctrl R refreshes the page in place without signing out', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-take="2"]'); h.ctrl('h');
  assert.equal(h.ctrl('r'), true, 'Blocks the hard reload');
  assert.equal(h.read('state.screen'), 'today'); assert.equal(h.read('state.panel'), null);
  assert.equal(h.read('actionLog.length'), 1, 'Nothing lost'); assert.match(h.toastText(), /Page refreshed/);
  h.read('signOut()'); h.ctrl('r'); assert.equal(h.read('state.screen'), 'landing');
});

test('held-down shortcuts fire once and dialogs block most shortcuts', t => {
  const h = setup(t); h.signIn();
  assert.equal(h.ctrl('l', { repeat: true }), true); assert.equal(h.read('state.theme'), 'dark', 'Key repeat ignored');
  h.ctrl('s');
  h.ctrl('f'); h.ctrl('n'); h.ctrl('r'); h.ctrl('u');
  assert.equal(h.read('state.biometric'), true); assert.equal(h.read('state.notifications'), true);
  assert.ok(h.q('[role="alertdialog"]'), 'Still open');
  h.ctrl('l'); assert.equal(h.read('state.theme'), 'light', 'Display shortcuts still work in a dialog');
  h.ctrl('i'); assert.equal(h.read('state.eyeTracking'), true);
});

test('other Ctrl, Alt and Meta combos are left alone', t => {
  const h = setup(t);
  for (const k of ['c', 'v', 'x', 'a', 'z']) assert.equal(h.ctrl(k), false, `Ctrl+${k} still works for editing`);
  assert.equal(h.ctrl('l', { altKey: true }), false, 'AltGr (Ctrl+Alt) is not a shortcut');
  assert.equal(h.key('l', { metaKey: true }), false);
  assert.equal(h.key('ArrowDown', { altKey: true }), false);
  assert.equal(h.read('state.theme'), 'dark');
});

test('Enter is left to the browser so the focused control activates natively', t => {
  const h = setup(t); h.layout(LANDING); h.read('render({ fresh: true })');
  assert.equal(h.key('Enter'), false, 'Enter on a button is not intercepted');
  h.go('signin');
  assert.equal(h.key('Enter'), false, 'Enter in a sign-in field submits the form natively');
  h.key(' ');
});

test('top bar buttons advertise their shortcuts; Account lists every shortcut', t => {
  const h = setup(t); h.signIn();
  assert.match(h.q('[data-act="voice"]').title, /Ctrl\+\\/);
  assert.match(h.q('[data-act="eye"]').title, /Ctrl\+I/);
  assert.match(h.q('[data-act="notes"]').title, /Ctrl\+N/);
  assert.match(h.q('[data-act="sos"]').title, /Ctrl\+S/);
  h.go('account');
  const rows = [...h.w.document.querySelectorAll('.sc-row')].map(r => r.textContent.replace(/\s+/g, ''));
  for (const expected of ['Zoomin', 'Zoomout', 'Resetzoom', 'Switchlight/darkmode', 'Voicecommands', 'Eyetracking', 'Mouselock-on',
    'Undothelastaction', 'Openactionhistory', 'Emergencycall(SOS)', 'Biometricunlockon/off', 'Refreshpage', 'Notificationson/off']) {
    assert.ok(rows.some(r => r.includes(expected)), `Shortcut list includes ${expected}`);
  }
  for (const act of ['voice', 'eye', 'mouse-lock']) h.click(`.list [data-act="${act}"]`);
  assert.equal(h.read('state.voice && state.eyeTracking && state.mouseLock'), true, 'Each mode can also be switched with the mouse');
});
