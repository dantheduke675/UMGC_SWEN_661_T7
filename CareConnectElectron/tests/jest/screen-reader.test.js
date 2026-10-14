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
  expect(h.q('#si-email').getAttribute('aria-describedby')).toBe('si-email-hint si-err');
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
  expect(accName(tabs[0])).toBe('Mon 28, 1 scheduled');
  expect(accName(tabs[3])).toBe('Thu 1');
  const panel = h.q('[role="tabpanel"]');
  expect(panel.getAttribute('aria-labelledby')).toBe('day-tab-0');
  expect(tabs.every(tab => tab.getAttribute('aria-controls') === panel.id)).toBeTruthy();
  h.click('[data-day="2"]');
  expect(h.q('[role="tabpanel"]').getAttribute('aria-labelledby')).toBe('day-tab-2');
  expect(h.q('#day-tab-2').getAttribute('aria-selected')).toBe('true');
});

test('messages: unread state, the open conversation and the thread are announced', () => {
  const h = setupApp(); h.signIn();
  expect(accName(h.q('.nav [data-go="messages"]'))).toBe('Messages, 1 unread');
  expect(h.q('.nav [data-go="messages"] .label').textContent).toBe('Messages (1)');
  h.go('messages');
  h.read('state.convos[1].unread = true; render()');
  const sc = h.q('[data-convo="SC"]');
  expect(accName(sc)).toBe('Unread, Dr. Sarah Chen, Monday, Physician: Thank you, Dr. Chen.');
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

// NVDA heard none of the toasts while the live region sat inside the toast:
// the toast is visibility:hidden between messages, and text added to a hidden
// region is not announced. The region now lives outside it, always rendered.
test('toast messages are read from one always-rendered live region, with an undo hint', () => {
  const h = setupApp();
  const live = h.q('#sr-status');
  expect(live.getAttribute('role')).toBe('status'); expect(live.getAttribute('aria-live')).toBe('polite');
  expect(live.classList.contains('sr-only')).toBeTruthy();
  expect(h.q('#toast').contains(live)).toBe(false);
  h.signIn(); h.click('[data-med-take="2"]');
  expect(live.textContent).toBe('');
  h.tick(250);
  expect(h.q('#sr-status')).toBe(live);
  expect(live.textContent).toBe('Marked as taken. Press Control U to undo.');
  expect(h.q('.toast-msg').textContent).toBe('Marked as taken');
  expect(h.q('.toast-msg').getAttribute('aria-hidden')).toBe('true');
  expect(accName(h.q('.toast-undo'))).toBe('Undo');
  expect(h.q('.toast-undo').getAttribute('aria-describedby')).toBe('toast-msg');
  h.click('.toast-undo'); h.tick(250);
  expect(live.textContent).toMatch(/^Undone: Marked Ropivacaine \(8:00 PM\) as taken$/);
});

test('the same message twice is announced twice', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]'); h.tick(250);
  h.click('[data-med-take="3"]');
  expect(h.q('#sr-status').textContent).toBe('');
  h.tick(250);
  expect(h.q('#sr-status').textContent).toBe('Marked as taken. Press Control U to undo.');
});

test('announcements are cleared once read, so they are not re-read later', () => {
  const h = setupApp(); h.signIn(); h.go('medications');
  h.click('[data-med-take="2"]'); h.tick(250);
  expect(h.q('#sr-status').textContent).not.toBe(''); expect(h.q('#sr-page').textContent).toBe('Medications page');
  h.tick(5000);
  expect(h.q('#sr-status').textContent).toBe('');
  expect(h.q('#sr-page').textContent).toBe('');
});

// ---------- Fixes from the NVDA pass ----------

test('every screen has one level-1 heading and a main landmark', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    if (/panel|dialog/.test(view)) continue;
    const d = h.w.document;
    expect(d.querySelectorAll('#app h1').length).toBe(1);
    expect(d.querySelectorAll('#app main').length).toBe(1);
  }
});

test('medication buttons name the dose they act on', () => {
  const h = setupApp(); h.signIn();
  expect(accName(h.q('[data-med-take="2"]'))).toBe('I took this: Ropivacaine 10 mg, 8:00 PM');
  expect(accName(h.q('[data-med-miss="3"]'))).toBe('I missed this: Loratadip / Carbiopa 25 mg / 100 mg, 7:00 AM');
  const names = [...h.w.document.querySelectorAll('[data-med-take]')].map(accName);
  expect(new Set(names).size).toBe(names.length);
  expect(h.q('.status-bar.taken span').getAttribute('aria-hidden')).toBe('true');
});

test('medications are lists with a heading per medication', () => {
  const h = setupApp(); h.signIn();
  expect(h.q('[aria-labelledby="today-meds-title"]').getAttribute('role')).toBe('list');
  expect(h.w.document.querySelectorAll('[aria-labelledby="today-meds-title"] > [role="listitem"]').length).toBe(9);
  expect(h.q('.med-name').getAttribute('role')).toBe('heading'); expect(h.q('.med-name').getAttribute('aria-level')).toBe('4');
  h.go('medications');
  expect(h.q('.med-grid').getAttribute('role')).toBe('list');
  expect(h.q('.med-name').getAttribute('aria-level')).toBe('2');
  expect(h.q('.stats').getAttribute('role')).toBe('list');
});

test('focusable cards are not read twice', () => {
  const h = setupApp(); h.signIn();
  const visibleToReader = el => textOf(el);
  expect(visibleToReader(h.q('.card.tip'))).toBe('');
  h.go('symptoms');
  expect(visibleToReader(h.q('.sym'))).toBe('');
  expect(h.q('.logs-title').tagName).toBe('H3');
  h.go('schedule');
  expect(visibleToReader(h.q('.appt-card'))).toBe('');
});

test('the unread count survives a collapsed sidebar, and tooltips do not repeat names', () => {
  const h = setupApp(); h.signIn();
  expect(h.q('.nav [data-go="today"]').hasAttribute('title')).toBe(false);
  h.click('[data-act="collapse"]');
  expect(h.q('.nav [data-go="today"]').getAttribute('title')).toBe('Today');
  expect(accName(h.q('.nav [data-go="messages"]'))).toBe('Messages, 1 unread');
  expect(h.q('.sidebar .avatar').getAttribute('aria-hidden')).toBe('true');
});

test('account toggles are switches that report on or off', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  for (const act of ['toggle-notifications', 'reminders', 'biometric', 'share', 'voice', 'eye', 'mouse-lock']) {
    const row = h.q(`.row[data-act="${act}"]`);
    expect(row.getAttribute('role')).toBe('switch');
    expect(['true', 'false'].includes(row.getAttribute('aria-checked'))).toBeTruthy();
  }
  expect(accName(h.q('[data-act="reminders"]'))).toBe('Medication reminders');
  expect(h.q('[data-act="reminders"]').getAttribute('aria-checked')).toBe('true');
  h.click('[data-act="reminders"]');
  expect(h.q('[data-act="reminders"]').getAttribute('aria-checked')).toBe('false');
  expect(h.q('[data-act="biometric"]').getAttribute('aria-keyshortcuts')).toBe('Control+F');
  expect(h.q('[data-act="privacy"]').hasAttribute('role')).toBe(false);
});

test('keyboard shortcuts are spelled out for screen readers', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  const spoken = [...h.w.document.querySelectorAll('.shortcuts .sr-only')].map(s => s.textContent);
  expect(spoken[0]).toBe(': arrow keys or W A S D.');
  expect(spoken.includes(': Control+Plus.')).toBeTruthy(); expect(spoken.includes(': Control+Backslash.')).toBeTruthy(); expect(spoken.includes(': Escape.')).toBeTruthy();
  expect(h.q('.shortcuts .kbds').getAttribute('aria-hidden')).toBe('true');
});

test('messages say who sent each one, and what the reply controls do', () => {
  const h = setupApp(); h.signIn(); h.go('messages');
  const bubbles = [...h.w.document.querySelectorAll('#thread .bubble')].map(textOf);
  expect(bubbles[0]).toBe('Aunt Joyce: Hi Maddy, did you take your morning medications?');
  expect(bubbles[1]).toBe('You: Yes, I finished them with breakfast.');
  expect(accName(h.q('[data-call="AJ"]'))).toBe('Call Aunt Joyce');
  expect(accName(h.q('.quick'))).toBe('Quick replies, each one sends right away');
  expect(accName(h.q('#msg-input'))).toBe('Message to Aunt Joyce');
  expect(accName(h.q('.send'))).toBe('Send message');
});

test('call buttons keep their label and report state as pressed', () => {
  const h = setupApp(); h.go('messages'); h.click('[data-call="AJ"]');
  expect(accName(h.q('.call .back'))).toBe('End call and go back');
  const mute = () => h.q('[data-act="mute"]'), speaker = () => h.q('[data-act="speaker"]');
  expect(accName(mute())).toBe('Mute'); expect(mute().getAttribute('aria-pressed')).toBe('false');
  expect(accName(speaker())).toBe('Speaker'); expect(speaker().getAttribute('aria-pressed')).toBe('false');
  h.click('[data-act="mute"]'); h.click('[data-act="speaker"]');
  expect(accName(mute())).toBe('Mute'); expect(mute().getAttribute('aria-pressed')).toBe('true');
  expect(accName(speaker())).toBe('Speaker'); expect(speaker().getAttribute('aria-pressed')).toBe('true');
  expect(h.q('.call .big-av').getAttribute('aria-hidden')).toBe('true');
});

test('the page behind a dialog is inert until it closes', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-act="sos"]');
  expect(h.q('#app').hasAttribute('inert')).toBeTruthy(); expect(h.q('#toast').hasAttribute('inert')).toBeTruthy();
  expect(h.q('[role="alertdialog"]').getAttribute('aria-describedby')).toBe('sos-lead');
  h.key('Escape');
  expect(h.q('#app').hasAttribute('inert')).toBe(false); expect(h.q('#toast').hasAttribute('inert')).toBe(false);
  h.go('symptoms'); h.click('[data-act="log-symptom"]');
  expect(h.q('#app').hasAttribute('inert')).toBeTruthy();
  h.click('[data-close].btn');
  expect(h.q('#app').hasAttribute('inert')).toBe(false);
});

test('form hints are read with their fields, and arrows on links are not', () => {
  const h = setupApp(); h.go('signin');
  expect(h.q('#si-email').getAttribute('aria-describedby')).toBe('si-email-hint');
  expect(h.q('#si-email-hint').textContent).toBe('We will never share this.');
  expect(accName(h.q('[data-go="facescan"]'))).toBe('Use Face ID instead');
  expect(accName(h.q('[data-act="back"]'))).toBe('Back');
  h.input('#si-email', 'bad'); h.submit('#signin-form');
  h.input('#si-email', 'maddy@example.com'); h.input('#si-pass', ''); h.submit('#signin-form');
  expect(h.q('#si-email').getAttribute('aria-describedby')).toBe('si-email-hint');
  expect(h.q('#si-pass').getAttribute('aria-describedby')).toBe('si-pass-hint si-err');
  h.go('create');
  expect(h.q('#ca-pass').getAttribute('aria-describedby')).toBe('ca-pass-hint');
  expect(h.q('#ca-pass').hasAttribute('placeholder')).toBe(false);
});

test('top bar buttons say they open a panel, and what they are when off', () => {
  const h = setupApp(); h.signIn();
  expect(h.q('[data-act="notes"]').getAttribute('aria-haspopup')).toBe('dialog');
  expect(accName(h.q('.sos'))).toBe('SOS, send emergency alert');
  h.ctrl('n');
  expect(accName(h.q('[data-act="notes"]'))).toBe('Notifications, turned off');
  h.ctrl('n'); h.click('[data-act="notes"]');
  expect(h.q('.popover [role="list"]').getAttribute('aria-label')).toBe('3 notifications');
  expect(h.w.document.querySelectorAll('.popover [role="listitem"]').length).toBe(3);
});

// ---------- Structure, labels and state ----------

test('every screen has exactly one top-level heading', () => {
  const h = setupApp();
  for (const view of ['landing', 'signin', 'create', 'biometrics', 'facescan', 'facesuccess']) {
    h.read(`state.screen = ${JSON.stringify(view)}; render({ fresh: true })`);
    expect(h.w.document.querySelectorAll('h1').length).toBe(1);
  }
  h.signIn();
  for (const view of ['today', 'medications', 'messages', 'schedule', 'symptoms', 'account']) {
    h.go(view); expect(h.w.document.querySelectorAll('h1').length).toBe(1);
  }
  h.go('messages'); h.click('[data-call="AJ"]');
  expect(h.q('h1').textContent).toBe('Aunt Joyce');
});

test('repeated buttons say what they act on', () => {
  const h = setupApp(); h.signIn();
  expect(h.q('[data-med-take="2"]').getAttribute('aria-label')).toBe('I took this: Ropivacaine 10 mg, 8:00 PM');
  expect(h.q('[data-med-miss="3"]').getAttribute('aria-label')).toBe('I missed this: Loratadip / Carbiopa 25 mg / 100 mg, 7:00 AM');
  h.go('messages');
  expect(h.q('[data-call="AJ"]').getAttribute('aria-label')).toBe('Call Aunt Joyce');
  expect(h.q('#msg-input').getAttribute('aria-label')).toBe('Message to Aunt Joyce');
  expect(h.q('.quick').getAttribute('aria-label')).toBe('Quick replies, each one sends right away');
  const said = [...h.w.document.querySelectorAll('.bubble .sr-only')].map(s => s.textContent);
  expect(said).toEqual(['Aunt Joyce: ', 'You: ', 'Aunt Joyce: ']);
  h.go('schedule'); expect(h.q('[role="tablist"]').getAttribute('aria-label')).toBe('Days this week');
});

test('avatars are hidden; the name next to them is read instead', () => {
  const h = setupApp(); h.signIn();
  for (const view of ['today', 'messages', 'account']) {
    h.go(view);
    for (const av of h.w.document.querySelectorAll('.avatar')) expect(av.getAttribute('aria-hidden')).toBe('true');
  }
});

test('sidebar toggle reports expanded / collapsed; collapsed links keep their names', () => {
  const h = setupApp(); h.signIn();
  const btn = () => h.q('[data-act="collapse"]');
  expect(btn().getAttribute('aria-expanded')).toBe('true');
  expect(btn().getAttribute('aria-controls')).toBe('sidebar');
  h.click('[data-act="collapse"]');
  expect(btn().getAttribute('aria-expanded')).toBe('false');
  expect(h.q('.nav [data-go="medications"] .label').textContent).toBe('Medications');
  expect(h.q('nav').getAttribute('aria-label')).toBe('Main');
});

test('Account on/off rows are switches; shortcuts are exposed with aria-keyshortcuts', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  const row = act => h.q(`.list [data-act="${act}"]`);
  for (const act of ['toggle-notifications', 'reminders', 'biometric', 'share', 'voice', 'eye', 'mouse-lock']) {
    expect(row(act).getAttribute('role')).toBe('switch');
  }
  expect(row('biometric').getAttribute('aria-checked')).toBe('true');
  h.click('.list [data-act="biometric"]');
  expect(row('biometric').getAttribute('aria-checked')).toBe('false');
  expect(row('biometric').getAttribute('aria-keyshortcuts')).toBe('Control+F');
  expect(row('biometric').querySelector('.kbds').getAttribute('aria-hidden')).toBe('true');
  expect(row('privacy').hasAttribute('role')).toBe(false);
  expect(h.q('.theme-switch').getAttribute('aria-keyshortcuts')).toBe('Control+L');
  expect(h.q('.topbar [data-act="sos"]').getAttribute('aria-keyshortcuts')).toBe('Control+S');
});

test('call toggles keep one label and report their state with aria-pressed', () => {
  const h = setupApp(); h.signIn(); h.go('messages'); h.click('[data-call="AJ"]');
  h.click('[data-act="mute"]');
  expect(h.q('[data-act="mute"]').textContent).toMatch(/^\s*Mute\s*$/);
  expect(h.q('[data-act="mute"]').getAttribute('aria-pressed')).toBe('true');
  h.click('[data-act="speaker"]');
  expect(h.q('[data-act="speaker"]').textContent).toMatch(/^\s*Speaker\s*$/);
  expect(h.q('.call .back').getAttribute('aria-label')).toBe('End call and go back');
});

test('the page behind a dialog is inert until the dialog closes', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-act="sos"]');
  expect(h.q('#app').hasAttribute('inert')).toBe(true);
  expect(h.q('#toast').hasAttribute('inert')).toBe(true);
  h.key('Escape');
  expect(h.q('#app').hasAttribute('inert')).toBe(false);
  h.go('symptoms'); h.click('[data-act="log-symptom"]');
  expect(h.q('#app').hasAttribute('inert')).toBe(true);
  expect(h.q('#sym-form').noValidate).toBe(true);
  h.input('#sym-name', 'Cough'); h.submit('#sym-form');
  expect(h.q('#app').hasAttribute('inert')).toBe(false);
});

test('form fields are marked required and described by their hints', () => {
  const h = setupApp(); h.go('signin');
  expect(h.q('#si-email').getAttribute('aria-required')).toBe('true');
  expect(h.q('#si-email').getAttribute('aria-describedby')).toBe('si-email-hint');
  h.input('#si-email', 'bad'); h.submit('#signin-form');
  h.input('#si-email', 'maddy@example.com'); h.input('#si-pass', ''); h.submit('#signin-form');
  expect(h.q('#si-email').getAttribute('aria-describedby')).toBe('si-email-hint');
  h.go('create');
  expect(h.q('#ca-pass').getAttribute('aria-describedby')).toBe('ca-pass-hint');
});

// ---------- Colour contrast (WCAG 2.1 AA) ----------

const CSS = require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../../src/styles.css'), 'utf8');
function tokens(selector) {
  const block = CSS.slice(CSS.indexOf(selector + ' {')).match(/\{([^}]*)\}/)[1];
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1], m[2]]));
}
const THEMES = { light: tokens('[data-theme="light"]'), dark: tokens('[data-theme="dark"]') };
function contrast(a, b) {
  const lum = hex => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('text colours meet 4.5:1 on every surface they are used on, in both themes', () => {
  const TEXT = [
    ['text', 'bg'], ['text', 'surface'], ['text', 'surface-2'],
    ['text-2', 'bg'], ['text-2', 'surface'], ['text-2', 'surface-2'], ['text-2', 'sidebar'], ['text-2', 'input'],
    ['text-3', 'bg'], ['text-3', 'surface'], ['text-3', 'surface-2'], ['text-3', 'input'],
    ['primary-soft-text', 'primary-soft'], ['primary-soft-text', 'bg'], ['primary-soft-text', 'surface'],
    ['on-primary', 'primary'], ['on-primary', 'primary-hover'], ['on-primary', 'danger-fill'],
    ['danger', 'bg'], ['danger', 'surface'], ['danger', 'sidebar'], ['danger', 'danger-soft'],
    ['warn', 'warn-soft'], ['success', 'success-soft'], ['indigo-text', 'indigo-soft'], ['on-primary', 'indigo']
  ];
  for (const [theme, c] of Object.entries(THEMES)) {
    for (const [fg, bg] of TEXT) {
      const r = contrast(c[fg], c[bg]);
      expect(r >= 4.5).toBeTruthy();
    }
  }
});

test('field edges, switches and the focus ring meet 3:1 in both themes', () => {
  for (const [theme, c] of Object.entries(THEMES)) {
    for (const bg of ['bg', 'surface', 'sidebar']) {
      const r = contrast(c['control-border'], c[bg]);
      expect(r >= 3).toBeTruthy();
    }
    expect(contrast(c.focus, c.bg) >= 3).toBeTruthy();
  }
});
