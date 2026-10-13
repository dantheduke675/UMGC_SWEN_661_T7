// Jest port of tests/accessibility.test.cjs (the node:test original is kept and still runs with npm test)
const fs = require('node:fs');
const path = require('node:path');
const { setupApp } = require('./jest-harness');

// WCAG 2.2 AA checks, grouped by success criterion. Each test walks every
// screen, dialog and panel a user can reach, or checks the stylesheet where
// jsdom cannot render (sizes, motion, reflow).

const CSS = fs.readFileSync(path.resolve(__dirname, '../../src/styles.css'), 'utf8');

// Every screen, dialog and panel a user can reach
function* everyView(h) {
  for (const screen of ['landing', 'signin', 'create', 'biometrics', 'facescan', 'facesuccess']) {
    h.read(`state.screen = ${JSON.stringify(screen)}; render({ fresh: true })`); yield screen;
  }
  h.signIn();
  for (const screen of ['today', 'medications', 'messages', 'schedule', 'symptoms', 'account']) { h.go(screen); yield screen; }
  h.go('today'); h.click('[data-med-take="2"]'); yield 'today + undo toast';
  h.click('[data-act="history"]'); yield 'history panel';
  h.click('[data-act="notes"]'); yield 'notifications panel';
  h.read('closePanel()');
  h.click('[data-act="sos"]'); yield 'SOS dialog'; h.key('Escape');
  h.go('symptoms'); h.click('[data-act="log-symptom"]'); yield 'symptom dialog'; h.key('Escape');
  h.go('schedule'); h.click('[data-day="3"]'); yield 'empty day';
  h.go('messages'); h.click('[data-call="AJ"]'); yield 'call';
}

// Visible text: what is on screen, without parts hidden from everyone
function visibleText(el) {
  const copy = el.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"], svg, .sr-only').forEach(n => n.remove());
  // Separate text from neighbouring elements, as it is laid out on screen
  const walker = copy.ownerDocument.createTreeWalker(copy, 4 /* NodeFilter.SHOW_TEXT */);
  const parts = [];
  while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

// ---------- 4.1.2 Name, Role, Value / 1.3.1 Info and Relationships ----------

test('ids are unique and every ARIA reference points at an element that exists', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    const d = h.w.document;
    const ids = [...d.querySelectorAll('[id]')].map(el => el.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
      for (const el of d.querySelectorAll(`[${attr}]`)) {
        for (const id of el.getAttribute(attr).split(/\s+/)) {
          expect(d.getElementById(id)).toBeTruthy();
        }
      }
    }
    for (const label of d.querySelectorAll('label[for]')) {
      expect(d.getElementById(label.htmlFor)).toBeTruthy();
    }
  }
});

test('ARIA states use valid values and roles that need state have it', () => {
  const h = setupApp();
  const BOOL = ['aria-pressed', 'aria-expanded', 'aria-checked', 'aria-selected', 'aria-modal', 'aria-hidden', 'aria-required', 'aria-invalid'];
  const NEEDS = { switch: 'aria-checked', radio: 'aria-checked', tab: 'aria-selected', progressbar: 'aria-valuenow' };
  for (const view of everyView(h)) {
    for (const attr of BOOL) {
      for (const el of h.w.document.querySelectorAll(`[${attr}]`)) {
        expect(el.getAttribute(attr)).toMatch(/^(true|false)$/);
      }
    }
    for (const [role, attr] of Object.entries(NEEDS)) {
      for (const el of h.w.document.querySelectorAll(`[role="${role}"]`)) expect(el.hasAttribute(attr)).toBeTruthy();
    }
  }
});

test('one radio and one tab is selected in each group', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    for (const group of h.w.document.querySelectorAll('[role="radiogroup"], [role="tablist"]')) {
      const on = group.querySelectorAll('[aria-checked="true"], [aria-selected="true"]');
      expect(on.length).toBe(1);
      expect(group.getAttribute('aria-label') || group.getAttribute('aria-labelledby')).toBeTruthy();
    }
  }
});

// ---------- 2.5.3 Label in Name ----------

test('a control\'s spoken name contains the words shown on it', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll('button[aria-label]')) {
      const name = el.getAttribute('aria-label').toLowerCase();
      for (const word of visibleText(el).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)) {
        expect(name.includes(word)).toBeTruthy();
      }
    }
  }
});

// ---------- 2.1.1 Keyboard / 2.4.3 Focus Order ----------

test('everything that responds to a click is a real button', () => {
  const h = setupApp();
  const ACTIONS = '[data-act], [data-go], [data-chat], [data-call], [data-day], [data-convo], [data-quick], [data-med-take], [data-med-miss], [data-undo], [data-role], [data-sev]';
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll(ACTIONS)) expect(el.tagName).toBe('BUTTON');
  }
});

test('no positive tabindex: Tab follows the reading order', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex')) <= 0).toBeTruthy();
    }
  }
});

test('Escape always has somewhere to go back from: dialogs, panels and toasts', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-act="notes"]'); h.key('Escape'); expect(h.read('state.panel')).toBe(null);
  h.click('[data-act="sos"]'); h.key('Escape'); expect(h.q('#modal-root').innerHTML).toBe('');
  h.click('[data-med-take="2"]'); h.key('Escape'); expect(h.toastShown()).toBe(false);
});

// ---------- 1.3.1 Headings / 2.4.6 Headings and Labels ----------

test('heading levels never skip on any screen, dialog or panel', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    const levels = [...h.w.document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(x => Number(x.tagName[1]));
    expect(levels.length).toBeTruthy();
    let prev = 0;
    for (const lvl of levels) {
      expect(lvl <= prev + 1).toBeTruthy();
      prev = lvl;
    }
  }
});

test('Account sections are headings so they can be jumped to', () => {
  const h = setupApp(); h.signIn(); h.go('account');
  const sections = [...h.w.document.querySelectorAll('.acct-grid h2')].map(x => x.textContent);
  expect(sections).toEqual(['Profile', 'Care team', 'Keyboard shortcuts', 'Preferences', 'Accessibility', 'App information']);
});

// ---------- 2.4.2 Page Titled ----------

test('every page has its own window title', () => {
  const h = setupApp();
  const titles = new Map();
  for (const screen of ['landing', 'signin', 'create', 'biometrics', 'facescan', 'facesuccess']) {
    h.read(`state.screen = ${JSON.stringify(screen)}; render({ fresh: true })`); titles.set(screen, h.w.document.title);
  }
  h.signIn();
  for (const screen of ['today', 'medications', 'messages', 'schedule', 'symptoms', 'account']) { h.go(screen); titles.set(screen, h.w.document.title); }
  for (const [screen, title] of titles) expect(title).toMatch(/^.+ – CareConnect$/);
  expect(new Set(titles.values()).size).toBe(titles.size);
});

// ---------- 1.4.1 Use of Color ----------

test('status shown in colour is also shown in words', () => {
  const h = setupApp(); h.signIn();
  h.click('[data-med-miss="3"]');
  expect(h.q('.status-bar.taken').textContent).toMatch(/Taken/);
  expect(h.q('.status-bar.missed').textContent).toMatch(/Missed/);
  expect(h.q('.nav [data-go="messages"]').textContent).toMatch(/\(1 unread\)/);
  h.go('symptoms');
  for (const card of h.w.document.querySelectorAll('.sym')) expect(card.textContent).toMatch(/[1-5]\/5/);
  h.go('schedule');
  for (const day of h.w.document.querySelectorAll('[data-day]')) {
    const has = day.querySelector('.dot.has');
    expect(/scheduled/.test(day.getAttribute('aria-label'))).toBe(!!has);
  }
  h.go('messages');
  expect(h.q('[data-convo="AJ"]').getAttribute('aria-label')).toMatch(/unread/i);
});

// ---------- 1.3.5 Identify Input Purpose / 3.3.2 Labels or Instructions ----------

test('personal fields say what they are for so they can be filled automatically', () => {
  const h = setupApp();
  h.go('signin');
  expect(h.q('#si-email').getAttribute('autocomplete')).toBe('email');
  expect(h.q('#si-email').type).toBe('email');
  expect(h.q('#si-pass').getAttribute('autocomplete')).toBe('current-password');
  h.go('create');
  expect(h.q('#ca-name').getAttribute('autocomplete')).toBe('name');
  expect(h.q('#ca-email').getAttribute('autocomplete')).toBe('email');
  expect(h.q('#ca-pass').getAttribute('autocomplete')).toBe('new-password');
  expect(h.q('#ca-pass-hint').textContent).toMatch(/8 characters/);
});

test('the message box is not autocompleted and Send says why it is unavailable', () => {
  const h = setupApp(); h.signIn(); h.go('messages');
  expect(h.q('#msg-input').getAttribute('autocomplete')).toBe('off');
  expect(h.q('.send').disabled).toBe(true);
  h.input('#msg-input', 'Hello');
  expect(h.q('.send').disabled).toBe(false);
});

// ---------- 3.3.1 Error Identification / 3.3.3 Error Suggestion ----------

test('each form error says what is wrong and how to fix it, in text', () => {
  const h = setupApp();
  h.go('signin'); h.input('#si-email', 'nope'); h.submit('#signin-form');
  expect(h.q('#si-err').textContent).toMatch(/valid email/);
  h.go('create'); h.input('#ca-name', 'Sam'); h.input('#ca-email', 'sam@example.com'); h.input('#ca-pass', '123'); h.submit('#create-form');
  expect(h.q('#ca-err').textContent).toMatch(/at least 8 characters/);
  h.signIn(); h.go('symptoms'); h.click('[data-act="log-symptom"]'); h.submit('#sym-form');
  expect(h.q('#sym-err').textContent).toMatch(/enter a symptom/);
  expect(h.q('#sym-name').getAttribute('aria-invalid')).toBe('true');
});

// ---------- 2.4.7 Focus Visible ----------

test('the focus outline is never removed', () => {
  expect(CSS).not.toMatch(/outline\s*:\s*(none|0)\b/);
  expect(CSS).not.toMatch(/:focus\s*\{[^}]*outline-color\s*:\s*transparent/);
  const rule = CSS.match(/button:focus,[^{]*\{([^}]*)\}/)[1];
  expect(rule).toMatch(/outline:\s*3px solid var\(--focus\)/);
  expect(CSS).toMatch(/\[tabindex\]:not\(\[tabindex="-1"\]\):focus/);
});

// ---------- 2.5.8 Target Size (Minimum) ----------

test('every click target is at least 24 × 24 px', () => {
  const size = (selector, prop) => {
    const block = CSS.match(new RegExp(`(?:^|\\n|\\})\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
    expect(block).toBeTruthy();
    const m = block[1].match(new RegExp(`(?:^|[;\\s])${prop}:\\s*(\\d+)px`));
    expect(m).toBeTruthy();
    return Number(m[1]);
  };
  for (const sel of ['.icon-btn', '.collapse-btn', '.toast-close', '.pop-close', '.zoom-btn', '.msg-btn', '.send', '.theme-fab', '.switch', '.theme-switch']) {
    expect(size(sel, 'width') >= 24).toBeTruthy();
    expect(size(sel, 'height') >= 24).toBeTruthy();
  }
  for (const sel of ['.h-undo', '.sos', '.btn', '.quick button', '.sev-pick button']) expect(size(sel, 'height') >= 24).toBeTruthy();
});

// ---------- 1.4.10 Reflow / 1.4.4 Resize Text ----------

test('zoomed in, the multi-column layouts fall back to one column', () => {
  const block = CSS.match(/@media \(max-width: 1100px\) \{([\s\S]*?)\n\}/)[1];
  for (const sel of ['.two-col', '.med-grid', '.sym-grid', '.acct-grid', '.msg-layout']) {
    expect(block).toMatch(new RegExp(`\\${sel}[^{]*\\{[^}]*grid-template-columns: 1fr`));
  }
  // Text is sized in rem/em; only emoji icons use px sizes
  for (const [, selector] of CSS.matchAll(/([^{}\n]+)\{[^}]*font-size:\s*\d+px/g)) {
    expect(selector).toMatch(/emoji|logo-tile|face-circle|med-icon|role-card|h-ico|nav|sb-row|theme-fab|appt \.ico|check-circle|rings/);
  }
});

// ---------- 2.3.3 Animation from Interactions ----------

test('animations and smooth scrolling stop when the user asks for reduced motion', () => {
  const block = CSS.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  expect(block).toBeTruthy();
  expect(block[1]).toMatch(/animation: none/);
  expect(block[1]).toMatch(/transition: none/);

  const h = setupApp(); h.signIn();
  h.layout([['#app', [0, 0, 1440, 768]], ['[data-act="voice"]', [1160, 13, 46, 46]], ['[data-act="eye"]', [1220, 13, 46, 46]]]);
  h.q('[data-act="voice"]').focus();
  h.key('ArrowRight');
  expect(h.scrolls.at(-1).intoView.behavior).toBe('smooth');
  h.w.matchMedia = q => ({ matches: q === '(prefers-reduced-motion: reduce)' });
  h.key('ArrowLeft');
  expect(h.scrolls.at(-1).intoView.behavior).toBe('auto');
});

// ---------- 3.1.1 Language / 4.1.3 Status Messages ----------

test('the page language is set and status messages use live regions', () => {
  const h = setupApp();
  expect(h.w.document.documentElement.lang).toBe('en');
  expect(h.q('#toast [role="status"]').getAttribute('aria-live')).toBe('polite');
  expect(h.q('#sr-page').getAttribute('aria-live')).toBe('polite');
  for (const view of everyView(h)) {
    for (const err of h.w.document.querySelectorAll('.error')) expect(err.getAttribute('role')).toBe('alert');
  }
});

// ---------- 1.1.1 Non-text Content ----------

test('images have text alternatives and icon-only buttons have names', () => {
  const h = setupApp();
  for (const view of everyView(h)) {
    for (const img of h.w.document.querySelectorAll('img')) expect(img.hasAttribute('alt')).toBeTruthy();
    for (const btn of h.w.document.querySelectorAll('button')) {
      if (visibleText(btn)) continue;
      const name = btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.querySelector('.sr-only')?.textContent;
      expect(name && name.trim()).toBeTruthy();
    }
  }
});
