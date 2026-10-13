// Jest port of tests/axe-rules.test.cjs (the node:test original is kept and still runs with npm test)
const fs = require('node:fs');
const path = require('node:path');
const { setupApp } = require('./jest-harness');

// The rules axe-core checks that the other suites did not, run on every
// screen, dialog and panel in jsdom so they fail fast without Electron.
// npm run test:axe runs axe itself in the real renderer, in dark, light and
// High Contrast. Checks that loop over views collect what they find, so a
// failure lists every offending element and the view it was on.

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

describe('landmarks (axe: landmark-one-main, region)', () => {
  test('every screen, signed in or not, has exactly one main landmark', () => {
    const h = setupApp();
    const problems = [];
    for (const view of everyView(h)) {
      const n = h.w.document.querySelectorAll('main, [role="main"]').length;
      if (n !== 1) problems.push(`${view}: ${n} main landmarks`);
    }
    expect(problems).toEqual([]);
  });

  test('the sign-in screens and the call screen are the main content themselves', () => {
    const h = setupApp();
    for (const [screen, cls] of [['landing', 'auth'], ['signin', 'auth'], ['create', 'auth'], ['biometrics', 'auth'], ['facescan', 'scan'], ['facesuccess', 'scan']]) {
      h.read(`state.screen = ${JSON.stringify(screen)}; render({ fresh: true })`);
      expect(h.q('#app > main')?.className).toBe(cls);
    }
    h.signIn(); h.go('messages'); h.click('[data-call="AJ"]');
    expect(h.q('#app > main')?.className).toBe('call');
  });

  test('all visible text sits inside a landmark, dialog or live region', () => {
    const h = setupApp();
    const problems = [];
    for (const view of everyView(h)) {
      const d = h.w.document;
      const walker = d.createTreeWalker(d.body, 4 /* NodeFilter.SHOW_TEXT */);
      while (walker.nextNode()) {
        const node = walker.currentNode, el = node.parentElement;
        if (!node.nodeValue.trim() || el.closest('script, style, [hidden], [aria-hidden="true"]')) continue;
        if (!el.closest(LANDMARKS)) problems.push(`${view}: "${node.nodeValue.trim()}"`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('the toast, with its Undo and close buttons, is a named region', () => {
    const h = setupApp(); h.signIn(); h.click('[data-med-take="2"]');
    const toast = h.q('#toast');
    expect(toast.getAttribute('role')).toBe('region');
    expect(toast.getAttribute('aria-label')).toBe('Notification');
    expect(toast.querySelector('[data-act="toast-undo"]')).toBeTruthy();
    // The message is announced from #sr-status, which stays rendered while the toast is hidden
    expect(h.q('#sr-status').getAttribute('aria-live')).toBe('polite');
    expect(toast.contains(h.q('#sr-status'))).toBe(false);
  });
});

describe('label in name (axe: label-content-name-mismatch)', () => {
  test('a named control\'s visible text appears, in order, as one phrase of its name', () => {
    const h = setupApp();
    const problems = [];
    for (const view of everyView(h)) {
      for (const el of h.w.document.querySelectorAll('button[aria-label], [role="tab"][aria-label], [role="radio"][aria-label], [role="switch"][aria-label]')) {
        const shown = words(shownText(el));
        if (!shown.length) continue; // icon-only: the name is the only label
        if (!containsPhrase(words(el.getAttribute('aria-label')), shown)) {
          problems.push(`${view}: shows "${shownText(el)}" but is named "${el.getAttribute('aria-label')}"`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('day tabs are named by the day and date printed on them', () => {
    const h = setupApp(); h.signIn(); h.go('schedule');
    for (const tab of h.w.document.querySelectorAll('[role="tab"]')) {
      const shown = `${tab.querySelector('.dow').textContent} ${tab.querySelector('.num').textContent}`;
      expect(tab.getAttribute('aria-label').toLowerCase().startsWith(shown.toLowerCase())).toBe(true);
    }
    // Separate words on screen too, so "MON 28" is not read as "MON28"
    expect(shownText(h.q('#day-tab-0'))).toMatch(/^MON 28$/);
  });

  test('conversation names follow the card: unread, name, time, role, then the last message', () => {
    const h = setupApp(); h.signIn();
    h.read('state.convos[1].unread = true'); h.go('messages');
    expect(h.q('[data-convo="SC"]').getAttribute('aria-label')).toMatch(/^Unread, Dr\. Sarah Chen, \w+, Physician: /);
    // The avatar initials are drawn by CSS, so they are not part of the button's text
    for (const av of h.w.document.querySelectorAll('.convo .avatar')) {
      expect(av.textContent).toBe('');
      expect(av.dataset.initials).toBeTruthy();
    }
    expect(CSS).toMatch(/\.convo \.avatar::before\s*\{\s*content:\s*attr\(data-initials\)/);
  });
});

describe('roles (axe: aria-allowed-role)', () => {
  test('dialog roles sit on plain containers, never on a form or control', () => {
    const h = setupApp();
    const problems = [];
    for (const view of everyView(h)) {
      for (const el of h.w.document.querySelectorAll('[role="dialog"], [role="alertdialog"]')) {
        if (!['DIV', 'SECTION'].includes(el.tagName)) problems.push(`${view}: role=${el.getAttribute('role')} on <${el.tagName.toLowerCase()}>`);
      }
      for (const form of h.w.document.querySelectorAll('form[role]')) {
        if (!['search', 'none', 'presentation'].includes(form.getAttribute('role'))) problems.push(`${view}: <form role="${form.getAttribute('role')}">`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('the symptom form lives inside its dialog, which is named by its heading', () => {
    const h = setupApp(); h.signIn(); h.go('symptoms'); h.click('[data-act="log-symptom"]');
    const dialog = h.q('#sym-form').closest('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(h.w.document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Log a symptom');
  });
});

describe('contrast: content axe can measure', () => {
  // Keycaps such as "+" are key names; arrows are covered below
  test('no button shows only symbols or emoji: its text must be words, or an icon', () => {
    const h = setupApp();
    const problems = [];
    for (const view of everyView(h)) {
      for (const el of h.w.document.querySelectorAll('button')) {
        const shown = shownText(el);
        if (shown && !words(shown).length) problems.push(`${view}: button shows only "${shown}"`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('arrow keycaps are icons; the shortcut is spoken in words', () => {
    const h = setupApp(); h.signIn(); h.go('account');
    const arrows = [...h.w.document.querySelectorAll('.shortcuts kbd')].filter(k => k.querySelector('svg'));
    expect(arrows).toHaveLength(6); // ↑ ↓ ← → in the first row, ← → in the third
    for (const k of arrows) {
      expect(k.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
      expect(k.textContent).toBe('');
      expect(k.closest('.kbds').getAttribute('aria-hidden')).toBe('true');
      expect(k.closest('.sc-row').querySelector('.sr-only').textContent).toMatch(/arrow keys/);
    }
  });

  test('the theme button and message buttons use icons, not emoji', () => {
    const h = setupApp();
    for (const theme of ['dark', 'light']) {
      h.read(`state.theme = '${theme}'; state.screen = 'landing'; render({ fresh: true })`);
      const fab = h.q('.theme-fab');
      expect(fab.querySelector('svg')).toBeTruthy();
      expect(shownText(fab)).toBe('');
      expect(fab.getAttribute('aria-label')).toBe(`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
    h.signIn();
    for (const btn of h.w.document.querySelectorAll('[data-chat]')) {
      expect(btn.querySelector('svg')).toBeTruthy();
      expect(shownText(btn)).toBe('');
    }
  });

  test('text is never laid over a gradient, so its contrast can be measured', () => {
    expect(CSS).not.toMatch(/gradient\(/);
    expect(CSS.match(/^\.call \{([^}]*)\}/m)[1]).toMatch(/background:\s*#[0-9a-f]{3,6};/i);
  });
});

describe('aria-keyshortcuts', () => {
  // The attribute takes key values ("\", "-"), joined by "+"; only the plus key
  // itself is written "Plus". Spoken names ("Backslash") belong in visible or
  // screen-reader text, not in the attribute.
  test('aria-keyshortcuts use key values, so assistive tech can match the keys', () => {
    const h = setupApp(); h.signIn(); h.go('account');
    const keys = sel => h.q(sel).getAttribute('aria-keyshortcuts');
    expect(keys('.row[data-act="voice"]')).toBe('Control+\\');
    expect(keys('.topbar [data-act="voice"]')).toBe('Control+\\');
    expect(keys('[data-act="zoom-out"]')).toBe('Control+-');
    expect(keys('[data-act="zoom-in"]')).toBe('Control+Plus');
    expect(keys('.row[data-act="toggle-notifications"]')).toBe('Control+N');
    for (const el of h.w.document.querySelectorAll('[aria-keyshortcuts]')) {
      expect(el.getAttribute('aria-keyshortcuts')).toMatch(/^(Control\+)?(.|Plus|Escape)$/);
    }
  });
});

describe('Windows High Contrast', () => {
  test('every icon is drawn in the text colour, so High Contrast recolours it', () => {
    const h = setupApp();
    const problems = [];
    for (const view of everyView(h)) {
      for (const icon of h.w.document.querySelectorAll('svg')) {
        if (icon.getAttribute('stroke') !== 'currentColor') problems.push(`${view}: icon stroke="${icon.getAttribute('stroke')}"`);
        if (!['none', 'currentColor'].includes(icon.getAttribute('fill'))) problems.push(`${view}: icon fill="${icon.getAttribute('fill')}"`);
        for (const part of icon.querySelectorAll('[fill], [stroke]')) {
          for (const attr of ['fill', 'stroke']) {
            const v = part.getAttribute(attr);
            if (v !== null && !['none', 'currentColor'].includes(v)) problems.push(`${view}: icon part sets ${attr}="${v}"`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('the theme button takes its colour from the theme text colour', () => {
    expect(CSS.match(/^\.theme-fab \{([^}]*)\}/m)[1]).toMatch(/color:\s*var\(--text\)/);
  });
});
