/**
 * Large text (WCAG 1.4.4 Resize Text, 1.4.12 Text Spacing).
 *
 * The app follows the phone's own text size setting (Settings > Display >
 * Font size on Android, Larger Text on iOS) and browser zoom on the web. These
 * checks make sure nothing switches that off and that the layout can grow:
 *
 * - no text opts out of font scaling or caps it,
 * - no button with a text label has a fixed height (it would clip the label
 *   when the text grows or wraps; minHeight is used instead),
 * - no essential text is cut off to one line.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AppShellNavigator from '../src/components/AppShell';
import SignInScreen from '../src/screens/SignInScreen';
import CreateAccountScreen from '../src/screens/CreateAccountScreen';
import LandingScreen from '../src/screens/LandingScreen';

type Element = NonNullable<typeof screen.root>;

function allHostElements(node: Element | null = screen.root, out: Element[] = []): Element[] {
  if (!node) return out;
  if (typeof node.type === 'string') out.push(node);
  for (const child of node.children) {
    if (typeof child !== 'string') allHostElements(child, out);
  }
  return out;
}

function textContent(node: Element): string {
  return node.children
    .map(c => (typeof c === 'string' ? c : textContent(c)))
    .join('');
}

// Controls whose label is a word (not a lone icon such as ← or 📞)
const hasWordLabel = (el: Element) => /[A-Za-z]{2,}/.test(textContent(el));

const CONTROL_ROLES = ['button', 'tab', 'switch'];

function expectScalableText() {
  const hosts = allHostElements();
  const texts = hosts.filter(el => el.type === 'Text');
  expect(texts.length).toBeGreaterThan(0);

  for (const t of texts) {
    expect(t.props.allowFontScaling).not.toBe(false);
    expect(t.props.maxFontSizeMultiplier).toBeUndefined();
  }

  for (const el of hosts) {
    if (!CONTROL_ROLES.includes(el.props.accessibilityRole) || !hasWordLabel(el)) continue;
    const style = StyleSheet.flatten(el.props.style) ?? {};
    if (style.height !== undefined) {
      throw new Error(`"${textContent(el)}" has a fixed height of ${style.height}; use minHeight so large text is not clipped`);
    }
  }
}

const nav = { navigate: jest.fn(), goBack: jest.fn() };

describe('large text', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each([
    ['Landing', () => <LandingScreen navigation={nav} />],
    ['Sign in', () => <SignInScreen navigation={nav} />],
    ['Create account', () => <CreateAccountScreen navigation={nav} />],
  ])('the %s screen scales with the system text size and has no fixed-height buttons', async (_, ui) => {
    await render(ui());
    expectScalableText();
  });

  it.each(['Today', 'Medications', 'Messages', 'Schedule', 'Symptoms', 'Account'])(
    'the %s tab scales with the system text size and has no fixed-height buttons',
    async tab => {
      await render(<AppShellNavigator />);
      await fireEvent.press(screen.getByRole('tab', { name: tab }));
      // Open the symptom form too, so its chips and Log symptom button are checked
      if (tab === 'Symptoms') await fireEvent.press(screen.getByRole('button', { name: 'Log a symptom' }));
      expectScalableText();
    },
  );

  it('wraps long medication names instead of cutting them off', async () => {
    await render(<AppShellNavigator />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Medications' }));
    for (const name of screen.getAllByRole('header')) {
      expect(name.props.numberOfLines).toBeUndefined();
    }
  });

  it('only shortens the message preview, whose full text is in its name and the thread', async () => {
    await render(<AppShellNavigator />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Messages' }));
    const clipped = allHostElements().filter(el => el.type === 'Text' && el.props.numberOfLines);
    for (const t of clipped) {
      const row = screen.getAllByRole('button').find(b => textContent(b).includes(textContent(t)));
      expect(row?.props.accessibilityLabel).toContain(textContent(t));
    }
  });
});
