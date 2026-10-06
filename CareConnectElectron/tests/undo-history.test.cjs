const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./harness.cjs');

const historyItems = h => [...h.w.document.querySelectorAll('.history-list .h-item')].map(li => ({
  label: li.querySelector('.h-label').textContent,
  meta: li.querySelector('.h-meta').textContent,
  status: (li.querySelector('.h-status') || li.querySelector('.h-undo')).textContent.trim(),
  undone: li.classList.contains('undone')
}));

test('history button appears in the top bar only after the first action', t => {
  const h = setup(t); h.signIn();
  assert.equal(h.q('[data-act="history"]'), null, 'No history button before any action');
  h.click('[data-med-take="2"]');
  const btn = h.q('[data-act="history"]');
  assert.ok(btn); assert.ok(btn.classList.contains('appear'), 'Animates in the first time');
  assert.equal(h.q('.hb-count').textContent, '1');
  h.click('[data-med-take="3"]');
  assert.equal(h.q('[data-act="history"]').classList.contains('appear'), false, 'Animates only once');
  assert.equal(h.q('.hb-count').textContent, '2');
  h.go('schedule'); assert.ok(h.q('[data-act="history"]'), 'Stays on every app page');
});

test('undo toast matches the design: message, Undo, dismiss', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-take="2"]');
  assert.equal(h.q('.toast-msg').textContent, 'Marked as taken');
  assert.equal(h.q('.toast-undo').textContent, 'Undo');
  assert.equal(h.q('.toast-close').getAttribute('aria-label'), 'Dismiss');
  h.click('.toast-close'); assert.equal(h.toastShown(), false);
});

test('toast Undo reverts the action and the follow-up toast has no Undo', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-take="2"]'); assert.equal(h.read('state.meds[1].status'), 'taken');
  h.click('.toast-undo');
  assert.equal(h.read('state.meds[1].status'), null);
  assert.match(h.toastText(), /Undone: Marked Ropivacaine \(8:00 PM\) as taken/);
  assert.equal(h.q('.toast-undo'), null);
  assert.equal(h.q('.hb-count'), null, 'Nothing left to undo');
});

test('undo toast lasts 7s, pauses while hovered or focused, then resumes', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-take="2"]');
  h.tick(6999); assert.ok(h.toastShown()); h.tick(1); assert.equal(h.toastShown(), false);

  h.click('[data-med-take="3"]');
  h.q('#toast').dispatchEvent(new h.w.MouseEvent('mouseenter'));
  h.tick(20000); assert.ok(h.toastShown(), 'Stays while pointed at');
  h.q('#toast').dispatchEvent(new h.w.MouseEvent('mouseleave'));
  h.tick(2999); assert.ok(h.toastShown()); h.tick(1); assert.equal(h.toastShown(), false);

  h.click('[data-med-take="4"]');
  h.q('.toast-undo').focus();
  h.tick(20000); assert.ok(h.toastShown(), 'Stays while focused');
  h.key('Escape'); assert.equal(h.toastShown(), false, 'Esc dismisses a focused toast');
});

test('after the toast is gone, actions are undone from the history panel', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-take="2"]');
  h.go('medications'); h.click('[data-med-miss="3"]');
  h.tick(10000); assert.equal(h.toastShown(), false);

  assert.equal(h.ctrl('h'), true);
  assert.equal(h.read('state.panel'), 'history');
  assert.equal(h.q('[data-act="history"]').getAttribute('aria-expanded'), 'true');
  const items = historyItems(h);
  assert.equal(items.length, 2);
  assert.match(items[0].label, /Loratadip \/ Carbiopa \(7:00 AM\) as missed/, 'Newest first');
  assert.match(items[0].meta, /Medications$/, 'Shows the page it happened on');
  assert.match(items[1].meta, /Today$/);
  assert.match(items[1].meta, /\d{1,2}:\d{2} [AP]M/, 'Shows when it happened');

  h.click('[data-undo="1"]'); // the older action
  assert.equal(h.read('state.meds[1].status'), null);
  assert.equal(h.read('state.meds[2].status'), 'missed', 'Only that action is undone');
  assert.equal(h.read('state.panel'), 'history', 'Panel stays open');
  const after = historyItems(h);
  assert.equal(after[1].status, 'Undone'); assert.equal(after[1].undone, true);
  assert.equal(after[0].status, 'Undo');
  assert.equal(h.q('.hb-count').textContent, '1');
});

test('Ctrl+U undoes the latest undoable action, skipping ones that cannot be undone', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-take="2"]');
  h.click('[data-act="sos"]'); h.click('[data-act="sos-confirm"]');
  h.click('[data-med-take="3"]');

  h.ctrl('u'); assert.equal(h.read('state.meds[2].status'), null, 'Latest first');
  h.ctrl('u'); assert.equal(h.read('state.meds[1].status'), null, 'Skips the SOS alert');
  h.ctrl('u'); assert.match(h.toastText(), /Nothing to undo/);

  h.ctrl('h');
  const sos = historyItems(h).find(i => /emergency alert/.test(i.label));
  assert.equal(sos.status, "Can't be undone");
});

test('an action changed again later shows "Changed since" until the later change is undone', t => {
  const h = setup(t); h.signIn(); h.go('account');
  h.click('[data-act="biometric"]'); // on -> off
  h.click('[data-act="biometric"]'); // off -> on
  h.ctrl('h');
  let items = historyItems(h);
  assert.equal(items[0].label, 'Biometric unlock turned on'); assert.equal(items[0].status, 'Undo');
  assert.equal(items[1].label, 'Biometric unlock turned off'); assert.equal(items[1].status, 'Changed since');
  assert.equal(h.q('[data-undo="1"]'), null, 'No Undo button for the stale entry');

  h.read('undoAction(1)');
  assert.match(h.toastText(), /can't be undone anymore/); assert.equal(h.read('state.biometric'), true);

  h.click('[data-undo="2"]');
  items = historyItems(h);
  assert.equal(items[0].status, 'Undone');
  assert.equal(items[1].status, 'Undo', 'Undoable again once the later change is reversed');
  h.click('[data-undo="1"]'); assert.equal(h.read('state.biometric'), true);
});

test('settings, symptoms and messages are undoable', t => {
  const h = setup(t); h.signIn(); h.go('account');
  for (const [act, key] of [['reminders', 'reminders'], ['share', 'shareData'], ['biometric', 'biometric'], ['toggle-notifications', 'notifications']]) {
    h.click(`[data-act="${act}"]`); assert.equal(h.read(`state.${key}`), false);
    h.click('.toast-undo'); assert.equal(h.read(`state.${key}`), true, `${act} undone`);
  }
  assert.equal(h.w.localStorage.getItem('cc.notifications'), 'true', 'Undo also restores the saved setting');

  h.go('symptoms'); h.click('[data-act="log-symptom"]');
  h.input('#sym-name', 'Headache'); h.submit('#sym-form');
  assert.equal(h.read('state.symptoms[0].name'), 'Headache');
  h.ctrl('u'); assert.notEqual(h.read('state.symptoms[0].name'), 'Headache');
  assert.equal(h.read('state.symptoms.length'), 4);

  h.go('messages');
  const convo = 'state.convos.find(c => c.id === state.activeConvo)';
  const timeBefore = h.read(`${convo}.time`), count = h.read(`${convo}.messages.length`);
  h.input('#msg-input', 'Running a little late today, see you soon at the clinic'); h.submit('#composer');
  assert.match(h.toastText(), /Message sent/);
  h.ctrl('h');
  assert.equal(historyItems(h)[0].label, 'Sent "Running a little late today, see…" to Aunt Joyce');
  h.key('Escape');
  h.ctrl('u');
  assert.equal(h.read(`${convo}.messages.length`), count, 'Message unsent');
  assert.equal(h.read(`${convo}.time`), timeBefore, 'Conversation time restored');
});

test('Ctrl+H toggles the panel; the close button, Esc and clicking elsewhere close it', t => {
  const h = setup(t); h.signIn();
  h.ctrl('h'); assert.match(h.toastText(), /No actions yet/); assert.equal(h.read('state.panel'), null);
  h.click('[data-med-take="2"]');
  h.ctrl('h'); assert.equal(h.read('state.panel'), 'history');
  h.ctrl('h'); assert.equal(h.read('state.panel'), null);
  h.click('[data-act="history"]'); assert.equal(h.read('state.panel'), 'history');
  h.click('.pop-close'); assert.equal(h.read('state.panel'), null);
  h.ctrl('h'); h.key('Escape'); assert.equal(h.read('state.panel'), null);
  h.ctrl('h');
  h.q('.popover').dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); assert.equal(h.read('state.panel'), 'history');
  h.q('[data-act="history"]').dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); assert.equal(h.read('state.panel'), 'history');
  h.w.document.body.dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); assert.equal(h.read('state.panel'), null);
  h.click('[data-act="notes"]'); h.ctrl('h');
  assert.equal(h.read('state.panel'), 'history', 'Only one panel at a time');
  assert.equal(h.w.document.querySelectorAll('.popover').length, 1);
});

test('undo and history shortcuts need a signed-in session; history needs the top bar', t => {
  const h = setup(t);
  assert.equal(h.ctrl('u'), true, 'Still swallowed so the browser does nothing');
  assert.equal(h.toastShown(), false);
  h.ctrl('h'); assert.equal(h.toastShown(), false);
  h.signIn(); h.click('[data-med-take="2"]'); h.tick(10000);
  h.click('[data-chat="AJ"]'); h.click('[data-call="AJ"]');
  assert.equal(h.read('state.screen'), 'call');
  h.ctrl('h'); assert.equal(h.read('state.panel'), null, 'No top bar on the call screen');
  h.ctrl('u'); assert.equal(h.read('state.meds[1].status'), null, 'Undo still works during a call');
});

test('signing out clears the history and hides the button', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-take="2"]'); h.ctrl('h');
  h.read('signOut()');
  assert.equal(h.read('actionLog.length'), 0); assert.equal(h.read('state.panel'), null);
  h.signIn();
  assert.equal(h.q('[data-act="history"]'), null);
});

test('history keeps the 50 most recent actions', t => {
  const h = setup(t); h.signIn(); h.go('account');
  for (let i = 0; i < 55; i++) h.click('[data-act="reminders"]');
  assert.equal(h.read('actionLog.length'), 50);
  assert.equal(h.read('actionLog[0].id'), 6, 'Oldest five dropped');
  h.ctrl('h');
  assert.equal(h.w.document.querySelectorAll('.history-list .h-item').length, 50);
  assert.equal(h.q('.hb-count').textContent, '1', 'Each toggle supersedes the one before it');
});
