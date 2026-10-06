// Jest port of tests/renderer.test.cjs (the node:test original is kept and still runs with npm test)
const { setupApp } = require('./jest-harness');

test('landing, navigation, replacement history and back fallback', () => {
  const h = setupApp();
  expect(h.q('#app').textContent).toMatch(/CareConnect Desktop/);
  h.click('[data-go="signin"]');
  h.click('[data-go="create"]');
  expect(h.read('state.history.length')).toBe(1);
  h.click('[data-go="signin"]'); h.click('[data-act="back"]');
  expect(h.read('state.screen')).toBe('landing');
  h.read('back()'); expect(h.read('state.history.length')).toBe(0);
  h.go('today'); h.click('[data-go="account"]');
  expect(h.read('state.history.length')).toBe(1);
  h.click('[data-go="account"]'); expect(h.read('state.history.length')).toBe(1);
  h.w.document.body.click();
});

test('sign-in validates email and password before clearing history', () => {
  const h = setupApp(); h.go('signin');
  h.input('#si-email', 'invalid'); h.submit('#signin-form');
  expect(h.q('#si-err').textContent).toMatch(/valid email/); expect(h.q('#si-err').hidden).toBe(false);
  h.input('#si-email', ' person@example.com '); h.input('#si-pass', ''); h.submit('#signin-form');
  expect(h.q('#si-err').textContent).toMatch(/password/);
  h.input('#si-pass', 'anything'); h.submit('#signin-form');
  expect(h.read('state.screen')).toBe('today'); expect(h.read('state.history.length')).toBe(0);
});

for (const role of ['recipient', 'caregiver']) test(`create account validation and ${role} profile`, () => {
  const h = setupApp(); h.go('create'); h.click(`[data-role="${role}"]`);
  h.input('#ca-name', ' '); h.submit('#create-form'); expect(h.q('#ca-err').textContent).toMatch(/full name/);
  h.input('#ca-name', '  Alex   Morgan Lee '); h.input('#ca-email', 'bad'); h.submit('#create-form'); expect(h.q('#ca-err').textContent).toMatch(/valid email/);
  h.input('#ca-email', 'alex@example.com'); h.input('#ca-pass', '1234567'); h.submit('#create-form'); expect(h.q('#ca-err').textContent).toMatch(/8 characters/);
  h.input('#ca-pass', '12345678'); h.submit('#create-form');
  expect(h.read('state.screen')).toBe('biometrics'); expect(h.read('user.first')).toBe('Alex'); expect(h.read('user.initials')).toBe('AM');
  expect(h.read('user.role')).toBe(role === 'caregiver' ? 'Caregiver' : 'Care recipient');
  h.click('[data-act="face-no"]'); expect(h.read('state.screen')).toBe('signin');
});

test('simulated face flow has exact delays and cancelled scans cannot sign in', () => {
  const h = setupApp(); h.go('biometrics'); h.click('[data-act="face-yes"]');
  h.tick(2199); expect(h.read('state.screen')).toBe('facescan');
  h.tick(1); expect(h.read('state.screen')).toBe('facesuccess');
  h.tick(1499); expect(h.read('state.screen')).toBe('facesuccess');
  h.tick(1); expect(h.read('state.screen')).toBe('today'); expect(h.read('state.history.length')).toBe(0);
  h.go('signin'); h.click('[data-go="facescan"]'); h.click('[data-go="signin"]'); h.tick(5000);
  expect(h.read('state.screen')).toBe('signin');
});

test('medications taken, missed, undo update cards, counts and progress', () => {
  const h = setupApp(); h.go('today');
  expect(h.q('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('22');
  h.click('[data-med-take="2"]'); expect(h.read('state.meds[1].status')).toBe('taken');
  expect(h.q('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('33'); expect(h.q('#toast').textContent).toMatch(/Marked as taken/);
  expect(h.q('.med.taken .status-bar button')).toBe(null);
  h.click('.toast-undo'); expect(h.read('state.meds[1].status')).toBe(null);
  expect(h.q('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('22');
  h.go('medications'); h.click('[data-med-miss="2"]');
  expect(h.q('.stat.missed .n').textContent).toBe('1'); expect(h.q('#toast').textContent).toMatch(/Marked as missed/);
  h.click('.toast-undo'); expect(h.q('.stat.missed .n').textContent).toBe('0');
});

test('symptom modal validation, severity, trimming, defaults and escaping', () => {
  const h = setupApp(); h.go('symptoms'); h.click('[data-act="log-symptom"]');
  expect(h.w.document.activeElement.id).toBe('sym-name');
  h.input('#sym-name', ' '); h.submit('#sym-form'); expect(h.q('#sym-err').textContent).toMatch(/enter a symptom/);
  h.click('[data-sev="5"]'); expect(h.q('[data-sev="5"]').className).toBe('sel');
  h.input('#sym-name', ' <img src=x onerror=alert(1)> '); h.input('#sym-note', ' <script>bad</script> '); h.submit('#sym-form');
  expect(h.read('state.symptoms[0].sev')).toBe(5); expect(h.q('#modal-root').innerHTML).toBe('');
  expect(h.q('.sym-grid img')).toBe(null); expect(h.q('.sym-grid script')).toBe(null);
  expect(h.q('.sym .note').textContent).toMatch(/<script>bad<\/script>/);
  h.click('[data-act="log-symptom"]'); h.input('#sym-name', 'Headache'); h.submit('#sym-form');
  expect(h.read('state.symptoms[0].note')).toBe('No notes'); expect(h.read('state.symptoms[0].sev')).toBe(2);
  h.read('state.symptoms = []; render()'); expect(h.q('.sym-empty').textContent).toMatch(/No symptoms/);
});

test('modal cancel, backdrop, inner click and Escape; SOS confirmation toast', () => {
  const h = setupApp(); h.go('today');
  h.click('[data-act="sos"]'); expect(h.q('[role="alertdialog"]').getAttribute('aria-modal')).toBe('true');
  h.click('.modal'); expect(h.q('.modal')).toBeTruthy();
  h.click('button[data-close]'); expect(h.q('#modal-root').innerHTML).toBe('');
  h.click('[data-act="sos"]'); h.click('.overlay'); expect(h.q('#modal-root').innerHTML).toBe('');
  h.click('[data-act="sos"]'); h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); expect(h.q('#modal-root').innerHTML).toBe('');
  h.click('[data-act="sos"]'); h.click('[data-act="sos-confirm"]'); expect(h.q('#toast').textContent).toMatch(/SOS alert sent/);
  h.tick(3999); expect(h.q('#toast').classList.contains('show')).toBeTruthy(); h.tick(1); expect(h.q('#toast').classList.contains('show')).toBe(false);
});

test('messages unread switching, draft/submit/quick reply, whitespace and escaped HTML', () => {
  const h = setupApp(); h.go('today'); h.click('[data-chat="AJ"]');
  expect(h.read('state.convos[0].unread')).toBe(false);
  h.input('#msg-input', '   '); expect(h.q('.send').disabled).toBe(true);
  const count = h.read('state.convos[0].messages.length'); h.submit('#composer'); expect(h.read('state.convos[0].messages.length')).toBe(count);
  h.input('#msg-input', ' <b>Hello</b> '); expect(h.q('.send').disabled).toBe(false); h.submit('#composer');
  expect(h.read('state.convos[0].messages.at(-1).text')).toBe('<b>Hello</b>'); expect(h.q('.bubble b')).toBe(null); expect(h.w.document.activeElement.id).toBe('msg-input');
  h.click('[data-quick="Thank you"]'); expect(h.read('state.convos[0].messages.at(-1).text')).toBe('Thank you');
  h.input('#msg-input', 'unsent'); h.click('[data-convo="SC"]');
  expect(h.read('state.draft')).toBe(''); expect(h.read('state.activeConvo')).toBe('SC');
  h.click('[data-convo="AJ"]'); expect(h.q('.unread-count').textContent).toMatch(/0 unread conversations/);
});

test('call timer minute rollover, mute/speaker, end and sign-out cleanup', () => {
  const h = setupApp(); h.go('messages'); h.click('[data-call="AJ"]');
  expect(h.q('#call-timer').textContent).toBe('0:00'); h.tick(61000); expect(h.q('#call-timer').textContent).toBe('1:01');
  h.click('[data-act="mute"]'); expect(h.q('[data-act="mute"]').getAttribute('aria-pressed')).toBe('true'); h.click('[data-act="mute"]');
  h.click('[data-act="speaker"]'); expect(h.q('[data-act="speaker"]').textContent).toMatch(/Speaker/); h.click('[data-act="speaker"]');
  h.click('[data-act="end-call"]'); expect(h.read('state.screen')).toBe('messages'); const seconds = h.read('state.call.seconds'); h.tick(5000); expect(h.read('state.call.seconds')).toBe(seconds);
  h.click('[data-call="AJ"]'); h.read('signOut()'); h.tick(5000); expect(h.read('state.call.seconds')).toBe(0); expect(h.read('state.screen')).toBe('landing'); expect(h.read('state.history.length')).toBe(0);
});

test('schedule selects day zero, populated days and empty days', () => {
  const h = setupApp(); h.go('schedule'); expect(h.q('.day-title .chip').textContent).toBe('1 scheduled');
  h.click('[data-day="2"]'); expect(h.w.document.querySelectorAll('.appt-card').length).toBe(2); expect(h.q('[data-day="2"]').getAttribute('aria-selected')).toBe('true');
  h.click('[data-day="3"]'); expect(h.q('.empty-day').textContent).toMatch(/No appointments/);
  h.click('[data-day="0"]'); expect(h.q('.day-title').textContent).toMatch(/Today/);
});

test('preferences persist appearance and collapse; account toggles and toast replacement', () => {
  const h = setupApp(); h.click('[data-act="theme"]'); expect(h.w.localStorage.getItem('cc.theme')).toBe('"light"');
  h.go('account'); h.click('[data-act="theme"]'); expect(h.w.document.documentElement.dataset.theme).toBe('dark');
  h.click('[data-act="collapse"]'); expect(h.w.localStorage.getItem('cc.collapsed')).toBe('true');
  h.click('[data-act="collapse"]'); expect(h.w.localStorage.getItem('cc.collapsed')).toBe('false');
  for (const [act, key] of [['reminders', 'reminders'], ['biometric', 'biometric'], ['share', 'shareData']]) {
    h.click(`[data-act="${act}"]`); expect(h.read(`state.${key}`)).toBe(false); h.click(`[data-act="${act}"]`); expect(h.read(`state.${key}`)).toBe(true);
  }
  h.click('[data-act="privacy"]'); expect(h.q('#toast').textContent).toMatch(/encrypted/);
  h.tick(1000); h.click('[data-act="voice"]'); expect(h.read('state.voice')).toBe(true); expect(h.q('#toast').textContent).toMatch(/Voice commands on/);
  h.tick(3999); expect(h.q('#toast').classList.contains('show')).toBeTruthy(); h.tick(1); expect(h.q('#toast').classList.contains('show')).toBe(false);
  h.click('[data-act="signout"]'); expect(h.read('state.screen')).toBe('landing');
});

test('stored preferences load, malformed data and storage failures recover', () => {
  const h = setupApp({ theme: '"light"', collapsed: 'true', eyeTracking: 'true', mouseLock: 'true', notifications: 'false' });
  expect(h.w.document.documentElement.dataset.theme).toBe('light'); expect(h.w.document.documentElement.classList.contains('mouse-lock')).toBeTruthy();
  h.go('today'); expect(h.q('.sidebar').classList.contains('collapsed')).toBeTruthy();
  expect(h.q('[data-act="eye"]').getAttribute('aria-pressed')).toBe('true');
  expect(h.q('[data-act="notes"]').title).toMatch(/\(off\)/);
  h.w.localStorage.setItem('cc.bad', '{broken'); expect(h.read('store.get("bad", "fallback")')).toBe('fallback');
  Object.defineProperty(h.w, 'localStorage', { get() { throw new Error('unavailable'); } });
  expect(h.read('store.get("theme", "fallback")')).toBe('fallback'); h.click('[data-act="theme"]'); expect(h.read('state.theme')).toBe('dark');
});

test('notification inside/outside mousedown, Escape, and all-medications-complete content', () => {
  const h = setupApp(); h.go('today'); h.click('[data-act="notes"]'); expect(h.q('.popover').textContent).toMatch(/Medication due/);
  h.q('.popover').dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); expect(h.q('.popover')).toBeTruthy();
  h.q('[data-act="notes"]').dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); expect(h.q('.popover')).toBeTruthy();
  h.w.document.body.dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); expect(h.q('.popover')).toBe(null);
  h.click('[data-act="notes"]'); h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Escape' })); expect(h.q('.popover')).toBe(null);
  h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Enter' }));
  h.read('state.meds.forEach(m => m.status = "taken")'); h.click('[data-act="notes"]'); expect(h.q('.popover').textContent).not.toMatch(/Medication due/);
});


test('time-dependent greetings and a retained draft rendered after navigation', () => {
  const h = setupApp();
  for (const [hour, expected] of [[9, 'Good morning'], [12, 'Good afternoon'], [18, 'Good evening']]) {
    h.w.Date.prototype.getHours = () => hour;
    h.go('today'); h.read('render()');
    expect(h.q('.greet h2').textContent).toMatch(new RegExp(expected));
  }
  h.go('messages'); h.input('#msg-input', 'keep this draft');
  h.go('schedule'); h.go('messages');
  expect(h.q('#msg-input').value).toBe('keep this draft');
  expect(h.q('.send').disabled).toBe(false);
  expect(h.read('esc(' + JSON.stringify("&<>\"'") + ')')).toBe('&amp;&lt;&gt;&quot;&#39;');
});

test('user-entered text cannot inject markup: initials in avatars and toast messages', () => {
  const h = setupApp(); h.go('create');
  h.input('#ca-name', '<img src=x onerror=alert(1)> <b'); h.input('#ca-email', 'x@example.com'); h.input('#ca-pass', 'longenough');
  h.submit('#create-form'); expect(h.read('user.initials')).toBe('<S');
  h.signIn(); h.go('account');
  for (const av of [h.q('.sb-head .avatar'), h.q('.profile .avatar')]) {
    expect(av.textContent).toBe('<S'); expect(av.children.length).toBe(0);
  }
  h.read(`toast('<img src=x onerror=alert(1)>')`);
  expect(h.q('.toast-msg').textContent).toBe('<img src=x onerror=alert(1)>'); expect(h.q('#toast img')).toBe(null);
});
