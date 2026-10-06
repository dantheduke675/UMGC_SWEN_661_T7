// Jest port of tests/screen-reader.test.cjs (the node:test original is kept and still runs with npm test)
const { setupApp } = require('./jest-harness');

// What a screen reader would announce for an element: a simplified version of
// the browser's accessible-name rules (aria-labelledby, aria-label, <label>,
// then visible text without aria-hidden parts, then title).
function textOf(node) {
  if (!node) return '';
  const copy = node.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"], svg').forEach(n => n.remove());
  return copy.textContent.replace(/\s+/g, ' ').trim();
}
function accName(el) {
  const doc = el.ownerDocument;
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) return labelledBy.split(/\s+/).map(id => textOf(doc.getElementById(id))).join(' ').trim();
  const label = (el.getAttribute('aria-label') || '').trim();
  if (label) return label;
  if (el.id) { const l = doc.querySelector(`label[for="${el.id}"]`); if (l) return textOf(l); }
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return (el.getAttribute('title') || '').trim();
  return textOf(el) || (el.getAttribute('title') || '').trim();
}

const FOCUSABLE = 'button, input:not([type="hidden"]), textarea, select, a[href], [tabindex]:not([tabindex="-1"])';
const NATIVE = /^(BUTTON|INPUT|TEXTAREA|SELECT|A)$/;

// Every screen, dialog and panel a user can reach
function* everyView(h) {
  for (const screen of ['landing', 'signin', 'create', 'biometrics', 'facescan', 'facesuccess']) { h.read(`state.screen = ${JSON.stringify(screen)}; render({ fresh: true })`); yield screen; }
  h.signIn();
  for (const screen of ['today', 'medications', 'messages', 'schedule', 'symptoms', 'account']) { h.go(screen); yield screen; }
  h.go('today'); h.click('[data-med-take="2"]'); yield 'today + undo toast';
  h.click('[data-act="history"]'); yield 'history panel';
  h.click('[data-act="notes"]'); yield 'notifications panel';
  h.read('toggleNotifications()'); h.click('[data-act="notes"]'); yield 'notifications off panel';
  h.read('closePanel()');
  h.click('[data-act="sos"]'); yield 'SOS dialog'; h.key('Escape');
  h.go('symptoms'); h.click('[data-act="log-symptom"]'); yield 'symptom dialog'; h.key('Escape');
  h.go('schedule'); h.click('[data-day="3"]'); yield 'empty day';
  h.go('messages'); h.click('[data-call="AJ"]'); yield 'call';
}

test('every control on every screen has a name and a role', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll(FOCUSABLE)) {
      const where = `${view}: ${el.outerHTML.slice(0, 90)}`;
      expect(accName(el)).toBeTruthy();
      if (!NATIVE.test(el.tagName)) expect(el.getAttribute('role')).toBeTruthy();
    }
  }
});

test('decorative emoji and icons are hidden from screen readers', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    for (const svg of h.w.document.querySelectorAll('svg')) expect(svg.getAttribute('aria-hidden')).toBe('true');
    for (const emoji of h.w.document.querySelectorAll('.emoji')) {
      const named = emoji.closest('[aria-label]');
      expect(emoji.closest('[aria-hidden="true"]') || named).toBeTruthy();
    }
  }
});

test('app screens have landmarks and a page heading', () => {
  const h = setupApp(); h.signIn();
  for (const screen of ['today', 'medications', 'messages', 'schedule', 'symptoms', 'account']) {
    h.go(screen);
    const d = h.w.document;
    expect(d.documentElement.lang).toBe('en');
    for (const tag of ['aside', 'nav', 'header', 'main']) expect(d.querySelectorAll(`#app ${tag}`).length).toBe(1);
    expect(d.querySelectorAll('#app h1').length).toBe(1);
    expect(d.querySelector('#app h1').textContent).toBe(h.read('pageName()'));
    expect(h.q('.nav [aria-current="page"]').dataset.go).toBe(screen);
  }
});

// ---------- Page changes ----------

test('moving to a page updates the window title and announces the page', () => {
  const h = setupApp();
  expect(h.w.document.title).toBe('Welcome – CareConnect');
  h.click('[data-go="signin"]');
  expect(h.w.document.title).toBe('Sign in – CareConnect'); expect(h.q('#sr-page').textContent).toBe('Sign in page');
  h.signIn(); h.go('medications');
  expect(h.w.document.title).toBe('Medications – CareConnect'); expect(h.q('#sr-page').textContent).toBe('Medications page');
  h.go('messages'); h.click('[data-call="AJ"]');
  expect(h.q('#sr-page').textContent).toBe('Call with Aunt Joyce page');
  expect(h.q('#sr-page').getAttribute('aria-live')).toBe('polite');
  expect(h.q('#sr-page').classList.contains('sr-only')).toBeTruthy();
});

test('re-rendering the same page does not re-announce it', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  h.q('#sr-page').textContent = '';
  h.click('[data-act="theme"]'); h.click('[data-act="reminders"]');
  expect(h.q('#sr-page').textContent).toBe('');
});

// ---------- Form errors ----------

test('sign-in errors are announced, mark the field and move focus to it', () => {
  const h = setupApp(); h.go('signin');
  const err = h.q('#si-err');
  expect(err.getAttribute('role')).toBe('alert');
  h.input('#si-email', 'bad'); h.submit('#signin-form');
  expect(err.hidden).toBe(false); expect(err.textContent).toMatch(/valid email/);
  expect(h.q('#si-email').getAttribute('aria-invalid')).toBe('true');
  expect(h.q('#si-email').getAttribute('aria-describedby')).toBe('si-err');
  expect(h.focused()).toBe(h.q('#si-email'));

  h.input('#si-email', 'maddy@example.com'); h.input('#si-pass', ''); h.submit('#signin-form');
  expect(h.q('#si-email').hasAttribute('aria-invalid')).toBe(false);
  expect(h.q('#si-pass').getAttribute('aria-invalid')).toBe('true');
  expect(h.focused()).toBe(h.q('#si-pass'));
});

test('create-account errors point at the field that needs fixing', () => {
  const h = setupApp(); h.go('create');
  expect(h.q('#ca-err').getAttribute('role')).toBe('alert');
  for (const [fill, field, msg] of [
    [{}, '#ca-name', /full name/],
    [{ '#ca-name': 'Sam Lee', '#ca-email': 'x' }, '#ca-email', /valid email/],
    [{ '#ca-email': 'sam@example.com', '#ca-pass': 'short' }, '#ca-pass', /8 characters/]
  ]) {
    for (const [sel, v] of Object.entries(fill)) h.input(sel, v);
    h.submit('#create-form');
    expect(h.q('#ca-err').textContent).toMatch(msg);
    expect(h.focused()).toBe(h.q(field));
    expect(h.w.document.querySelectorAll('[aria-invalid="true"]').length).toBe(1);
  }
});

test('the symptom form error is announced', () => {
  const h = setupApp(); h.signIn(); h.go('symptoms'); h.click('[data-act="log-symptom"]');
  h.submit('#sym-form');
  expect(h.q('#sym-err').getAttribute('role')).toBe('alert'); expect(h.q('#sym-err').hidden).toBe(false);
  expect(h.q('#sym-name').getAttribute('aria-invalid')).toBe('true');
});

// ---------- Controls and their states ----------

test('severity is a labelled radio group that reports the selected value', () => {
  const h = setupApp(); h.signIn(); h.go('symptoms'); h.click('[data-act="log-symptom"]');
  const group = h.q('.sev-pick');
  expect(group.getAttribute('role')).toBe('radiogroup');
  expect(accName(group)).toBe('Severity (1 = mild, 5 = severe)');
  const radios = [...group.querySelectorAll('[data-sev]')];
  expect(radios.map(r => r.getAttribute('role'))).toEqual(Array(5).fill('radio'));
  expect(radios.map(accName)).toEqual(['1 of 5, mild', '2 of 5', '3 of 5', '4 of 5', '5 of 5, severe']);
  const checked = () => radios.map(r => r.getAttribute('aria-checked'));
  expect(checked()).toEqual(['false', 'true', 'false', 'false', 'false']);
  h.click('[data-sev="4"]');
  expect(checked()).toEqual(['false', 'false', 'false', 'true', 'false']);
});

test('switches, toggle buttons and panels report their state', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  const sw = h.q('.sidebar [role="switch"]');
  expect(accName(sw)).toBe('Dark mode'); expect(sw.getAttribute('aria-checked')).toBe('true');
  h.click('.sidebar [role="switch"]'); expect(h.q('.sidebar [role="switch"]').getAttribute('aria-checked')).toBe('false');
  for (const act of ['voice', 'eye']) {
    expect(h.q(`.topbar [data-act="${act}"]`).getAttribute('aria-pressed')).toBe('false');
    h.click(`.topbar [data-act="${act}"]`);
    expect(h.q(`.topbar [data-act="${act}"]`).getAttribute('aria-pressed')).toBe('true');
  }
  expect(h.q('[data-act="notes"]').getAttribute('aria-expanded')).toBe('false');
  h.click('[data-act="notes"]');
  expect(h.q('[data-act="notes"]').getAttribute('aria-expanded')).toBe('true');
  expect(h.q('.popover').getAttribute('role')).toBe('dialog'); expect(accName(h.q('.popover'))).toBe('Notifications');
});

test('dialogs are modal and named by their heading', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-act="sos"]');
  const sos = h.q('[role="alertdialog"]');
  expect(sos.getAttribute('aria-modal')).toBe('true'); expect(accName(sos)).toBe('Send emergency alert?');
  h.key('Escape');
  h.go('symptoms'); h.click('[data-act="log-symptom"]');
  const form = h.q('[role="dialog"]');
  expect(form.getAttribute('aria-modal')).toBe('true'); expect(accName(form)).toBe('Log a symptom');
});

// ---------- Content that is only visual otherwise ----------

test('the medication progress bar says what it measures', () => {
  const h = setupApp(); h.signIn();
  const bar = () => h.q('[role="progressbar"]');
  expect(accName(bar())).toBe('Medications taken today');
  expect(bar().getAttribute('aria-valuetext')).toBe('2 of 9 taken');
  h.click('[data-med-take="2"]');
  expect(bar().getAttribute('aria-valuetext')).toBe('3 of 9 taken'); expect(bar().getAttribute('aria-valuenow')).toBe('33');
});

test('focusable cards read as named groups', () => {
  const h = setupApp(); h.signIn();
  expect(accName(h.q('.status-bar.taken'))).toBe('Ropivacaine 8:00 AM: taken');
  expect(accName(h.q('.card.tip'))).toMatch(/^Daily tip: Taking medications at the same time/);
  h.go('symptoms');
  const sym = h.q('.sym');
  expect(sym.getAttribute('role')).toBe('group');
  expect(accName(sym)).toBe('Pain, severity 2 of 5, Today · 9:10 AM. Mild knee ache after morning walk');
  expect(sym.querySelector('.bars').getAttribute('aria-hidden')).toBe('true');
  h.go('schedule');
  expect(accName(h.q('.appt-card'))).toBe('Dr. Chen — Follow-up, Dr. Sarah Chen · Physician, 2:30 PM, 45 min');
  h.go('account');
  expect(accName(h.q('.shortcuts'))).toBe('Keyboard shortcuts');
});

test('schedule days are tabs that name the date and count, controlling one panel', () => {
  const h = setupApp(); h.signIn(); h.go('schedule');
  const tabs = [...h.w.document.querySelectorAll('[role="tab"]')];
  expect(accName(tabs[0])).toBe('Monday, Sep 28, 1 scheduled');
  expect(accName(tabs[3])).toBe('Thursday, Oct 1');
  const panel = h.q('[role="tabpanel"]');
  expect(panel.getAttribute('aria-labelledby')).toBe('day-tab-0');
  expect(tabs.every(tab => tab.getAttribute('aria-controls') === panel.id)).toBeTruthy();
  h.click('[data-day="2"]');
  expect(h.q('[role="tabpanel"]').getAttribute('aria-labelledby')).toBe('day-tab-2');
  expect(h.q('#day-tab-2').getAttribute('aria-selected')).toBe('true');
});

test('messages: unread state, the open conversation and the thread are announced', () => {
  const h = setupApp(); h.signIn();
  expect(accName(h.q('.nav [data-go="messages"]'))).toBe('Messages (1 unread)');
  expect(h.q('.nav [data-go="messages"] .label').firstChild.textContent).toBe('Messages (1');
  h.go('messages');
  h.read('state.convos[1].unread = true; render()');
  const sc = h.q('[data-convo="SC"]');
  expect(accName(sc)).toBe('Dr. Sarah Chen, Physician, unread, Monday: Thank you, Dr. Chen.');
  expect(h.q('[data-convo="AJ"]').getAttribute('aria-current')).toBe('true');
  expect(sc.hasAttribute('aria-current')).toBe(false);
  expect(h.q('#thread').getAttribute('role')).toBe('log');
  expect(accName(h.q('#thread'))).toBe('Conversation with Aunt Joyce');
});

test('the history button says how many actions can be undone', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]'); h.click('[data-med-take="3"]');
  expect(accName(h.q('[data-act="history"]'))).toBe('Action history, 2 can be undone');
  h.ctrl('u'); h.ctrl('u');
  expect(accName(h.q('[data-act="history"]'))).toBe('Action history');
});

test('the call timer is exposed as a timer, not re-read every second', () => {
  const h = setupApp(); h.go('messages'); h.click('[data-call="AJ"]');
  const timer = h.q('#call-timer');
  expect(timer.getAttribute('role')).toBe('timer'); expect(accName(timer)).toBe('Call length');
  expect(timer.hasAttribute('aria-live')).toBe(false);
});

// ---------- Toasts ----------

test('toast messages are read from one persistent live region, with an undo hint', () => {
  const h = setupApp();
  const live = h.q('#toast [role="status"]');
  expect(live).toBeTruthy(); expect(live.getAttribute('aria-live')).toBe('polite');
  h.signIn(); h.click('[data-med-take="2"]');
  expect(h.q('#toast [role="status"]')).toBe(live);
  expect(textOf(live)).toBe('Marked as taken Press Control U to undo.');
  expect(h.q('.toast-msg').textContent).toBe('Marked as taken');
  h.click('.toast-undo');
  expect(h.q('#toast [role="status"]')).toBe(live);
  expect(textOf(live)).toMatch(/^Undone: Marked Ropivacaine \(8:00 PM\) as taken$/);
  expect(live.querySelector('button')).toBe(null);
});
