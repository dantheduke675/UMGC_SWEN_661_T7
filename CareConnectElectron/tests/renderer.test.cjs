const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./harness.cjs');

test('landing, navigation, replacement history and back fallback', t => {
  const h = setup(t);
  assert.match(h.q('#app').textContent, /CareConnect Desktop/);
  h.click('[data-go="signin"]');
  h.click('[data-go="create"]');
  assert.equal(h.read('state.history.length'), 1);
  h.click('[data-go="signin"]'); h.click('[data-act="back"]');
  assert.equal(h.read('state.screen'), 'landing');
  h.read('back()'); assert.equal(h.read('state.history.length'), 0);
  h.go('today'); h.click('[data-go="account"]');
  assert.equal(h.read('state.history.length'), 1);
  h.click('[data-go="account"]'); assert.equal(h.read('state.history.length'), 1);
  h.w.document.body.click();
});

test('sign-in validates email and password before clearing history', t => {
  const h = setup(t); h.go('signin');
  h.input('#si-email', 'invalid'); h.submit('#signin-form');
  assert.match(h.q('#si-err').textContent, /valid email/); assert.equal(h.q('#si-err').hidden, false);
  h.input('#si-email', ' person@example.com '); h.input('#si-pass', ''); h.submit('#signin-form');
  assert.match(h.q('#si-err').textContent, /password/);
  h.input('#si-pass', 'anything'); h.submit('#signin-form');
  assert.equal(h.read('state.screen'), 'today'); assert.equal(h.read('state.history.length'), 0);
});

for (const role of ['recipient', 'caregiver']) test(`create account validation and ${role} profile`, t => {
  const h = setup(t); h.go('create'); h.click(`[data-role="${role}"]`);
  h.input('#ca-name', ' '); h.submit('#create-form'); assert.match(h.q('#ca-err').textContent, /full name/);
  h.input('#ca-name', '  Alex   Morgan Lee '); h.input('#ca-email', 'bad'); h.submit('#create-form'); assert.match(h.q('#ca-err').textContent, /valid email/);
  h.input('#ca-email', 'alex@example.com'); h.input('#ca-pass', '1234567'); h.submit('#create-form'); assert.match(h.q('#ca-err').textContent, /8 characters/);
  h.input('#ca-pass', '12345678'); h.submit('#create-form');
  assert.equal(h.read('state.screen'), 'biometrics'); assert.equal(h.read('user.first'), 'Alex'); assert.equal(h.read('user.initials'), 'AM');
  assert.equal(h.read('user.role'), role === 'caregiver' ? 'Caregiver' : 'Care recipient');
  h.click('[data-act="face-no"]'); assert.equal(h.read('state.screen'), 'signin');
});

test('simulated face flow has exact delays and cancelled scans cannot sign in', t => {
  const h = setup(t); h.go('biometrics'); h.click('[data-act="face-yes"]');
  h.tick(2199); assert.equal(h.read('state.screen'), 'facescan');
  h.tick(1); assert.equal(h.read('state.screen'), 'facesuccess');
  h.tick(1499); assert.equal(h.read('state.screen'), 'facesuccess');
  h.tick(1); assert.equal(h.read('state.screen'), 'today'); assert.equal(h.read('state.history.length'), 0);
  h.go('signin'); h.click('[data-go="facescan"]'); h.click('[data-go="signin"]'); h.tick(5000);
  assert.equal(h.read('state.screen'), 'signin');
});

test('medications taken, missed, undo update cards, counts and progress', t => {
  const h = setup(t); h.go('today');
  assert.equal(h.q('[role="progressbar"]').getAttribute('aria-valuenow'), '22');
  h.click('[data-med-take="2"]'); assert.equal(h.read('state.meds[1].status'), 'taken');
  assert.equal(h.q('[role="progressbar"]').getAttribute('aria-valuenow'), '33'); assert.match(h.q('#toast').textContent, /Marked as taken/);
  assert.equal(h.q('.med.taken .status-bar button'), null, 'Undo is offered by the toast, not the card');
  h.click('.toast-undo'); assert.equal(h.read('state.meds[1].status'), null);
  assert.equal(h.q('[role="progressbar"]').getAttribute('aria-valuenow'), '22');
  h.go('medications'); h.click('[data-med-miss="2"]');
  assert.equal(h.q('.stat.missed .n').textContent, '1'); assert.match(h.q('#toast').textContent, /Marked as missed/);
  h.click('.toast-undo'); assert.equal(h.q('.stat.missed .n').textContent, '0');
});

test('symptom modal validation, severity, trimming, defaults and escaping', t => {
  const h = setup(t); h.go('symptoms'); h.click('[data-act="log-symptom"]');
  assert.equal(h.w.document.activeElement.id, 'sym-name');
  h.input('#sym-name', ' '); h.submit('#sym-form'); assert.match(h.q('#sym-err').textContent, /enter a symptom/);
  h.click('[data-sev="5"]'); assert.equal(h.q('[data-sev="5"]').className, 'sel');
  h.input('#sym-name', ' <img src=x onerror=alert(1)> '); h.input('#sym-note', ' <script>bad</script> '); h.submit('#sym-form');
  assert.equal(h.read('state.symptoms[0].sev'), 5); assert.equal(h.q('#modal-root').innerHTML, '');
  assert.equal(h.q('.sym-grid img'), null); assert.equal(h.q('.sym-grid script'), null);
  assert.match(h.q('.sym .note').textContent, /<script>bad<\/script>/);
  h.click('[data-act="log-symptom"]'); h.input('#sym-name', 'Headache'); h.submit('#sym-form');
  assert.equal(h.read('state.symptoms[0].note'), 'No notes'); assert.equal(h.read('state.symptoms[0].sev'), 2);
  h.read('state.symptoms = []; render()'); assert.match(h.q('.sym-empty').textContent, /No symptoms/);
});

test('modal cancel, backdrop, inner click and Escape; SOS confirmation toast', t => {
  const h = setup(t); h.go('today');
  h.click('[data-act="sos"]'); assert.equal(h.q('[role="alertdialog"]').getAttribute('aria-modal'), 'true');
  h.click('.modal'); assert.ok(h.q('.modal'));
  h.click('button[data-close]'); assert.equal(h.q('#modal-root').innerHTML, '');
  h.click('[data-act="sos"]'); h.click('.overlay'); assert.equal(h.q('#modal-root').innerHTML, '');
  h.click('[data-act="sos"]'); h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); assert.equal(h.q('#modal-root').innerHTML, '');
  h.click('[data-act="sos"]'); h.click('[data-act="sos-confirm"]'); assert.match(h.q('#toast').textContent, /SOS alert sent/);
  h.tick(3999); assert.ok(h.q('#toast').classList.contains('show')); h.tick(1); assert.equal(h.q('#toast').classList.contains('show'), false);
});

test('messages unread switching, draft/submit/quick reply, whitespace and escaped HTML', t => {
  const h = setup(t); h.go('today'); h.click('[data-chat="AJ"]');
  assert.equal(h.read('state.convos[0].unread'), false);
  h.input('#msg-input', '   '); assert.equal(h.q('.send').disabled, true);
  const count = h.read('state.convos[0].messages.length'); h.submit('#composer'); assert.equal(h.read('state.convos[0].messages.length'), count);
  h.input('#msg-input', ' <b>Hello</b> '); assert.equal(h.q('.send').disabled, false); h.submit('#composer');
  assert.equal(h.read('state.convos[0].messages.at(-1).text'), '<b>Hello</b>'); assert.equal(h.q('.bubble b'), null); assert.equal(h.w.document.activeElement.id, 'msg-input');
  h.click('[data-quick="Thank you"]'); assert.equal(h.read('state.convos[0].messages.at(-1).text'), 'Thank you');
  h.input('#msg-input', 'unsent'); h.click('[data-convo="SC"]');
  assert.equal(h.read('state.draft'), ''); assert.equal(h.read('state.activeConvo'), 'SC');
  h.click('[data-convo="AJ"]'); assert.match(h.q('.unread-count').textContent, /0 unread conversations/);
});

test('call timer minute rollover, mute/speaker, end and sign-out cleanup', t => {
  const h = setup(t); h.go('messages'); h.click('[data-call="AJ"]');
  assert.equal(h.q('#call-timer').textContent, '0:00'); h.tick(61000); assert.equal(h.q('#call-timer').textContent, '1:01');
  h.click('[data-act="mute"]'); assert.equal(h.q('[data-act="mute"]').getAttribute('aria-pressed'), 'true'); h.click('[data-act="mute"]');
  h.click('[data-act="speaker"]'); assert.match(h.q('[data-act="speaker"]').textContent, /Speaker/); h.click('[data-act="speaker"]');
  h.click('[data-act="end-call"]'); assert.equal(h.read('state.screen'), 'messages'); const seconds = h.read('state.call.seconds'); h.tick(5000); assert.equal(h.read('state.call.seconds'), seconds);
  h.click('[data-call="AJ"]'); h.read('signOut()'); h.tick(5000); assert.equal(h.read('state.call.seconds'), 0); assert.equal(h.read('state.screen'), 'landing'); assert.equal(h.read('state.history.length'), 0);
});

test('schedule selects day zero, populated days and empty days', t => {
  const h = setup(t); h.go('schedule'); assert.equal(h.q('.day-title .chip').textContent, '1 scheduled');
  h.click('[data-day="2"]'); assert.equal(h.w.document.querySelectorAll('.appt-card').length, 2); assert.equal(h.q('[data-day="2"]').getAttribute('aria-selected'), 'true');
  h.click('[data-day="3"]'); assert.match(h.q('.empty-day').textContent, /No appointments/);
  h.click('[data-day="0"]'); assert.match(h.q('.day-title').textContent, /Today/);
});

test('preferences persist appearance and collapse; account toggles and toast replacement', t => {
  const h = setup(t); h.click('[data-act="theme"]'); assert.equal(h.w.localStorage.getItem('cc.theme'), '"light"');
  h.go('account'); h.click('[data-act="theme"]'); assert.equal(h.w.document.documentElement.dataset.theme, 'dark');
  h.click('[data-act="collapse"]'); assert.equal(h.w.localStorage.getItem('cc.collapsed'), 'true');
  h.click('[data-act="collapse"]'); assert.equal(h.w.localStorage.getItem('cc.collapsed'), 'false');
  for (const [act, key] of [['reminders', 'reminders'], ['biometric', 'biometric'], ['share', 'shareData']]) {
    h.click(`[data-act="${act}"]`); assert.equal(h.read(`state.${key}`), false); h.click(`[data-act="${act}"]`); assert.equal(h.read(`state.${key}`), true);
  }
  h.click('[data-act="privacy"]'); assert.match(h.q('#toast').textContent, /encrypted/);
  h.tick(1000); h.click('[data-act="voice"]'); assert.equal(h.read('state.voice'), true); assert.match(h.q('#toast').textContent, /Voice commands on/);
  h.tick(3999); assert.ok(h.q('#toast').classList.contains('show')); h.tick(1); assert.equal(h.q('#toast').classList.contains('show'), false);
  h.click('[data-act="signout"]'); assert.equal(h.read('state.screen'), 'landing');
});

test('stored preferences load, malformed data and storage failures recover', t => {
  const h = setup(t, { theme: '"light"', collapsed: 'true', eyeTracking: 'true', mouseLock: 'true', notifications: 'false' });
  assert.equal(h.w.document.documentElement.dataset.theme, 'light'); assert.ok(h.w.document.documentElement.classList.contains('mouse-lock'));
  h.go('today'); assert.ok(h.q('.sidebar').classList.contains('collapsed'));
  assert.equal(h.q('[data-act="eye"]').getAttribute('aria-pressed'), 'true');
  assert.match(h.q('[data-act="notes"]').title, /\(off\)/);
  h.w.localStorage.setItem('cc.bad', '{broken'); assert.equal(h.read('store.get("bad", "fallback")'), 'fallback');
  Object.defineProperty(h.w, 'localStorage', { get() { throw new Error('unavailable'); } });
  assert.equal(h.read('store.get("theme", "fallback")'), 'fallback'); h.click('[data-act="theme"]'); assert.equal(h.read('state.theme'), 'dark');
});

test('notification inside/outside mousedown, Escape, and all-medications-complete content', t => {
  const h = setup(t); h.go('today'); h.click('[data-act="notes"]'); assert.match(h.q('.popover').textContent, /Medication due/);
  h.q('.popover').dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); assert.ok(h.q('.popover'));
  h.q('[data-act="notes"]').dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); assert.ok(h.q('.popover'));
  h.w.document.body.dispatchEvent(new h.w.MouseEvent('mousedown', { bubbles: true })); assert.equal(h.q('.popover'), null);
  h.click('[data-act="notes"]'); h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Escape' })); assert.equal(h.q('.popover'), null);
  h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Enter' }));
  h.read('state.meds.forEach(m => m.status = "taken")'); h.click('[data-act="notes"]'); assert.doesNotMatch(h.q('.popover').textContent, /Medication due/);
});


test('time-dependent greetings and a retained draft rendered after navigation', t => {
  const h = setup(t);
  for (const [hour, expected] of [[9, 'Good morning'], [12, 'Good afternoon'], [18, 'Good evening']]) {
    h.w.Date.prototype.getHours = () => hour;
    h.go('today'); h.read('render()');
    assert.match(h.q('.greet h2').textContent, new RegExp(expected));
  }
  h.go('messages'); h.input('#msg-input', 'keep this draft');
  h.go('schedule'); h.go('messages');
  assert.equal(h.q('#msg-input').value, 'keep this draft');
  assert.equal(h.q('.send').disabled, false);
  assert.equal(h.read('esc(' + JSON.stringify("&<>\"'") + ')'), '&amp;&lt;&gt;&quot;&#39;');
});

test('user-entered text cannot inject markup: initials in avatars and toast messages', t => {
  const h = setup(t); h.go('create');
  h.input('#ca-name', '<img src=x onerror=alert(1)> <b'); h.input('#ca-email', 'x@example.com'); h.input('#ca-pass', 'longenough');
  h.submit('#create-form'); assert.equal(h.read('user.initials'), '<S');
  h.signIn(); h.go('account');
  for (const av of [h.q('.sb-head .avatar'), h.q('.profile .avatar')]) {
    assert.equal(av.textContent, '<S'); assert.equal(av.children.length, 0, 'Rendered as text, not markup');
  }
  h.read(`toast('<img src=x onerror=alert(1)>')`);
  assert.equal(h.q('.toast-msg').textContent, '<img src=x onerror=alert(1)>'); assert.equal(h.q('#toast img'), null);
});
