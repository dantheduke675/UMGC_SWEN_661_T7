const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { setup } = require('./harness.cjs');

// WCAG 2.2 AA checks, grouped by success criterion. Each test walks every
// screen, dialog and panel a user can reach, or checks the stylesheet where
// jsdom cannot render (sizes, motion, reflow).

const CSS = fs.readFileSync(path.resolve(__dirname, '../src/styles.css'), 'utf8');

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

test('ids are unique and every ARIA reference points at an element that exists', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    const d = h.w.document;
    const ids = [...d.querySelectorAll('[id]')].map(el => el.id);
    assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), [], `${view}: duplicate ids`);
    for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
      for (const el of d.querySelectorAll(`[${attr}]`)) {
        for (const id of el.getAttribute(attr).split(/\s+/)) {
          assert.ok(d.getElementById(id), `${view}: ${attr}="${id}" points at nothing — ${el.outerHTML.slice(0, 90)}`);
        }
      }
    }
    for (const label of d.querySelectorAll('label[for]')) {
      assert.ok(d.getElementById(label.htmlFor), `${view}: <label for="${label.htmlFor}"> has no field`);
    }
  }
});

test('ARIA states use valid values and roles that need state have it', t => {
  const h = setup(t);
  const BOOL = ['aria-pressed', 'aria-expanded', 'aria-checked', 'aria-selected', 'aria-modal', 'aria-hidden', 'aria-required', 'aria-invalid'];
  const NEEDS = { switch: 'aria-checked', radio: 'aria-checked', tab: 'aria-selected', progressbar: 'aria-valuenow' };
  for (const view of everyView(h)) {
    for (const attr of BOOL) {
      for (const el of h.w.document.querySelectorAll(`[${attr}]`)) {
        assert.match(el.getAttribute(attr), /^(true|false)$/, `${view}: ${attr} — ${el.outerHTML.slice(0, 90)}`);
      }
    }
    for (const [role, attr] of Object.entries(NEEDS)) {
      for (const el of h.w.document.querySelectorAll(`[role="${role}"]`)) assert.ok(el.hasAttribute(attr), `${view}: role=${role} without ${attr}`);
    }
  }
});

test('one radio and one tab is selected in each group', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const group of h.w.document.querySelectorAll('[role="radiogroup"], [role="tablist"]')) {
      const on = group.querySelectorAll('[aria-checked="true"], [aria-selected="true"]');
      assert.equal(on.length, 1, `${view}: ${group.getAttribute('aria-label') || group.getAttribute('aria-labelledby')}`);
      assert.ok(group.getAttribute('aria-label') || group.getAttribute('aria-labelledby'), `${view}: unnamed group`);
    }
  }
});

// ---------- 2.5.3 Label in Name ----------

test('a control\'s spoken name contains the words shown on it', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll('button[aria-label]')) {
      const name = el.getAttribute('aria-label').toLowerCase();
      for (const word of visibleText(el).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)) {
        assert.ok(name.includes(word), `${view}: shows "${word}" but is named "${name}"`);
      }
    }
  }
});

// ---------- 2.1.1 Keyboard / 2.4.3 Focus Order ----------

test('everything that responds to a click is a real button', t => {
  const h = setup(t);
  const ACTIONS = '[data-act], [data-go], [data-chat], [data-call], [data-day], [data-convo], [data-quick], [data-med-take], [data-med-miss], [data-undo], [data-role], [data-sev]';
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll(ACTIONS)) assert.equal(el.tagName, 'BUTTON', `${view}: ${el.outerHTML.slice(0, 90)}`);
  }
});

test('no positive tabindex: Tab follows the reading order', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll('[tabindex]')) {
      assert.ok(Number(el.getAttribute('tabindex')) <= 0, `${view}: tabindex=${el.getAttribute('tabindex')}`);
    }
  }
});

test('Escape always has somewhere to go back from: dialogs, panels and toasts', t => {
  const h = setup(t); h.signIn();
  h.click('[data-act="notes"]'); h.key('Escape'); assert.equal(h.read('state.panel'), null, 'panel');
  h.click('[data-act="sos"]'); h.key('Escape'); assert.equal(h.q('#modal-root').innerHTML, '', 'dialog');
  h.click('[data-med-take="2"]'); h.key('Escape'); assert.equal(h.toastShown(), false, 'toast');
});

// ---------- 1.3.1 Headings / 2.4.6 Headings and Labels ----------

test('heading levels never skip on any screen, dialog or panel', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    const levels = [...h.w.document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(x => Number(x.tagName[1]));
    assert.ok(levels.length, `${view}: no headings`);
    let prev = 0;
    for (const lvl of levels) {
      assert.ok(lvl <= prev + 1, `${view}: h${prev} is followed by h${lvl} (${levels.join(' ')})`);
      prev = lvl;
    }
  }
});

test('Account sections are headings so they can be jumped to', t => {
  const h = setup(t); h.signIn(); h.go('account');
  const sections = [...h.w.document.querySelectorAll('.acct-grid h2')].map(x => x.textContent);
  assert.deepEqual(sections, ['Profile', 'Care team', 'Keyboard shortcuts', 'Preferences', 'Accessibility', 'App information']);
});

// ---------- 2.4.2 Page Titled ----------

test('every page has its own window title', t => {
  const h = setup(t);
  const titles = new Map();
  for (const screen of ['landing', 'signin', 'create', 'biometrics', 'facescan', 'facesuccess']) {
    h.read(`state.screen = ${JSON.stringify(screen)}; render({ fresh: true })`); titles.set(screen, h.w.document.title);
  }
  h.signIn();
  for (const screen of ['today', 'medications', 'messages', 'schedule', 'symptoms', 'account']) { h.go(screen); titles.set(screen, h.w.document.title); }
  for (const [screen, title] of titles) assert.match(title, /^.+ – CareConnect$/, screen);
  assert.equal(new Set(titles.values()).size, titles.size, 'No two pages share a title');
});

// ---------- 1.4.1 Use of Color ----------

test('status shown in colour is also shown in words', t => {
  const h = setup(t); h.signIn();
  h.click('[data-med-miss="3"]');
  assert.match(h.q('.status-bar.taken').textContent, /Taken/);
  assert.match(h.q('.status-bar.missed').textContent, /Missed/);
  // Unread count, not only a red dot: shown as a number, spoken in the name
  assert.match(h.q('.nav [data-go="messages"] .label').textContent, /\(1\)/, 'Unread count shown');
  assert.match(h.q('.nav [data-go="messages"]').getAttribute('aria-label'), /1 unread/, 'Unread count spoken');
  h.go('symptoms');
  for (const card of h.w.document.querySelectorAll('.sym')) assert.match(card.textContent, /[1-5]\/5/, 'Severity as a number, not only a colour');
  h.go('schedule');
  for (const day of h.w.document.querySelectorAll('[data-day]')) {
    const has = day.querySelector('.dot.has');
    assert.equal(/scheduled/.test(day.getAttribute('aria-label')), !!has, 'The day dot is also in the name');
  }
  h.go('messages');
  assert.match(h.q('[data-convo="AJ"]').getAttribute('aria-label'), /unread/i);
});

// ---------- 1.3.5 Identify Input Purpose / 3.3.2 Labels or Instructions ----------

test('personal fields say what they are for so they can be filled automatically', t => {
  const h = setup(t);
  h.go('signin');
  assert.equal(h.q('#si-email').getAttribute('autocomplete'), 'email');
  assert.equal(h.q('#si-email').type, 'email');
  assert.equal(h.q('#si-pass').getAttribute('autocomplete'), 'current-password');
  h.go('create');
  assert.equal(h.q('#ca-name').getAttribute('autocomplete'), 'name');
  assert.equal(h.q('#ca-email').getAttribute('autocomplete'), 'email');
  assert.equal(h.q('#ca-pass').getAttribute('autocomplete'), 'new-password');
  assert.match(h.q('#ca-pass-hint').textContent, /8 characters/, 'Rule is stated before submitting');
});

test('the message box is not autocompleted and Send says why it is unavailable', t => {
  const h = setup(t); h.signIn(); h.go('messages');
  assert.equal(h.q('#msg-input').getAttribute('autocomplete'), 'off');
  assert.equal(h.q('.send').disabled, true, 'Disabled, so it is skipped by Tab and announced as unavailable');
  h.input('#msg-input', 'Hello');
  assert.equal(h.q('.send').disabled, false);
});

// ---------- 3.3.1 Error Identification / 3.3.3 Error Suggestion ----------

test('each form error says what is wrong and how to fix it, in text', t => {
  const h = setup(t);
  h.go('signin'); h.input('#si-email', 'nope'); h.submit('#signin-form');
  assert.match(h.q('#si-err').textContent, /valid email/);
  h.go('create'); h.input('#ca-name', 'Sam'); h.input('#ca-email', 'sam@example.com'); h.input('#ca-pass', '123'); h.submit('#create-form');
  assert.match(h.q('#ca-err').textContent, /at least 8 characters/);
  h.signIn(); h.go('symptoms'); h.click('[data-act="log-symptom"]'); h.submit('#sym-form');
  assert.match(h.q('#sym-err').textContent, /enter a symptom/);
  assert.equal(h.q('#sym-name').getAttribute('aria-invalid'), 'true');
});

// ---------- 2.4.7 Focus Visible ----------

test('the focus outline is never removed', () => {
  assert.doesNotMatch(CSS, /outline\s*:\s*(none|0)\b/, 'No outline: none / 0');
  assert.doesNotMatch(CSS, /:focus\s*\{[^}]*outline-color\s*:\s*transparent/);
  const rule = CSS.match(/button:focus,[^{]*\{([^}]*)\}/)[1];
  assert.match(rule, /outline:\s*3px solid var\(--focus\)/, 'A 3px ring on every focusable control');
  assert.match(CSS, /\[tabindex\]:not\(\[tabindex="-1"\]\):focus/, 'including focusable cards');
});

// ---------- 2.5.8 Target Size (Minimum) ----------

test('every click target is at least 24 × 24 px', () => {
  const size = (selector, prop) => {
    const block = CSS.match(new RegExp(`(?:^|\\n|\\})\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
    assert.ok(block, `No rule for ${selector}`);
    const m = block[1].match(new RegExp(`(?:^|[;\\s])${prop}:\\s*(\\d+)px`));
    assert.ok(m, `${selector} has no ${prop} in px`);
    return Number(m[1]);
  };
  for (const sel of ['.icon-btn', '.collapse-btn', '.toast-close', '.pop-close', '.zoom-btn', '.msg-btn', '.send', '.theme-fab', '.switch', '.theme-switch']) {
    assert.ok(size(sel, 'width') >= 24, `${sel} width`);
    assert.ok(size(sel, 'height') >= 24, `${sel} height`);
  }
  for (const sel of ['.h-undo', '.sos', '.btn', '.quick button', '.sev-pick button']) assert.ok(size(sel, 'height') >= 24, `${sel} height`);
});

// ---------- 1.4.10 Reflow / 1.4.4 Resize Text ----------

test('zoomed in, the multi-column layouts fall back to one column', () => {
  const block = CSS.match(/@media \(max-width: 1100px\) \{([\s\S]*?)\n\}/)[1];
  for (const sel of ['.two-col', '.med-grid', '.sym-grid', '.acct-grid', '.msg-layout']) {
    assert.match(block, new RegExp(`\\${sel}[^{]*\\{[^}]*grid-template-columns: 1fr`), `${sel} stacks`);
  }
  // Text is sized in rem/em; only emoji icons use px sizes
  for (const [, selector] of CSS.matchAll(/([^{}\n]+)\{[^}]*font-size:\s*\d+px/g)) {
    assert.match(selector, /emoji|logo-tile|face-circle|med-icon|role-card|h-ico|nav|sb-row|theme-fab|appt \.ico|check-circle|rings/, `${selector.trim()} sizes text in px`);
  }
});

// ---------- 2.3.3 Animation from Interactions ----------

test('animations and smooth scrolling stop when the user asks for reduced motion', t => {
  const block = CSS.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  assert.ok(block, 'The stylesheet honours prefers-reduced-motion');
  assert.match(block[1], /animation: none/);
  assert.match(block[1], /transition: none/);

  const h = setup(t); h.signIn();
  h.layout([['#app', [0, 0, 1440, 768]], ['[data-act="voice"]', [1160, 13, 46, 46]], ['[data-act="eye"]', [1220, 13, 46, 46]]]);
  h.q('[data-act="voice"]').focus();
  h.key('ArrowRight');
  assert.equal(h.scrolls.at(-1).intoView.behavior, 'smooth', 'Smooth by default');
  h.w.matchMedia = q => ({ matches: q === '(prefers-reduced-motion: reduce)' });
  h.key('ArrowLeft');
  assert.equal(h.scrolls.at(-1).intoView.behavior, 'auto', 'Instant when reduced motion is on');
});

// ---------- 3.1.1 Language / 4.1.3 Status Messages ----------

test('the page language is set and status messages use live regions', t => {
  const h = setup(t);
  assert.equal(h.w.document.documentElement.lang, 'en');
  assert.equal(h.q('#sr-status').getAttribute('role'), 'status');
  assert.equal(h.q('#sr-status').getAttribute('aria-live'), 'polite');
  assert.equal(h.q('#sr-page').getAttribute('aria-live'), 'polite');
  for (const view of everyView(h)) {
    for (const err of h.w.document.querySelectorAll('.error')) assert.equal(err.getAttribute('role'), 'alert', `${view}: error not announced`);
  }
});

// ---------- 1.1.1 Non-text Content ----------

test('images have text alternatives and icon-only buttons have names', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const img of h.w.document.querySelectorAll('img')) assert.ok(img.hasAttribute('alt'), `${view}: <img> without alt`);
    for (const btn of h.w.document.querySelectorAll('button')) {
      if (visibleText(btn)) continue;
      const name = btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.querySelector('.sr-only')?.textContent;
      assert.ok(name && name.trim(), `${view}: icon-only button without a name — ${btn.outerHTML.slice(0, 90)}`);
    }
  }
});
