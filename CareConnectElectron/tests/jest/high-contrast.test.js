// Jest port of tests/high-contrast.test.cjs (the node:test original is kept and still runs with npm test)
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

// jsdom cannot render Windows High Contrast, so these tests check the
// stylesheet itself: every state that is shown only by a background fill
// must be redrawn in forced-colors mode, using system colors only.
const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles.css'), 'utf8');
const sheet = new JSDOM(`<style>${css}</style>`).window.document.styleSheets[0];
const forced = [...sheet.cssRules].filter(r => r.media && /forced-colors:\s*active/.test(r.media.mediaText));
const rules = forced.flatMap(m => [...m.cssRules]);
const selectorsOf = rule => rule.selectorText.split(',').map(s => s.trim());
const ruleFor = selector => rules.filter(r => selectorsOf(r).includes(selector));
const declared = (selector, prop) => ruleFor(selector).map(r => r.style.getPropertyValue(prop) || (r.cssText.match(new RegExp(`(?:^|[;{\\s])${prop}:\\s*([^;}]+)`)) || [])[1]).filter(Boolean).map(v => v.trim());

const SYSTEM_COLORS = ['Canvas', 'CanvasText', 'Highlight', 'HighlightText', 'ButtonFace', 'ButtonText', 'GrayText', 'LinkText', 'Field', 'FieldText', 'transparent'];

test('the stylesheet has a forced-colors (High Contrast) block', () => {
  expect(forced.length).toBe(1);
  expect(rules.length > 10).toBeTruthy();
});

test('selected and "on" states stay visible: filled with the system highlight', () => {
  for (const selector of ['.nav button.active', '.day.sel', '.role-card.selected', '.sev-pick button.sel', '.icon-btn.on', '.convo.active', '.call-ctrl.on .c']) {
    expect(declared(selector, 'background')).toEqual(['Highlight']);
    expect(declared(selector, 'color')).toEqual(['HighlightText']);
  }
});

test('switches, the progress bar and severity bars are drawn with system colors', () => {
  expect(declared('.switch.on', 'background')).toEqual(['Highlight']);
  expect(declared('.theme-switch.on', 'background')).toEqual(['Highlight']);
  expect(declared('.switch', 'border')).toEqual(['2px solid CanvasText']);
  expect(declared('.progress > div', 'background')).toEqual(['Highlight']);
  expect(declared('.progress', 'border')).toEqual(['1px solid CanvasText']);
  expect(declared('.sym .bars span.on', 'background')).toEqual(['Highlight']);
  expect(declared('.day .dot.has', 'background')).toEqual(['CanvasText']);
  expect(declared('.hb-count', 'background')).toEqual(['Highlight']);
});

test('the focus indicator uses the system highlight and stays visible on highlighted items', () => {
  expect(declared('button:focus', 'outline-color')).toEqual(['Highlight']);
  expect(declared('[tabindex]:not([tabindex="-1"]):focus', 'outline-color')).toEqual(['Highlight']);
  expect(declared('.nav button.active:focus', 'outline-color')).toEqual(['HighlightText']);
  expect(declared('.convo.active:focus', 'outline-color')).toEqual(['HighlightText']);
});

test('menu items do not show a stray left border', () => {
  expect(declared('.nav button', 'border-left-color')).toEqual(['Canvas']);
});

test('rules that opt out of forced colors use only system colors, so they follow the user theme', () => {
  const colorProps = /(?:^|[;{\s])(background(?:-color)?|color|border(?:-[a-z]+)*|outline(?:-color)?)\s*:\s*([^;}]+)/g;
  for (const rule of rules) {
    for (const [, prop, value] of rule.cssText.matchAll(colorProps)) {
      const colors = value.replace(/\d+(\.\d+)?(px|%)?|solid|none/g, ' ').trim().split(/\s+/).filter(Boolean);
      for (const c of colors) {
        expect(SYSTEM_COLORS.includes(c)).toBeTruthy();
      }
    }
  }
});
