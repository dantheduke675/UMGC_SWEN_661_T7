// CareConnect design tokens — mirrors Flutter's CTokens / CScheme
export const tokens = {
  primary:          '#357C6F',
  primaryLight:     '#2F7A6B',
  caregiverPurple:  '#684BE6',
  danger:           '#C53030',
  planIndigo:       '#6366F1',
  white:            '#FFFFFF',
} as const;

export interface ColorScheme {
  bg:           string;
  surface:      string;
  surface2:     string;
  border:       string;
  inputBorder:  string;
  text:         string;
  sub:          string;
  muted:        string;
  link:         string;
  primary:      string;
  /** Use for text/icon glyphs colored with the brand hue (WCAG AA 4.5:1 on
   *  bg/surface/surface2). `primary` itself stays reserved for solid fills
   *  and decorative borders/icons, where only the 3:1 non-text threshold
   *  applies and lightening it would weaken white-on-primary button text. */
  primaryText:  string;
  /** Use for danger-colored text/icon glyphs (WCAG AA 4.5:1). `tokens.danger`
   *  stays reserved for solid fills (e.g. destructive button backgrounds). */
  danger:       string;
}

export const dark: ColorScheme = {
  bg:          '#0E131D',
  surface:     '#1D2534',
  surface2:    '#141A27',
  border:      '#333D4F',
  inputBorder: '#7A8599',
  text:        '#F5F7FA',
  sub:         '#9EA8BD',
  muted:       '#828DA1',
  link:        '#59AD9E',
  primary:     '#357C6F',
  primaryText: '#5D968C',
  danger:      '#D66C6C',
};

export const light: ColorScheme = {
  bg:          '#F6F7F9',
  surface:     '#F2F3F5',
  surface2:    '#E8EAED',
  border:      '#E0E2E6',
  inputBorder: '#E0E2E6',
  text:        '#1A2133',
  sub:         '#5A6478',
  muted:       '#626A78',
  link:        '#2D7567',
  primary:     '#2D7567',
  primaryText: '#2D7567',
  danger:      '#C53030',
};

// ── Accessible accent text color ────────────────────────────────────────────
// Category/severity chips borrow one-off accent hues (e.g. appointment type
// colors, symptom severity colors) that were only tuned for use as tinted
// fills/borders, not as text. When one of those hues is drawn as *text*,
// run it through this helper first so it meets WCAG AA 4.5:1 against every
// background in the active scheme, instead of hand-tuning each hue per theme.

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function channelLuminance(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns `hex` unchanged if it already reads at 4.5:1 against every
 * background in `scheme`; otherwise mixes it toward white (dark schemes) or
 * black (light schemes) until it does, so accent hues stay legible as text
 * in both themes without needing a hand-picked value per hue per theme.
 */
export function accessibleAccentText(hex: string, scheme: ColorScheme): string {
  const backgrounds = [scheme.bg, scheme.surface, scheme.surface2];
  const isDarkScheme = relativeLuminance(hexToRgb(scheme.bg)) < 0.5;
  const mixTarget: [number, number, number] = isDarkScheme ? [255, 255, 255] : [0, 0, 0];

  const base = hexToRgb(hex);
  const worstContrast = () => Math.min(...backgrounds.map(bg => contrastRatio(rgbToHex(mixed), bg)));

  let mixed = base;
  if (Math.min(...backgrounds.map(bg => contrastRatio(hex, bg))) >= 4.5) return hex;

  for (let i = 1; i <= 100; i++) {
    const t = i / 100;
    mixed = [0, 1, 2].map(ch => base[ch] + (mixTarget[ch] - base[ch]) * t) as [number, number, number];
    if (worstContrast() >= 4.5) break;
  }
  return rgbToHex(mixed);
}

/**
 * Returns `hex` unchanged if white text already reads at 4.5:1 on top of it,
 * otherwise darkens it just enough that white text does. Use this for a
 * solid accent-colored fill (e.g. a selected severity dot) that carries
 * white text/icon content, instead of hand-picking a darker shade per hue.
 */
export function accessibleFillForWhiteText(hex: string): string {
  if (contrastRatio('#FFFFFF', hex) >= 4.5) return hex;
  const base = hexToRgb(hex);
  let mixed = base;
  for (let i = 1; i <= 100; i++) {
    const t = i / 100;
    mixed = [0, 1, 2].map(ch => base[ch] * (1 - t)) as [number, number, number];
    if (contrastRatio('#FFFFFF', rgbToHex(mixed)) >= 4.5) break;
  }
  return rgbToHex(mixed);
}
