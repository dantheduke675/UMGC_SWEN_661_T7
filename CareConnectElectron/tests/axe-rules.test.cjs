const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { setup } = require('./harness.cjs');

// The rules axe-core checks that the other suites did not, run on every
// screen, dialog and panel in jsdom so they fail fast without Electron.
// npm run test:axe runs axe itself in the real renderer, in dark, light and
// High Contrast.

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
  h.read('stopCall(); signOut()'); yield 'signed out';
}

// Text drawn on screen, as axe sees it: aria-hidden text still counts (it is
// visible), but icons and visually hidden screen-reader text do not
function shownText(el) {
  const copy = el.cloneNode(true);
  copy.querySelectorAll('svg, .sr-only, [hidden]').forEach(n => n.remove());
  return copy.textContent.replace(/\s+/g, ' ').trim();
}
const words = text => (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
const containsPhrase = (haystack, needle) =>
  haystack.some((_, i) => needle.every((w, j) => haystack[i + j] === w));

const LANDMARKS = 'main, nav, header, aside, footer, [role="region"][aria-label], [role="dialog"], [role="alertdialog"], [role="status"], [aria-live]';

// ---------- 1.3.1 Info and Relationships: landmarks (axe: landmark-one-main, region) ----------

test('every screen, signed in or not, has exactly one main landmark', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    assert.equal(h.w.document.querySelectorAll('main, [role="main"]').length, 1, `${view}: one <main>`);
  }
});

test('the sign-in screens and the call screen are the main content themselves', t => {
  const h = setup(t);
  for (const [screen, cls] of [['landing', 'auth'], ['signin', 'auth'], ['create', 'auth'], ['biometrics', 'auth'], ['facescan', 'scan'], ['facesuccess', 'scan']]) {
    h.read(`state.screen = ${JSON.stringify(screen)}; render({ fresh: true })`);
    assert.equal(h.q('#app > main')?.className, cls, `${screen}: <main class="${cls}">`);
  }
  h.signIn(); h.go('messages'); h.click('[data-call="AJ"]');
  assert.equal(h.q('#app > main')?.className, 'call');
});

test('all visible text sits inside a landmark, dialog or live region', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    const d = h.w.document;
    const walker = d.createTreeWalker(d.body, 4 /* NodeFilter.SHOW_TEXT */);
    while (walker.nextNode()) {
      const node = walker.currentNode, el = node.parentElement;
      if (!node.nodeValue.trim() || el.closest('script, style, [hidden], [aria-hidden="true"]')) continue;
      assert.ok(el.closest(LANDMARKS), `${view}: "${node.nodeValue.trim()}" is outside every landmark — ${el.outerHTML.slice(0, 90)}`);
    }
  }
});

test('the toast, with its Undo and close buttons, is a named region', t => {
  const h = setup(t); h.signIn(); h.click('[data-med-take="2"]');
  const toast = h.q('#toast');
  assert.equal(toast.getAttribute('role'), 'region');
  assert.equal(toast.getAttribute('aria-label'), 'Notification');
  assert.ok(toast.querySelector('[data-act="toast-undo"]'), 'Undo is inside the region');
  assert.equal(toast.querySelector('[role="status"]').getAttribute('aria-live'), 'polite', 'the message is still announced');
});

// ---------- 2.5.3 Label in Name (axe: label-content-name-mismatch) ----------

test('a named control\'s visible text appears, in order, as one phrase of its name', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll('button[aria-label], [role="tab"][aria-label], [role="radio"][aria-label], [role="switch"][aria-label]')) {
      const shown = words(shownText(el));
      if (!shown.length) continue; // icon-only: the name is the only label
      const name = words(el.getAttribute('aria-label'));
      assert.ok(containsPhrase(name, shown), `${view}: shows "${shownText(el)}" but is named "${el.getAttribute('aria-label')}"`);
    }
  }
});

test('day tabs are named by the day and date printed on them', t => {
  const h = setup(t); h.signIn(); h.go('schedule');
  for (const tab of h.w.document.querySelectorAll('[role="tab"]')) {
    const shown = `${tab.querySelector('.dow').textContent} ${tab.querySelector('.num').textContent}`;
    assert.ok(tab.getAttribute('aria-label').toLowerCase().startsWith(shown.toLowerCase()), `"${tab.getAttribute('aria-label')}" starts with "${shown}"`);
  }
  // Separate words on screen too, so "MON 28" is not read as "MON28"
  assert.match(shownText(h.q('#day-tab-0')), /^MON 28$/);
});

test('conversation names follow the card: unread, name, time, role, then the last message', t => {
  const h = setup(t); h.signIn();
  h.read('state.convos[1].unread = true'); h.go('messages');
  const sc = h.q('[data-convo="SC"]');
  assert.match(sc.getAttribute('aria-label'), /^Unread, Dr\. Sarah Chen, \w+, Physician: /);
  // The avatar initials are drawn by CSS, so they are not part of the button's text
  for (const av of h.w.document.querySelectorAll('.convo .avatar')) {
    assert.equal(av.textContent, '', 'no initials in the DOM');
    assert.ok(av.dataset.initials, 'initials come from data-initials');
  }
  assert.match(CSS, /\.convo \.avatar::before\s*\{\s*content:\s*attr\(data-initials\)/);
});

// ---------- 4.1.2 Name, Role, Value (axe: aria-allowed-role) ----------

test('dialog roles sit on plain containers, never on a form or control', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll('[role="dialog"], [role="alertdialog"]')) {
      assert.ok(['DIV', 'SECTION'].includes(el.tagName), `${view}: role=${el.getAttribute('role')} on <${el.tagName.toLowerCase()}>`);
    }
    for (const form of h.w.document.querySelectorAll('form[role]')) {
      assert.ok(['search', 'none', 'presentation'].includes(form.getAttribute('role')), `${view}: <form role="${form.getAttribute('role')}">`);
    }
  }
});

test('the symptom form lives inside its dialog, which is named by its heading', t => {
  const h = setup(t); h.signIn(); h.go('symptoms'); h.click('[data-act="log-symptom"]');
  const dialog = h.q('#sym-form').closest('[role="dialog"]');
  assert.ok(dialog, 'form is inside the dialog');
  assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.equal(h.w.document.getElementById(dialog.getAttribute('aria-labelledby')).textContent, 'Log a symptom');
});

// ---------- 1.4.3 Contrast: content axe can measure ----------

// Keycaps such as "+" are key names; arrows are covered below
test('no button shows only symbols or emoji: its text must be words, or an icon', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const el of h.w.document.querySelectorAll('button')) {
      const shown = shownText(el);
      assert.ok(!shown || words(shown).length, `${view}: button shows only "${shown}" — ${el.outerHTML.slice(0, 90)}`);
    }
  }
});

test('arrow keycaps are icons with a spoken name', t => {
  const h = setup(t); h.signIn(); h.go('account');
  const arrows = [...h.w.document.querySelectorAll('.shortcuts kbd')].filter(k => k.querySelector('svg'));
  assert.equal(arrows.length, 6, '↑ ↓ ← → in the first row, ← → in the third');
  for (const k of arrows) {
    assert.equal(k.querySelector('svg').getAttribute('aria-hidden'), 'true');
    assert.match(k.querySelector('.sr-only').textContent, /^(Up|Down|Left|Right) arrow$/);
    assert.doesNotMatch(k.textContent, /[↑↓←→]/, 'no bare arrow symbol');
  }
});

test('the theme button and message buttons use icons, not emoji', t => {
  const h = setup(t);
  for (const theme of ['dark', 'light']) {
    h.read(`state.theme = '${theme}'; state.screen = 'landing'; render({ fresh: true })`);
    const fab = h.q('.theme-fab');
    assert.ok(fab.querySelector('svg'), `${theme}: icon`);
    assert.equal(shownText(fab), '', `${theme}: no emoji text`);
    assert.equal(fab.getAttribute('aria-label'), `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }
  h.signIn();
  for (const btn of h.w.document.querySelectorAll('[data-chat]')) {
    assert.ok(btn.querySelector('svg'), 'icon'); assert.equal(shownText(btn), '');
  }
});

test('text is never laid over a gradient, so its contrast can be measured', () => {
  assert.doesNotMatch(CSS, /gradient\(/);
  const call = CSS.match(/^\.call \{([^}]*)\}/m)[1];
  assert.match(call, /background:\s*#[0-9a-f]{3,6};/i, 'call screen has a solid background');
});

// ---------- Windows High Contrast ----------

test('every icon is drawn in the text colour, so High Contrast recolours it', t => {
  const h = setup(t);
  for (const view of everyView(h)) {
    for (const icon of h.w.document.querySelectorAll('svg')) {
      assert.equal(icon.getAttribute('stroke'), 'currentColor', `${view}: stroke`);
      assert.ok(['none', 'currentColor'].includes(icon.getAttribute('fill')), `${view}: fill`);
      for (const part of icon.querySelectorAll('[fill], [stroke]')) {
        for (const attr of ['fill', 'stroke']) {
          const v = part.getAttribute(attr);
          assert.ok(v === null || ['none', 'currentColor'].includes(v), `${view}: icon part sets ${attr}="${v}"`);
        }
      }
    }
  }
});

test('the theme button takes its colour from the theme text colour', () => {
  const fab = CSS.match(/^\.theme-fab \{([^}]*)\}/m)[1];
  assert.match(fab, /color:\s*var\(--text\)/);
});
