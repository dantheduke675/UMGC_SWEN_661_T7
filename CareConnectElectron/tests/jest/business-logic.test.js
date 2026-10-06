// Business-logic tests (Jest). These call the app's own functions directly
// where they are pure, and drive the UI only where the rule lives in it.
const { setupApp } = require('./jest-harness');

const taken = h => h.read('state.meds.filter(m => m.status === "taken").length');

describe('medication progress', () => {
  test('starts at 2 of 9 taken (22%)', () => {
    const h = setupApp();
    expect(h.read('medCounts()')).toEqual({ total: 9, taken: 2, missed: 0, pct: 22 });
  });

  test.each([
    [0, 0], [1, 11], [3, 33], [5, 56], [8, 89], [9, 100]
  ])('%i of 9 taken rounds to %i%%', (n, pct) => {
    const h = setupApp();
    h.read(`state.meds.forEach((m, i) => { m.status = i < ${n} ? 'taken' : null })`);
    expect(h.read('medCounts().pct')).toBe(pct);
  });

  test('missed doses are counted separately and never raise the percentage', () => {
    const h = setupApp();
    h.read(`state.meds.forEach(m => { if (!m.status) m.status = 'missed' })`);
    expect(h.read('medCounts()')).toEqual({ total: 9, taken: 2, missed: 7, pct: 22 });
  });

  test('summary card and medication stats show the same numbers', () => {
    const h = setupApp(); h.signIn();
    h.click('[data-med-take="2"]'); h.click('[data-med-miss="3"]');
    expect(h.q('.summary .count').textContent).toBe('3 of 9 taken');
    expect(h.q('.summary .pct').textContent).toBe('33%');
    h.go('medications');
    expect([...h.w.document.querySelectorAll('.stat .n')].map(n => n.textContent)).toEqual(['9', '3', '1']);
  });
});

describe('recording a dose', () => {
  test('setting the same status twice is a no-op and adds no history', () => {
    const h = setupApp(); h.signIn();
    h.read(`setMed(2, 'taken')`); h.read(`setMed(2, 'taken')`);
    expect(h.read('actionLog.length')).toBe(1);
    expect(taken(h)).toBe(3);
  });

  test('unknown medication ids are ignored', () => {
    const h = setupApp(); h.signIn();
    h.read(`setMed(999, 'taken')`);
    expect(h.read('actionLog.length')).toBe(0);
    expect(taken(h)).toBe(2);
  });

  test('history labels name the medication, its time and the new status', () => {
    const h = setupApp(); h.signIn();
    h.read(`setMed(5, 'missed')`); h.read(`setMed(1, null)`);
    expect(h.read('actionLog.map(a => a.label)')).toEqual([
      'Marked Loratadip / Carbiopa (8:00 PM) as missed',
      'Cleared Ropivacaine (8:00 AM)'
    ]);
  });

  test('a missed dose tells the user the care team will be notified', () => {
    const h = setupApp(); h.signIn();
    h.click('[data-med-miss="2"]');
    expect(h.q('.toast-msg').textContent).toBe('Marked as missed. Your care team will be notified.');
  });
});

describe('symptom severity', () => {
  test.each([[1, 'sev-low'], [2, 'sev-low'], [3, 'sev-mid'], [4, 'sev-high'], [5, 'sev-high']])(
    'severity %i is %s', (sev, cls) => {
      const h = setupApp();
      expect(h.read(`sevClass(${sev})`)).toBe(cls);
    });

  test('cards fill one bar per severity point', () => {
    const h = setupApp(); h.signIn(); h.go('symptoms');
    const cards = [...h.w.document.querySelectorAll('.sym')];
    expect(cards.map(c => c.querySelectorAll('.bars .on').length)).toEqual([2, 3, 4, 2]);
    expect(cards.map(c => c.querySelector('.sev-pill').textContent)).toEqual(['2/5', '3/5', '4/5', '2/5']);
  });

  test('a new log goes to the top and undoing it leaves later logs alone', () => {
    const h = setupApp(); h.signIn(); h.go('symptoms');
    for (const name of ['Headache', 'Cough']) {
      h.click('[data-act="log-symptom"]'); h.input('#sym-name', name); h.submit('#sym-form');
    }
    expect(h.read('state.symptoms.slice(0, 2).map(s => s.name)')).toEqual(['Cough', 'Headache']);
    h.read('undoAction(1)');
    expect(h.read('state.symptoms.map(s => s.name)')).toEqual(['Cough', 'Pain', 'Fatigue', 'Dizziness', 'Nausea']);
  });
});

describe('greeting by time of day', () => {
  test.each([
    [0, 'Good morning'], [11, 'Good morning'], [12, 'Good afternoon'],
    [17, 'Good afternoon'], [18, 'Good evening'], [23, 'Good evening']
  ])('%i:00 -> %s', (hour, greeting) => {
    const h = setupApp();
    h.w.Date.prototype.getHours = () => hour;
    h.signIn();
    expect(h.q('.greet h2').textContent).toMatch(greeting);
  });
});

describe('account rules', () => {
  test.each([
    ['a@b.co', true], ['first.last@sub.example.org', true],
    ['', false], ['plain', false], ['a@b', false], ['a b@c.de', false], ['@b.co', false]
  ])('sign-in accepts email %j: %s', (email, ok) => {
    const h = setupApp(); h.go('signin');
    h.input('#si-email', email); h.submit('#signin-form');
    expect(h.read('state.screen')).toBe(ok ? 'today' : 'signin');
  });

  test.each([['1234567', false], ['12345678', true]])('password %j long enough: %s', (pass, ok) => {
    const h = setupApp(); h.go('create');
    h.input('#ca-name', 'Sam Lee'); h.input('#ca-email', 'sam@example.com'); h.input('#ca-pass', pass);
    h.submit('#create-form');
    expect(h.read('state.screen')).toBe(ok ? 'biometrics' : 'create');
  });

  test.each([
    ['Cher', 'Cher', 'C'],
    ['mary ann smith', 'mary', 'MA'],
    ['  José   García ', 'José', 'JG']
  ])('name %j -> first name %j, initials %j', (name, first, initials) => {
    const h = setupApp(); h.go('create');
    h.input('#ca-name', name); h.input('#ca-email', 'x@example.com'); h.input('#ca-pass', 'longenough');
    h.submit('#create-form');
    expect(h.read('user.first')).toBe(first);
    expect(h.read('user.initials')).toBe(initials);
  });
});

describe('escaping and storage', () => {
  test('esc neutralises every HTML-significant character and coerces values', () => {
    const h = setupApp();
    const esc = h.read('esc');
    expect(esc(`<a href="x" onclick='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    expect(esc(42)).toBe('42');
    expect(esc('plain text')).toBe('plain text');
  });

  test('store namespaces keys under cc. and round-trips JSON', () => {
    const h = setupApp();
    h.read(`store.set('thing', { a: [1, 2] })`);
    expect(h.w.localStorage.getItem('cc.thing')).toBe('{"a":[1,2]}');
    expect(h.read(`store.get('thing', null)`)).toEqual({ a: [1, 2] });
    expect(h.read(`store.get('missing', 'fallback')`)).toBe('fallback');
  });

  test('a failing write is swallowed', () => {
    const h = setupApp();
    h.w.localStorage.setItem = () => { throw new Error('quota'); };
    expect(() => h.read(`store.set('x', 1)`)).not.toThrow();
  });

  test('only some settings are remembered between launches', () => {
    const h = setupApp(); h.signIn(); h.go('account');
    h.click('[data-act="biometric"]'); h.click('[data-act="reminders"]'); h.click('[data-act="toggle-notifications"]');
    expect(h.w.localStorage.getItem('cc.biometric')).toBeNull();
    expect(h.w.localStorage.getItem('cc.reminders')).toBeNull();
    expect(h.w.localStorage.getItem('cc.notifications')).toBe('false');
  });
});

describe('schedule', () => {
  test('counts every appointment in the week', () => {
    const h = setupApp(); h.signIn(); h.go('schedule');
    expect(h.q('.page-head p').textContent).toBe('6 appointments this week');
  });

  test('only days with appointments get a dot, and each day shows its own count', () => {
    const h = setupApp(); h.signIn(); h.go('schedule');
    const dots = [...h.w.document.querySelectorAll('.day .dot')].map(d => d.classList.contains('has'));
    expect(dots).toEqual([true, true, true, false, true, false, false]);
    const counts = [];
    for (let i = 0; i < 7; i++) { h.click(`[data-day="${i}"]`); counts.push(h.q('.day-title .chip').textContent); }
    expect(counts).toEqual(['1 scheduled', '1 scheduled', '2 scheduled', '0 scheduled', '2 scheduled', '0 scheduled', '0 scheduled']);
  });
});

describe('notifications', () => {
  const due = h => { h.click('[data-act="notes"]'); const t = h.q('.popover').textContent; h.click('.pop-close'); return t; };

  test('the medication due is the first one not yet recorded', () => {
    const h = setupApp(); h.signIn();
    expect(due(h)).toMatch('Ropivacaine 10 mg at 8:00 PM');
    h.click('[data-med-take="2"]');
    expect(due(h)).toMatch('Loratadip / Carbiopa 25 mg / 100 mg at 7:00 AM');
    h.click('[data-med-miss="3"]');
    expect(due(h)).toMatch('at 12:00 PM');
  });

  test('turning notifications off hides their content', () => {
    const h = setupApp(); h.signIn();
    h.read('toggleNotifications()');
    const text = due(h);
    expect(text).toMatch('Notifications are turned off');
    expect(text).not.toMatch('Medication due');
  });
});

describe('messages', () => {
  test('unread count falls as conversations are opened', () => {
    const h = setupApp(); h.signIn();
    expect(h.q('.nav [data-go="messages"]').textContent).toMatch('Messages (1 unread)'); // "unread" is screen-reader only
    h.click('[data-chat="AJ"]');
    expect(h.q('.unread-count').textContent).toBe('0 unread conversations');
    h.read(`state.convos[1].unread = true; state.convos[2].unread = true; render()`);
    expect(h.q('.unread-count').textContent).toBe('2 unread conversations');
  });

  test.each([
    ['x'.repeat(32), 'x'.repeat(32)],
    ['x'.repeat(33), 'x'.repeat(32) + '…']
  ])('history preview keeps 32 characters', (text, preview) => {
    const h = setupApp(); h.signIn(); h.go('messages');
    h.read(`sendMessage(${JSON.stringify(text)})`);
    expect(h.read('actionLog[0].label')).toBe(`Sent "${preview}" to Aunt Joyce`);
  });

  test('blank messages are not sent or recorded', () => {
    const h = setupApp(); h.signIn(); h.go('messages');
    h.read(`sendMessage('   ')`);
    expect(h.read('actionLog.length')).toBe(0);
  });

  test('unsending an older message (same minute) keeps the newer message time', () => {
    const h = setupApp(); h.signIn(); h.go('messages');
    expect(h.read('state.convos[0].time')).toBe('10:30 AM');
    h.read(`sendMessage('first')`); h.read(`sendMessage('second')`);
    h.read('undoAction(1)');
    expect(h.read('state.convos[0].messages.at(-1).text')).toBe('second');
    expect(h.read('state.convos[0].time')).toBe('9:10 AM');
    h.read('undoAction(2)');
    expect(h.read('state.convos[0].time')).toBe('10:30 AM');
  });
});

describe('undo engine', () => {
  test('entries get increasing ids, the time and the page they happened on', () => {
    const h = setupApp(); h.signIn();
    h.click('[data-med-take="2"]');
    h.go('account'); h.click('[data-act="share"]');
    expect(h.read('actionLog.map(a => [a.id, a.where, a.time])')).toEqual([[1, 'Today', '9:10 AM'], [2, 'Account', '9:10 AM']]);
    h.read('state.screen = "call"');
    expect(h.read('screenLabel()')).toBe('CareConnect');
  });

  test('irreversible and already-undone entries are never undoable', () => {
    const h = setupApp(); h.signIn();
    h.read(`record('Sent an alert', '🚨')`);
    h.click('[data-med-take="2"]'); h.click('.toast-undo');
    expect(h.read('actionLog.map(canUndo)')).toEqual([false, false]);
  });

  test('a later change to the same thing supersedes; other things do not', () => {
    const h = setupApp(); h.signIn();
    h.read('toggleReminders()'); h.read('toggleShare()'); h.read('toggleReminders()');
    expect(h.read('actionLog.map(canUndo)')).toEqual([false, true, true]);
    h.read('undoAction(3)');
    expect(h.read('actionLog.map(canUndo)')).toEqual([true, true, false]);
  });

  test('entries without a target (symptoms, messages) never supersede each other', () => {
    const h = setupApp(); h.signIn(); h.go('messages');
    h.read(`sendMessage('one')`); h.read(`sendMessage('two')`);
    expect(h.read('actionLog.map(canUndo)')).toEqual([true, true]);
  });

  test('Ctrl+U targets the action in the visible toast first', () => {
    const h = setupApp(); h.signIn();
    h.read('toggleReminders()'); h.read('toggleShare()');
    h.read(`toast('Medication reminders turned off', { undo: actionLog[0] })`);
    h.ctrl('u');
    expect(h.read('state.reminders')).toBe(true);
    expect(h.read('state.shareData')).toBe(false);
  });

  test('undoing an unknown id says there is nothing to undo', () => {
    const h = setupApp(); h.signIn();
    h.read('undoAction(123)');
    expect(h.toastText()).toMatch('Nothing to undo');
  });

  test('the badge counts only what can still be undone', () => {
    const h = setupApp(); h.signIn();
    h.click('[data-med-take="2"]'); h.click('[data-med-take="3"]');
    h.read(`record('Sent an alert', '🚨'); render()`);
    expect(h.q('.hb-count').textContent).toBe('2');
    h.ctrl('u');
    expect(h.q('.hb-count').textContent).toBe('1');
  });
});

describe('zoom steps', () => {
  const api = () => { const z = { f: 1, getZoom: () => z.f, setZoom: v => { z.f = v; } }; return z; };

  test('stepping up from 80% visits every level to 200%', () => {
    const z = api(); const h = setupApp({}, { zoomApi: z });
    z.f = 0.8;
    const seen = [];
    for (let i = 0; i < 8; i++) { h.read('zoomStep(1)'); seen.push(z.f); }
    expect(seen).toEqual([0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2]);
  });

  test('stepping down from 200% visits every level to 80%', () => {
    const z = api(); const h = setupApp({}, { zoomApi: z });
    z.f = 2;
    const seen = [];
    for (let i = 0; i < 8; i++) { h.read('zoomStep(-1)'); seen.push(z.f); }
    expect(seen).toEqual([1.75, 1.5, 1.25, 1.1, 1, 0.9, 0.8, 0.8]);
  });

  test('the announced percentage is rounded', () => {
    const z = api(); const h = setupApp({}, { zoomApi: z });
    h.read('setZoom(1.25)'); expect(h.toastText()).toMatch('Zoom 125%');
    z.f = 1.333; h.read('zoomStep(10)'); expect(h.toastText()).toMatch('Zoom 150%');
  });
});

describe('keyboard rules', () => {
  const field = (props = {}) => ({ tagName: 'INPUT', type: 'text', value: 'abcd', selectionStart: 2, selectionEnd: 2, list: null, ...props });

  test('which elements count as text fields', () => {
    const h = setupApp();
    const isTextField = h.read('isTextField');
    for (const type of ['text', 'email', 'password', 'search', 'tel', 'url', 'number']) expect(isTextField({ tagName: 'INPUT', type })).toBe(true);
    for (const type of ['checkbox', 'radio', 'button', 'submit', 'range']) expect(isTextField({ tagName: 'INPUT', type })).toBe(false);
    expect(isTextField({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTextField({ tagName: 'BUTTON' })).toBe(false);
    expect(isTextField(null)).toBe(false);
  });

  test.each([
    ['WASD never leaves a field', 'w', field(), false],
    ['Up leaves a single-line field', 'ArrowUp', field(), true],
    ['Down leaves a single-line field', 'ArrowDown', field(), true],
    ['Down stays in a field with suggestions', 'ArrowDown', field({ list: {} }), false],
    ['Left with caret mid-text stays', 'ArrowLeft', field(), false],
    ['Left with caret at start leaves', 'ArrowLeft', field({ selectionStart: 0, selectionEnd: 0 }), true],
    ['Left with a selection from the start stays', 'ArrowLeft', field({ selectionStart: 0, selectionEnd: 3 }), false],
    ['Right with caret at end leaves', 'ArrowRight', field({ selectionStart: 4, selectionEnd: 4 }), true],
    ['Email fields keep left/right', 'ArrowRight', field({ type: 'email', selectionStart: null }), false],
    ['Textarea Up mid-text stays', 'ArrowUp', field({ tagName: 'TEXTAREA' }), false],
    ['Textarea Up at start leaves', 'ArrowUp', field({ tagName: 'TEXTAREA', selectionStart: 0, selectionEnd: 0 }), true],
    ['Textarea Down at end leaves', 'ArrowDown', field({ tagName: 'TEXTAREA', selectionStart: 4, selectionEnd: 4 }), true],
    ['Any key leaves a non-field', 'd', { tagName: 'BUTTON' }, true]
  ])('%s', (_, key, el, leaves) => {
    const h = setupApp();
    expect(h.read('arrowLeavesField')({ key }, el)).toBe(leaves);
  });

  test('arrow keys and WASD map to the four directions', () => {
    const h = setupApp();
    expect(h.read('DIRS')).toEqual({ arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', w: 'up', s: 'down', a: 'left', d: 'right' });
  });

  test('distance to a control is measured to its nearest edge', () => {
    const h = setupApp();
    const rectDistance = h.read('rectDistance');
    const r = { left: 100, top: 100, right: 200, bottom: 150 };
    expect(rectDistance(r, 150, 120)).toBe(0);
    expect(rectDistance(r, 50, 120)).toBe(50);
    expect(rectDistance(r, 230, 190)).toBe(50);
    const el = (left, top) => ({ getBoundingClientRect: () => ({ left, top, right: left + 10, bottom: top + 10 }) });
    const near = el(0, 0), far = el(500, 500);
    expect(h.read('nearestTo')([far, near], 20, 0)).toBe(near);
    expect(h.read('nearestTo')([far, near], 300, 300, 100)).toBeNull();
  });

  test('a container can scroll only while it has room in that direction', () => {
    const h = setupApp();
    const canScroll = h.read('canScroll');
    expect(canScroll({ scrollTop: 0, clientHeight: 100, scrollHeight: 300 }, 1)).toBe(true);
    expect(canScroll({ scrollTop: 0, clientHeight: 100, scrollHeight: 300 }, -1)).toBe(false);
    expect(canScroll({ scrollTop: 200, clientHeight: 100, scrollHeight: 300 }, 1)).toBe(false);
    expect(canScroll({ scrollTop: 200, clientHeight: 100, scrollHeight: 300 }, -1)).toBe(true);
  });

  test('a control is recognised across re-renders by its tag, id, data and label', () => {
    const h = setupApp();
    const make = html => { const d = h.w.document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
    const focusKey = h.read('focusKey');
    expect(focusKey(make('<button data-act="theme" aria-label="Dark mode" class="a">x</button>')))
      .toBe(focusKey(make('<button aria-label="Dark mode" data-act="theme" class="b">y</button>')));
    expect(focusKey(make('<button data-med-take="2"></button>'))).not.toBe(focusKey(make('<button data-med-take="3"></button>')));
    expect(focusKey(make('<button data-go="x"></button>'))).not.toBe(focusKey(make('<a data-go="x"></a>')));
  });

  test('moving focus prefers a lined-up control over a closer diagonal one', () => {
    const h = setupApp();
    const doc = h.w.document;
    doc.body.insertAdjacentHTML('beforeend', '<button id="cur"></button><button id="below"></button><button id="diag"></button><button id="right"></button>');
    h.layout([
      ['#cur', [0, 0, 100, 50]],
      ['#below', [0, 300, 100, 50]],
      ['#diag', [300, 80, 100, 50]],
      ['#right', [400, 10, 100, 30]]
    ]);
    const best = (id, dir) => h.read('bestCandidate')(doc.getElementById(id), dir)?.id;
    expect(best('cur', 'down')).toBe('below');
    expect(best('cur', 'right')).toBe('diag');
    expect(best('below', 'up')).toBe('cur');
    expect(best('cur', 'up')).toBeUndefined();
    expect(best('diag', 'left')).toBe('cur');
  });

  test('every Ctrl shortcut appears in the on-screen shortcut list', () => {
    const h = setupApp();
    const listed = h.read('SHORTCUTS.map(s => s[0])');
    for (const key of Object.keys(h.read('CTRL_SHORTCUTS'))) {
      expect(listed).toContain(`Ctrl ${key.toUpperCase()}`);
    }
    for (const zoomKey of ['Ctrl +', 'Ctrl -', 'Ctrl 0']) expect(listed).toContain(zoomKey);
  });

  test('keycaps render one per key, with "or" between alternatives', () => {
    const h = setupApp();
    const d = h.w.document.createElement('div');
    d.innerHTML = h.read('kbd')('↑ ↓ / W S');
    expect([...d.querySelectorAll('kbd')].map(k => k.textContent)).toEqual(['↑', '↓', 'W', 'S']);
    expect(d.querySelectorAll('.or').length).toBe(1);
    d.innerHTML = h.read('kbd')('Ctrl \\');
    expect([...d.querySelectorAll('kbd')].map(k => k.textContent)).toEqual(['Ctrl', '\\']);
  });
});
