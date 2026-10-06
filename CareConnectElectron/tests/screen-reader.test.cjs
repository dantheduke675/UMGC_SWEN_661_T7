const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./harness.cjs');

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

test('every control on every screen has a name and a role', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll(FOCUSABLE)) {
      const where = `${view}: ${el.outerHTML.slice(0, 90)}`;
      assert.ok(accName(el), `No accessible name — ${where}`);
      if (!NATIVE.test(el.tagName)) assert.ok(el.getAttribute('role'), `Focusable element without a role — ${where}`);
    }
  }
});

test('decorative emoji and icons are hidden from screen readers', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const svg of h.w.document.querySelectorAll('svg')) assert.equal(svg.getAttribute('aria-hidden'), 'true', `${view}: icon not hidden`);
    for (const emoji of h.w.document.querySelectorAll('.emoji')) {
      const named = emoji.closest('[aria-label]');
      assert.ok(emoji.closest('[aria-hidden="true"]') || named, `${view}: emoji read aloud — ${emoji.outerHTML}`);
    }
  }
});

test('app screens have landmarks and a page heading', t => {
  const h = setup(t); h.signIn();
  for (const screen of ['today', 'medications', 'messages', 'schedule', 'symptoms', 'account']) {
    h.go(screen);
    const d = h.w.document;
    assert.equal(d.documentElement.lang, 'en');
    for (const tag of ['aside', 'nav', 'header', 'main']) assert.equal(d.querySelectorAll(`#app ${tag}`).length, 1, `${screen}: one <${tag}>`);
    assert.equal(d.querySelectorAll('#app h1').length, 1);
    assert.equal(d.querySelector('#app h1').textContent, h.read('pageName()'));
    assert.equal(h.q('.nav [aria-current="page"]').dataset.go, screen, 'Current page marked in the menu');
  }
});

// ---------- Page changes ----------

test('moving to a page updates the window title and announces the page', t => {
  const h = setup(t);
  assert.equal(h.w.document.title, 'Welcome – CareConnect');
  h.click('[data-go="signin"]');
  assert.equal(h.w.document.title, 'Sign in – CareConnect'); assert.equal(h.q('#sr-page').textContent, 'Sign in page');
  h.signIn(); h.go('medications');
  assert.equal(h.w.document.title, 'Medications – CareConnect'); assert.equal(h.q('#sr-page').textContent, 'Medications page');
  h.go('messages'); h.click('[data-call="AJ"]');
  assert.equal(h.q('#sr-page').textContent, 'Call with Aunt Joyce page');
  assert.equal(h.q('#sr-page').getAttribute('aria-live'), 'polite');
  assert.ok(h.q('#sr-page').classList.contains('sr-only'), 'Announced, not shown');
});

test('re-rendering the same page does not re-announce it', t => {
  const h = setup(t); h.signIn(); h.go('account');
  h.q('#sr-page').textContent = '';
  h.click('[data-act="theme"]'); h.click('[data-act="reminders"]');
  assert.equal(h.q('#sr-page').textContent, '');
});

// ---------- Form errors ----------

test('sign-in errors are announced, mark the field and move focus to it', t => {
  const h = setup(t); h.go('signin');
  const err = h.q('#si-err');
  assert.equal(err.getAttribute('role'), 'alert');
  h.input('#si-email', 'bad'); h.submit('#signin-form');
  assert.equal(err.hidden, false); assert.match(err.textContent, /valid email/);
  assert.equal(h.q('#si-email').getAttribute('aria-invalid'), 'true');
  assert.equal(h.q('#si-email').getAttribute('aria-describedby'), 'si-err', 'Field is described by the message');
  assert.equal(h.focused(), h.q('#si-email'), 'Focus moves to the field to fix');

  h.input('#si-email', 'maddy@example.com'); h.input('#si-pass', ''); h.submit('#signin-form');
  assert.equal(h.q('#si-email').hasAttribute('aria-invalid'), false, 'Fixed field is no longer invalid');
  assert.equal(h.q('#si-pass').getAttribute('aria-invalid'), 'true');
  assert.equal(h.focused(), h.q('#si-pass'));
});

test('create-account errors point at the field that needs fixing', t => {
  const h = setup(t); h.go('create');
  assert.equal(h.q('#ca-err').getAttribute('role'), 'alert');
  for (const [fill, field, msg] of [
    [{}, '#ca-name', /full name/],
    [{ '#ca-name': 'Sam Lee', '#ca-email': 'x' }, '#ca-email', /valid email/],
    [{ '#ca-email': 'sam@example.com', '#ca-pass': 'short' }, '#ca-pass', /8 characters/]
  ]) {
    for (const [sel, v] of Object.entries(fill)) h.input(sel, v);
    h.submit('#create-form');
    assert.match(h.q('#ca-err').textContent, msg);
    assert.equal(h.focused(), h.q(field));
    assert.equal(h.w.document.querySelectorAll('[aria-invalid="true"]').length, 1, 'Only the current problem is marked');
  }
});

test('the symptom form error is announced', t => {
  const h = setup(t); h.signIn(); h.go('symptoms'); h.click('[data-act="log-symptom"]');
  h.submit('#sym-form');
  assert.equal(h.q('#sym-err').getAttribute('role'), 'alert'); assert.equal(h.q('#sym-err').hidden, false);
  assert.equal(h.q('#sym-name').getAttribute('aria-invalid'), 'true');
});

// ---------- Controls and their states ----------

test('severity is a labelled radio group that reports the selected value', t => {
  const h = setup(t); h.signIn(); h.go('symptoms'); h.click('[data-act="log-symptom"]');
  const group = h.q('.sev-pick');
  assert.equal(group.getAttribute('role'), 'radiogroup');
  assert.equal(accName(group), 'Severity (1 = mild, 5 = severe)');
  const radios = [...group.querySelectorAll('[data-sev]')];
  assert.deepEqual(radios.map(r => r.getAttribute('role')), Array(5).fill('radio'));
  assert.deepEqual(radios.map(accName), ['1 of 5, mild', '2 of 5', '3 of 5', '4 of 5', '5 of 5, severe']);
  const checked = () => radios.map(r => r.getAttribute('aria-checked'));
  assert.deepEqual(checked(), ['false', 'true', 'false', 'false', 'false']);
  h.click('[data-sev="4"]');
  assert.deepEqual(checked(), ['false', 'false', 'false', 'true', 'false']);
});

test('switches, toggle buttons and panels report their state', t => {
  const h = setup(t); h.signIn(); h.go('account');
  const sw = h.q('.sidebar [role="switch"]');
  assert.equal(accName(sw), 'Dark mode'); assert.equal(sw.getAttribute('aria-checked'), 'true');
  h.click('.sidebar [role="switch"]'); assert.equal(h.q('.sidebar [role="switch"]').getAttribute('aria-checked'), 'false');
  for (const act of ['voice', 'eye']) {
    assert.equal(h.q(`.topbar [data-act="${act}"]`).getAttribute('aria-pressed'), 'false');
    h.click(`.topbar [data-act="${act}"]`);
    assert.equal(h.q(`.topbar [data-act="${act}"]`).getAttribute('aria-pressed'), 'true');
  }
  assert.equal(h.q('[data-act="notes"]').getAttribute('aria-expanded'), 'false');
  h.click('[data-act="notes"]');
  assert.equal(h.q('[data-act="notes"]').getAttribute('aria-expanded'), 'true');
  assert.equal(h.q('.popover').getAttribute('role'), 'dialog'); assert.equal(accName(h.q('.popover')), 'Notifications');
});

test('dialogs are modal and named by their heading', t => {
  const h = setup(t); h.signIn();
  h.click('[data-act="sos"]');
  const sos = h.q('[role="alertdialog"]');
  assert.equal(sos.getAttribute('aria-modal'), 'true'); assert.equal(accName(sos), 'Send emergency alert?');
  h.key('Escape');
  h.go('symptoms'); h.click('[data-act="log-symptom"]');
  const form = h.q('[role="dialog"]');
  assert.equal(form.getAttribute('aria-modal'), 'true'); assert.equal(accName(form), 'Log a symptom');
});

// ---------- Content that is only visual otherwise ----------

test('the medication progress bar says what it measures', t => {
  const h = setup(t); h.signIn();
  const bar = () => h.q('[role="progressbar"]');
  assert.equal(accName(bar()), 'Medications taken today');
  assert.equal(bar().getAttribute('aria-valuetext'), '2 of 9 taken');
  h.click('[data-med-take="2"]');
  assert.equal(bar().getAttribute('aria-valuetext'), '3 of 9 taken'); assert.equal(bar().getAttribute('aria-valuenow'), '33');
});

test('focusable cards read as named groups', t => {
  const h = setup(t); h.signIn();
  assert.equal(accName(h.q('.status-bar.taken')), 'Ropivacaine 8:00 AM: taken');
  assert.match(accName(h.q('.card.tip')), /^Daily tip: Taking medications at the same time/);
  h.go('symptoms');
  const sym = h.q('.sym');
  assert.equal(sym.getAttribute('role'), 'group');
  assert.equal(accName(sym), 'Pain, severity 2 of 5, Today · 9:10 AM. Mild knee ache after morning walk');
  assert.equal(sym.querySelector('.bars').getAttribute('aria-hidden'), 'true', 'Bars repeat the label, so they are hidden');
  h.go('schedule');
  assert.equal(accName(h.q('.appt-card')), 'Dr. Chen — Follow-up, Dr. Sarah Chen · Physician, 2:30 PM, 45 min');
  h.go('account');
  assert.equal(accName(h.q('.shortcuts')), 'Keyboard shortcuts');
});

test('schedule days are tabs that name the date and count, controlling one panel', t => {
  const h = setup(t); h.signIn(); h.go('schedule');
  const tabs = [...h.w.document.querySelectorAll('[role="tab"]')];
  assert.equal(accName(tabs[0]), 'Monday, Sep 28, 1 scheduled');
  assert.equal(accName(tabs[3]), 'Thursday, Oct 1', 'No count on an empty day');
  const panel = h.q('[role="tabpanel"]');
  assert.equal(panel.getAttribute('aria-labelledby'), 'day-tab-0');
  assert.ok(tabs.every(tab => tab.getAttribute('aria-controls') === panel.id));
  h.click('[data-day="2"]');
  assert.equal(h.q('[role="tabpanel"]').getAttribute('aria-labelledby'), 'day-tab-2');
  assert.equal(h.q('#day-tab-2').getAttribute('aria-selected'), 'true');
});

test('messages: unread state, the open conversation and the thread are announced', t => {
  const h = setup(t); h.signIn();
  assert.equal(accName(h.q('.nav [data-go="messages"]')), 'Messages (1 unread)');
  assert.equal(h.q('.nav [data-go="messages"] .label').firstChild.textContent, 'Messages (1', 'Screen still shows "(1)"');
  h.go('messages');
  h.read('state.convos[1].unread = true; render()');
  const sc = h.q('[data-convo="SC"]');
  assert.equal(accName(sc), 'Dr. Sarah Chen, Physician, unread, Monday: Thank you, Dr. Chen.');
  assert.equal(h.q('[data-convo="AJ"]').getAttribute('aria-current'), 'true');
  assert.equal(sc.hasAttribute('aria-current'), false);
  assert.equal(h.q('#thread').getAttribute('role'), 'log');
  assert.equal(accName(h.q('#thread')), 'Conversation with Aunt Joyce');
});

test('the history button says how many actions can be undone', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-take="2"]'); h.click('[data-med-take="3"]');
  assert.equal(accName(h.q('[data-act="history"]')), 'Action history, 2 can be undone');
  h.ctrl('u'); h.ctrl('u');
  assert.equal(accName(h.q('[data-act="history"]')), 'Action history');
});

test('the call timer is exposed as a timer, not re-read every second', t => {
  const h = setup(t); h.go('messages'); h.click('[data-call="AJ"]');
  const timer = h.q('#call-timer');
  assert.equal(timer.getAttribute('role'), 'timer'); assert.equal(accName(timer), 'Call length');
  assert.equal(timer.hasAttribute('aria-live'), false);
});

// ---------- Toasts ----------

test('toast messages are read from one persistent live region, with an undo hint', t => {
  const h = setup(t);
  const live = h.q('#toast [role="status"]');
  assert.ok(live, 'Live region exists before any toast'); assert.equal(live.getAttribute('aria-live'), 'polite');
  h.signIn(); h.click('[data-med-take="2"]');
  assert.equal(h.q('#toast [role="status"]'), live, 'Same element, so each new message is announced');
  assert.equal(textOf(live), 'Marked as taken Press Control U to undo.');
  assert.equal(h.q('.toast-msg').textContent, 'Marked as taken', 'Visible text unchanged');
  h.click('.toast-undo');
  assert.equal(h.q('#toast [role="status"]'), live);
  assert.match(textOf(live), /^Undone: Marked Ropivacaine \(8:00 PM\) as taken$/, 'No undo hint when there is nothing to undo');
  assert.equal(live.querySelector('button'), null, 'Buttons are outside the live region, so they are not read with the message');
});
