// Jest port of tests/undo-history.test.cjs (the node:test original is kept and still runs with npm test)
const { setupApp } = require('./jest-harness');

const historyItems = h => [...h.w.document.querySelectorAll('.history-list .h-item')].map(li => ({
  label: li.querySelector('.h-label').textContent,
  meta: li.querySelector('.h-meta').textContent,
  status: (li.querySelector('.h-status') || li.querySelector('.h-undo')).textContent.trim(),
  undone: li.classList.contains('undone')
}));

test('history button appears in the top bar only after the first action', () => {
  const h = setupApp(); h.signIn();
  expect(h.q('[data-act="history"]')).toBe(null);
  h.click('[data-med-take="2"]');
  const btn = h.q('[data-act="history"]');
  expect(btn).toBeTruthy(); expect(btn.classList.contains('appear')).toBeTruthy();
  expect(h.q('.hb-count').textContent).toBe('1');
  h.click('[data-med-take="3"]');
  expect(h.q('[data-act="history"]').classList.contains('appear')).toBe(false);
  expect(h.q('.hb-count').textContent).toBe('2');
  h.go('schedule'); expect(h.q('[data-act="history"]')).toBeTruthy();
});

test('undo toast matches the design: message, Undo, dismiss', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]');
  expect(h.q('.toast-msg').textContent).toBe('Marked as taken');
  expect(h.q('.toast-undo').textContent).toBe('Undo');
  expect(h.q('.toast-close').getAttribute('aria-label')).toBe('Dismiss');
  h.click('.toast-close'); expect(h.toastShown()).toBe(false);
});

test('toast Undo reverts the action and the follow-up toast has no Undo', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]'); expect(h.read('state.meds[1].status')).toBe('taken');
  h.click('.toast-undo');
  expect(h.read('state.meds[1].status')).toBe(null);
  expect(h.toastText()).toMatch(/Undone: Marked Ropivacaine \(8:00 PM\) as taken/);
  expect(h.q('.toast-undo')).toBe(null);
  expect(h.q('.hb-count')).toBe(null);
});

test('undo toast lasts 7s, pauses while hovered or focused, then resumes', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]');
  h.tick(6999); expect(h.toastShown()).toBeTruthy(); h.tick(1); expect(h.toastShown()).toBe(false);

  h.click('[data-med-take="3"]');
  h.q('#toast').dispatchEvent(new h.w.MouseEvent('mouseenter'));
  h.tick(20000); expect(h.toastShown()).toBeTruthy();
  h.q('#toast').dispatchEvent(new h.w.MouseEvent('mouseleave'));
  h.tick(2999); expect(h.toastShown()).toBeTruthy(); h.tick(1); expect(h.toastShown()).toBe(false);

  h.click('[data-med-take="4"]');
  h.q('.toast-undo').focus();
  h.tick(20000); expect(h.toastShown()).toBeTruthy();
  h.key('Escape'); expect(h.toastShown()).toBe(false);
});

test('after the toast is gone, actions are undone from the history panel', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]');
  h.go('medications'); h.click('[data-med-miss="3"]');
  h.tick(10000); expect(h.toastShown()).toBe(false);

  expect(h.ctrl('h')).toBe(true);
  expect(h.read('state.panel')).toBe('history');
  expect(h.q('[data-act="history"]').getAttribute('aria-expanded')).toBe('true');
  const items = historyItems(h);
  expect(items.length).toBe(2);
  expect(items[0].label).toMatch(/Loratadip \/ Carbiopa \(7:00 AM\) as missed/);
  expect(items[0].meta).toMatch(/Medications$/);
  expect(items[1].meta).toMatch(/Today$/);
  expect(items[1].meta).toMatch(/\d{1,2}:\d{2} [AP]M/);

  h.click('[data-undo="1"]'); // the older action
  expect(h.read('state.meds[1].status')).toBe(null);
  expect(h.read('state.meds[2].status')).toBe('missed');
  expect(h.read('state.panel')).toBe('history');
  const after = historyItems(h);
  expect(after[1].status).toBe('Undone'); expect(after[1].undone).toBe(true);
  expect(after[0].status).toBe('Undo');
  expect(h.q('.hb-count').textContent).toBe('1');
});

test('Ctrl+U undoes the latest undoable action, skipping ones that cannot be undone', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]');
  h.click('[data-act="sos"]'); h.click('[data-act="sos-confirm"]');
  h.click('[data-med-take="3"]');

  h.ctrl('u'); expect(h.read('state.meds[2].status')).toBe(null);
  h.ctrl('u'); expect(h.read('state.meds[1].status')).toBe(null);
  h.ctrl('u'); expect(h.toastText()).toMatch(/Nothing to undo/);

  h.ctrl('h');
  const sos = historyItems(h).find(i => /emergency alert/.test(i.label));
  expect(sos.status).toBe("Can't be undone");
});

test('an action changed again later shows "Changed since" until the later change is undone', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  h.click('[data-act="biometric"]'); // on -> off
  h.click('[data-act="biometric"]'); // off -> on
  h.ctrl('h');
  let items = historyItems(h);
  expect(items[0].label).toBe('Biometric unlock turned on'); expect(items[0].status).toBe('Undo');
  expect(items[1].label).toBe('Biometric unlock turned off'); expect(items[1].status).toBe('Changed since');
  expect(h.q('[data-undo="1"]')).toBe(null);

  h.read('undoAction(1)');
  expect(h.toastText()).toMatch(/can't be undone anymore/); expect(h.read('state.biometric')).toBe(true);

  h.click('[data-undo="2"]');
  items = historyItems(h);
  expect(items[0].status).toBe('Undone');
  expect(items[1].status).toBe('Undo');
  h.click('[data-undo="1"]'); expect(h.read('state.biometric')).toBe(true);
});

test('settings, symptoms and messages are undoable', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  for (const [act, key] of [['reminders', 'reminders'], ['share', 'shareData'], ['biometric', 'biometric'], ['toggle-notifications', 'notifications']]) {
    h.click(`[data-act="${act}"]`); expect(h.read(`state.${key}`)).toBe(false);
    h.click('.toast-undo'); expect(h.read(`state.${key}`)).toBe(true);
  }
  expect(h.w.localStorage.getItem('cc.notifications')).toBe('true');

  h.go('symptoms'); h.click('[data-act="log-symptom"]');
  h.input('#sym-name', 'Headache'); h.submit('#sym-form');
  expect(h.read('state.symptoms[0].name')).toBe('Headache');
  h.ctrl('u'); expect(h.read('state.symptoms[0].name')).not.toBe('Headache');
  expect(h.read('state.symptoms.length')).toBe(4);

  h.go('messages');
  const convo = 'state.convos.find(c => c.id === state.activeConvo)';
  const timeBefore = h.read(`${convo}.time`), count = h.read(`${convo}.messages.length`);
  h.input('#msg-input', 'Running a little late today, see you soon at the clinic'); h.submit('#composer');
  expect(h.toastText()).toMatch(/Message sent/);
  h.ctrl('h');
  expect(historyItems(h)[0].label).toBe('Sent "Running a little late today, see…" to Aunt Joyce');
  h.key('Escape');
  h.ctrl('u');
  expect(h.read(`${convo}.messages.length`)).toBe(count);
  expect(h.read(`${convo}.time`)).toBe(timeBefore);
});

test('Ctrl+H toggles the panel; the close button, Esc and clicking elsewhere close it', () => {
  const h = setupApp(); h.signIn();
  h.ctrl('h'); expect(h.toastText()).toMatch(/No actions yet/); expect(h.read('state.panel')).toBe(null);
  h.click('[data-med-take="2"]');
  h.ctrl('h'); expect(h.read('state.panel')).toBe('history');
  h.ctrl('h'); expect(h.read('state.panel')).toBe(null);
  h.click('[data-act="history"]'); expect(h.read('state.panel')).toBe('history');
  h.click('.pop-close'); expect(h.read('state.panel')).toBe(null);
  h.ctrl('h'); h.key('Escape'); expect(h.read('state.panel')).toBe(null);
  h.ctrl('h');
  h.q('.popover').dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); expect(h.read('state.panel')).toBe('history');
  h.q('[data-act="history"]').dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); expect(h.read('state.panel')).toBe('history');
  h.w.document.body.dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); expect(h.read('state.panel')).toBe(null);
  h.click('[data-act="notes"]'); h.ctrl('h');
  expect(h.read('state.panel')).toBe('history');
  expect(h.w.document.querySelectorAll('.popover').length).toBe(1);
});

test('undo and history shortcuts need a signed-in session; history needs the top bar', () => {
  const h = setupApp();
  expect(h.ctrl('u')).toBe(true);
  expect(h.toastShown()).toBe(false);
  h.ctrl('h'); expect(h.toastShown()).toBe(false);
  h.signIn(); h.click('[data-med-take="2"]'); h.tick(10000);
  h.click('[data-chat="AJ"]'); h.click('[data-call="AJ"]');
  expect(h.read('state.screen')).toBe('call');
  h.ctrl('h'); expect(h.read('state.panel')).toBe(null);
  h.ctrl('u'); expect(h.read('state.meds[1].status')).toBe(null);
});

test('signing out clears the history and hides the button', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-take="2"]'); h.ctrl('h');
  h.read('signOut()');
  expect(h.read('actionLog.length')).toBe(0); expect(h.read('state.panel')).toBe(null);
  h.signIn();
  expect(h.q('[data-act="history"]')).toBe(null);
});

test('history keeps the 50 most recent actions', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  for (let i = 0; i < 55; i++) h.click('[data-act="reminders"]');
  expect(h.read('actionLog.length')).toBe(50);
  expect(h.read('actionLog[0].id')).toBe(6);
  h.ctrl('h');
  expect(h.w.document.querySelectorAll('.history-list .h-item').length).toBe(50);
  expect(h.q('.hb-count').textContent).toBe('1');
});
