const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

// jsdom cannot render Windows High Contrast, so these tests check the
// stylesheet itself: every state that is shown only by a background fill
// must be redrawn in forced-colors mode, using system colors only.
const css = fs.readFileSync(path.resolve(__dirname, '../src/styles.css'), 'utf8');
const sheet = new JSDOM(`<style>${css}</style>`).window.document.styleSheets[0];
const forced = [...sheet.cssRules].filter(r => r.media && /forced-colors:\s*active/.test(r.media.mediaText));
const rules = forced.flatMap(m => [...m.cssRules]);
const selectorsOf = rule => rule.selectorText.split(',').map(s => s.trim());
const ruleFor = selector => rules.filter(r => selectorsOf(r).includes(selector));
const declared = (selector, prop) => ruleFor(selector).map(r => r.style.getPropertyValue(prop) || (r.cssText.match(new RegExp(`(?:^|[;{\\s])${prop}:\\s*([^;}]+)`)) || [])[1]).filter(Boolean).map(v => v.trim());

const SYSTEM_COLORS = ['Canvas', 'CanvasText', 'Highlight', 'HighlightText', 'ButtonFace', 'ButtonText', 'GrayText', 'LinkText', 'Field', 'FieldText', 'transparent'];

test('the stylesheet has a forced-colors (High Contrast) block', () => {
  assert.equal(forced.length, 1);
  assert.ok(rules.length > 10);
});

test('selected and "on" states stay visible: filled with the system highlight', () => {
  for (const selector of ['.nav button.active', '.day.sel', '.role-card.selected', '.sev-pick button.sel', '.icon-btn.on', '.convo.active', '.call-ctrl.on .c']) {
    assert.deepEqual(declared(selector, 'background'), ['Highlight'], `${selector} background`);
    assert.deepEqual(declared(selector, 'color'), ['HighlightText'], `${selector} text`);
  }
});

test('switches, the progress bar and severity bars are drawn with system colors', () => {
  assert.deepEqual(declared('.switch.on', 'background'), ['Highlight']);
  assert.deepEqual(declared('.theme-switch.on', 'background'), ['Highlight']);
  assert.deepEqual(declared('.switch', 'border'), ['2px solid CanvasText'], 'Off switches keep an outline');
  assert.deepEqual(declared('.progress > div', 'background'), ['Highlight']);
  assert.deepEqual(declared('.progress', 'border'), ['1px solid CanvasText'], 'The empty track is outlined');
  assert.deepEqual(declared('.sym .bars span.on', 'background'), ['Highlight']);
  assert.deepEqual(declared('.day .dot.has', 'background'), ['CanvasText'], 'Days with appointments keep their dot');
  assert.deepEqual(declared('.hb-count', 'background'), ['Highlight'], 'History count badge');
});

test('the focus indicator uses the system highlight and stays visible on highlighted items', () => {
  assert.deepEqual(declared('button:focus', 'outline-color'), ['Highlight']);
  assert.deepEqual(declared('[tabindex]:not([tabindex="-1"]):focus', 'outline-color'), ['Highlight']);
  assert.deepEqual(declared('.nav button.active:focus', 'outline-color'), ['HighlightText'], 'Inset ring on a Highlight fill');
  assert.deepEqual(declared('.convo.active:focus', 'outline-color'), ['HighlightText']);
});

test('menu items do not show a stray left border', () => {
  assert.deepEqual(declared('.nav button', 'border-left-color'), ['Canvas']);
});

test('rules that opt out of forced colors use only system colors, so they follow the user theme', () => {
  const colorProps = /(?:^|[;{\s])(background(?:-color)?|color|border(?:-[a-z]+)*|outline(?:-color)?)\s*:\s*([^;}]+)/g;
  for (const rule of rules) {
    for (const [, prop, value] of rule.cssText.matchAll(colorProps)) {
      const colors = value.replace(/\d+(\.\d+)?(px|%)?|solid|none/g, ' ').trim().split(/\s+/).filter(Boolean);
      for (const c of colors) {
        assert.ok(SYSTEM_COLORS.includes(c), `${rule.selectorText.replace(/\s+/g, ' ')} { ${prop}: ${value} } uses "${c}", not a system color`);
      }
    }
  }
});
