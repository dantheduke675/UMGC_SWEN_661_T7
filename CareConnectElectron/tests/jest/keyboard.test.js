// Jest port of tests/keyboard.test.cjs (the node:test original is kept and still runs with npm test)
const { setupApp } = require('./jest-harness');

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
// Compare readable descriptions so a failure shows which control had focus
function assertFocus(h, selector, message) {
  const expected = h.q(selector);
  expect(`${message || 'focus'}: ${desc(h.focused())}`).toBe(`${message || 'focus'}: ${expected ? desc(expected) : `<missing ${selector}>`}`);
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

test('landing starts on Sign in; arrows and WASD move between controls', () => {
  const h = setupApp(); h.layout(LANDING); h.read('render({ fresh: true })');
  assertFocus(h, '[data-go="signin"]', 'starts on a control in view');
  expect(h.key('ArrowUp')).toBe(true); assertFocus(h, '[data-go="create"]');
  h.key('w'); assertFocus(h, '.theme-fab', 'W moves up');
  h.key('s'); assertFocus(h, '[data-go="create"]', 'S moves down');
  h.key('ArrowDown'); assertFocus(h, '[data-go="signin"]');
  h.key('ArrowDown'); assertFocus(h, '[data-go="signin"]', 'Stays put when nothing is further down');
  h.key('S', { shiftKey: true }); assertFocus(h, '[data-go="signin"]', 'Shifted WASD still navigates');
});

test('a new page starts on a control that is plainly in view', () => {
  const h = setupApp(); h.layout(SHELL);
  h.signIn();
  // med 1 is taken and its status bar is not on screen in this layout
  assertFocus(h, '[data-med-take="2"]', 'first visible control in the page');
  h.go('medications'); assertFocus(h, '[data-med-take="2"]');
});

// ---------- Moving the focus indicator ----------

test('arrows move along rows, columns, the top bar and from the menu into the page', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn();
  h.key('ArrowRight'); assertFocus(h, '[data-med-miss="2"]');
  h.key('ArrowLeft'); assertFocus(h, '[data-med-take="2"]');
  h.key('ArrowDown'); assertFocus(h, '[data-med-take="3"]', 'Prefers the control lined up below');
  expect(h.scrolls.at(-1).el).toBe(h.q('[data-med-take="3"]'));

  h.q('[data-act="voice"]').focus();
  h.key('d'); assertFocus(h, '[data-act="eye"]');
  h.key('ArrowRight'); assertFocus(h, '[data-act="notes"]');
  h.key('a'); assertFocus(h, '[data-act="eye"]');

  h.q('.nav [data-go="today"]').focus();
  h.key('ArrowRight'); assertFocus(h, '[data-med-take="2"]', 'Menu -> nearest page control');
  h.key('ArrowLeft'); assertFocus(h, '.nav [data-go="medications"]', 'Back to the closest menu item');
  h.key('ArrowUp'); assertFocus(h, '.nav [data-go="today"]');
});

test('with no control further down, the arrow scrolls the page instead', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn();
  const content = h.q('.content');
  const s = scrollable(content, { top: 0, height: 2000, client: 696 });
  h.q('[data-med-take="3"]').focus();
  h.key('ArrowDown');
  assertFocus(h, '[data-med-take="3"]', 'Focus stays');
  const last = h.scrolls.at(-1);
  expect(last.el).toBe(content); expect(last.by.top > 0).toBeTruthy();
  s.top = 2000 - 696;
  const count = h.scrolls.length;
  h.key('ArrowDown'); expect(h.scrolls.length).toBe(count);
});

test('a focused message thread scrolls before focus leaves it', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn(); h.go('messages');
  const thread = h.q('#thread');
  const s = scrollable(thread, { top: 300, height: 1000, client: 400 });
  thread.focus();
  h.key('ArrowUp');
  assertFocus(h, '#thread'); expect(h.scrolls.at(-1).el).toBe(thread); expect(h.scrolls.at(-1).by.top < 0).toBeTruthy();
  s.top = 0;
  h.key('ArrowUp'); assertFocus(h, '[data-call]', 'Leaves once at the top');
});

test('in text fields WASD types and arrows leave only from the edge', () => {
  const h = setupApp(); h.layout(SIGNIN); h.go('signin');
  assertFocus(h, '#si-email');
  expect(h.key('w')).toBe(false); assertFocus(h, '#si-email');
  expect(h.key('ArrowLeft')).toBe(false); assertFocus(h, '#si-email');
  h.key('ArrowDown'); assertFocus(h, '#si-pass', 'Up/down leave a single-line field');
  const pass = h.q('#si-pass');
  pass.setSelectionRange(3, 3);
  expect(h.key('ArrowRight')).toBe(false);
  pass.setSelectionRange(pass.value.length, pass.value.length);
  expect(h.key('ArrowRight')).toBe(true);
  h.key('ArrowDown'); assertFocus(h, '#signin-form [type="submit"]');
  h.key('ArrowUp'); h.key('ArrowUp'); assertFocus(h, '#si-email');
});

test('textareas and suggestion lists keep their arrow keys', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn(); h.go('symptoms');
  h.click('[data-act="log-symptom"]');
  assertFocus(h, '#sym-name');
  expect(h.key('ArrowDown')).toBe(false);
  const note = h.q('#sym-note');
  note.focus(); note.value = 'ab\ncd';
  note.setSelectionRange(3, 3);
  expect(h.key('ArrowUp')).toBe(false); expect(h.key('ArrowDown')).toBe(false);
  note.setSelectionRange(5, 5);
  expect(h.key('ArrowDown')).toBe(true); expect(h.focused()).not.toBe(note);
  expect(h.q('#modal-root').contains(h.focused())).toBeTruthy();
  note.focus(); note.setSelectionRange(0, 0);
  h.key('ArrowUp'); assertFocus(h, '#sym-name');
});

test('dialogs keep focus inside them and Esc returns it to the opener', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn();
  h.q('[data-act="sos"]').focus();
  h.click('[data-act="sos"]');
  assertFocus(h, '[data-act="sos-confirm"]', 'Emergency dialog starts on Send');
  h.key('Tab'); assertFocus(h, '.modal [data-close]');
  h.key('Tab'); assertFocus(h, '[data-act="sos-confirm"]', 'Tab wraps');
  h.key('Tab', { shiftKey: true }); assertFocus(h, '.modal [data-close]');
  h.key('ArrowRight'); assertFocus(h, '[data-act="sos-confirm"]');
  h.key('ArrowUp'); assertFocus(h, '[data-act="sos-confirm"]', 'Arrows cannot reach the page behind');
  h.key('Escape');
  expect(h.q('#modal-root').innerHTML).toBe(''); assertFocus(h, '[data-act="sos"]', 'Back on the opener');
});

test('focus survives re-renders and is restored if it falls to the page', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn();
  h.q('[data-act="eye"]').focus();
  h.read('render()'); assertFocus(h, '[data-act="eye"]', 'Same control after a re-render');
  h.ctrl('l'); assertFocus(h, '[data-act="eye"]', 'Same control after switching theme');
  h.w.document.hasFocus = () => true;
  h.focused().blur(); expect(h.focused()).toBe(h.w.document.body);
  h.tick(0); assertFocus(h, '[data-act="eye"]', 'Clicking empty space does not lose the indicator');
});

// ---------- Mouse ----------

test('the mouse moves focus; whichever input was used last wins', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn();
  const voice = h.q('[data-act="voice"]');
  h.pointer('mousemove', 1180, 36, voice); assertFocus(h, '[data-act="voice"]', 'Hover moves focus');
  h.key('ArrowRight'); assertFocus(h, '[data-act="eye"]', 'Keys override the resting mouse');
  h.pointer('mousemove', 1180, 36, h.q('[data-act="voice"]'));
  assertFocus(h, '[data-act="eye"]', 'A mousemove without movement (scroll, re-render) does not steal focus');
  h.pointer('mousemove', 1182, 36, h.q('[data-act="voice"]')); assertFocus(h, '[data-act="voice"]', 'Real movement wins again');
  h.pointer('mousemove', 800, 200, h.q('.content')); assertFocus(h, '[data-act="voice"]', 'Hovering empty space keeps focus');
});

test('hovering does not pull focus out of a field being typed in', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn(); h.go('messages');
  h.q('#msg-input').focus();
  h.key('h');
  h.pointer('mousemove', 760, 620, h.q('[data-quick="Thank you"]'));
  assertFocus(h, '#msg-input', 'Still typing');
  h.tick(1600);
  h.pointer('mousemove', 765, 620, h.q('[data-quick="Thank you"]'));
  assertFocus(h, '[data-quick="Thank you"]', 'Free to move after a pause');
});

test('mouse lock-on snaps to the nearest control and a click in empty space presses it', () => {
  const h = setupApp(); h.layout(SHELL); h.signIn();
  expect(h.ctrl('o')).toBe(true);
  expect(h.w.document.documentElement.classList.contains('mouse-lock')).toBeTruthy();
  expect(h.w.localStorage.getItem('cc.mouseLock')).toBe('true');
  const topbar = h.q('.topbar');
  h.pointer('mousemove', 1050, 36, topbar); assertFocus(h, '[data-act="voice"]', 'Snaps to a control 110px away');
  h.pointer('click', 1050, 36, topbar); expect(h.read('state.voice')).toBe(true);
  h.pointer('click', 900, 150, h.q('.content')); expect(h.read('state.voice')).toBe(true);
  h.ctrl('o'); expect(h.w.document.documentElement.classList.contains('mouse-lock')).toBe(false);
  h.pointer('click', 1050, 36, topbar); expect(h.read('state.voice')).toBe(true);
});

// ---------- Ctrl shortcuts ----------

test('Ctrl L / \\ / I / O switch theme, voice, eye tracking and mouse lock-on', () => {
  const h = setupApp();
  expect(h.ctrl('l')).toBe(true); expect(h.read('state.theme')).toBe('light');
  expect(h.w.localStorage.getItem('cc.theme')).toBe('"light"');
  h.ctrl('\\', { code: 'Backslash' }); expect(h.read('state.voice')).toBe(true); expect(h.toastText()).toMatch(/Voice commands on/);
  h.ctrl('i'); expect(h.read('state.eyeTracking')).toBe(true); expect(h.w.localStorage.getItem('cc.eyeTracking')).toBe('true');
  expect(h.toastText()).toMatch(/Eye tracking on/);
  h.ctrl('o'); expect(h.read('state.mouseLock')).toBe(true);
  h.signIn();
  expect(h.q('[data-act="voice"]').getAttribute('aria-pressed')).toBe('true');
  expect(h.q('[data-act="eye"]').getAttribute('aria-pressed')).toBe('true');
  h.ctrl('l'); h.ctrl('\\', { code: 'Backslash' }); h.ctrl('i'); h.ctrl('o');
  expect(h.read('state.theme')).toBe('dark'); expect(h.read('state.voice')).toBe(false);
  expect(h.read('state.eyeTracking')).toBe(false); expect(h.read('state.mouseLock')).toBe(false);
  expect(h.q('[data-act="eye"]').getAttribute('aria-pressed')).toBe('false');
});

test('Ctrl S opens the emergency dialog only when signed in', () => {
  const h = setupApp();
  expect(h.ctrl('s')).toBe(true);
  expect(h.q('#modal-root').innerHTML).toBe('');
  h.signIn();
  h.ctrl('s');
  expect(h.q('[role="alertdialog"] h2').textContent).toBe('Send emergency alert?');
  h.ctrl('s'); expect(h.w.document.querySelectorAll('[role="alertdialog"]').length).toBe(1);
  h.key('Escape');
  h.click('[data-chat="AJ"]'); h.click('[data-call="AJ"]');
  h.ctrl('s'); expect(h.q('[role="alertdialog"]')).toBeTruthy();
});

test('Ctrl F and Ctrl N toggle biometric unlock and notifications (undoable)', () => {
  const h = setupApp();
  h.ctrl('f'); h.ctrl('n');
  expect(h.read('state.biometric')).toBe(true); expect(h.read('state.notifications')).toBe(true);
  h.signIn();
  h.ctrl('f'); expect(h.read('state.biometric')).toBe(false);
  expect(h.toastText()).toMatch(/Biometric unlock turned off/); expect(h.q('.toast-undo')).toBeTruthy();
  h.ctrl('n'); expect(h.read('state.notifications')).toBe(false);
  expect(h.w.localStorage.getItem('cc.notifications')).toBe('false');
  expect(h.q('[data-act="notes"]').title).toMatch(/\(off\)/);
  h.click('[data-act="notes"]'); expect(h.q('.popover').textContent).toMatch(/Notifications are turned off/);
  h.click('[data-act="toggle-notifications"]'); expect(h.read('state.notifications')).toBe(true);
  h.go('account');
  expect(h.q('#app').textContent).toMatch(/Biometric unlock\s*Disabled/);
});

test('Ctrl R refreshes the page in place without signing out', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]'); h.ctrl('h');
  expect(h.ctrl('r')).toBe(true);
  expect(h.read('state.screen')).toBe('today'); expect(h.read('state.panel')).toBe(null);
  expect(h.read('actionLog.length')).toBe(1); expect(h.toastText()).toMatch(/Page refreshed/);
  h.read('signOut()'); h.ctrl('r'); expect(h.read('state.screen')).toBe('landing');
});

test('held-down shortcuts fire once and dialogs block most shortcuts', () => {
  const h = setupApp(); h.signIn();
  expect(h.ctrl('l', { repeat: true })).toBe(true); expect(h.read('state.theme')).toBe('dark');
  h.ctrl('s');
  h.ctrl('f'); h.ctrl('n'); h.ctrl('r'); h.ctrl('u');
  expect(h.read('state.biometric')).toBe(true); expect(h.read('state.notifications')).toBe(true);
  expect(h.q('[role="alertdialog"]')).toBeTruthy();
  h.ctrl('l'); expect(h.read('state.theme')).toBe('light');
  h.ctrl('i'); expect(h.read('state.eyeTracking')).toBe(true);
});

test('other Ctrl, Alt and Meta combos are left alone', () => {
  const h = setupApp();
  for (const k of ['c', 'v', 'x', 'a', 'z']) expect(h.ctrl(k)).toBe(false);
  expect(h.ctrl('l', { altKey: true })).toBe(false);
  expect(h.key('l', { metaKey: true })).toBe(false);
  expect(h.key('ArrowDown', { altKey: true })).toBe(false);
  expect(h.read('state.theme')).toBe('dark');
});

test('Enter is left to the browser so the focused control activates natively', () => {
  const h = setupApp(); h.layout(LANDING); h.read('render({ fresh: true })');
  expect(h.key('Enter')).toBe(false);
  h.go('signin');
  expect(h.key('Enter')).toBe(false);
  h.key(' ');
});

test('top bar buttons advertise their shortcuts; Account lists every shortcut', () => {
  const h = setupApp(); h.signIn();
  expect(h.q('[data-act="voice"]').title).toMatch(/Ctrl\+\\/);
  expect(h.q('[data-act="eye"]').title).toMatch(/Ctrl\+I/);
  expect(h.q('[data-act="notes"]').title).toMatch(/Ctrl\+N/);
  expect(h.q('[data-act="sos"]').title).toMatch(/Ctrl\+S/);
  h.go('account');
  const rows = [...h.w.document.querySelectorAll('.sc-row')].map(r => r.textContent.replace(/\s+/g, ''));
  for (const expected of ['Zoomin', 'Zoomout', 'Resetzoom', 'Switchlight/darkmode', 'Voicecommands', 'Eyetracking', 'Mouselock-on',
    'Undothelastaction', 'Openactionhistory', 'Emergencycall(SOS)', 'Biometricunlockon/off', 'Refreshpage', 'Notificationson/off']) {
    expect(rows.some(r => r.includes(expected))).toBeTruthy();
  }
  for (const act of ['voice', 'eye', 'mouse-lock']) h.click(`.list [data-act="${act}"]`);
  expect(h.read('state.voice && state.eyeTracking && state.mouseLock')).toBe(true);
});
