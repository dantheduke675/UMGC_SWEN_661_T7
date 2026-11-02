/**
 * Keyboard access (WCAG 2.1.1, 2.1.2, 2.4.3, 2.4.7) for a hardware keyboard,
 * D-pad or switch device on a phone, and for the web build.
 *
 * - Every control on every tab is a focusable element with a name.
 * - Focus moves through a screen's own content before the repeated bars, and
 *   through the tabs in the order they are drawn.
 * - A focused control shows a visible ring; it goes when focus leaves.
 * - Dialogs close with Escape (web) or Back (Android), so focus is never
 *   trapped in them.
 */
import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AppShellNavigator from '../src/components/AppShell';
import { ThemeProvider } from '../src/context/ThemeContext';
import { TouchableOpacity, isKeyboardFocus } from '../src/components/Touchable';

type Element = NonNullable<typeof screen.root>;

const CONTROL_ROLES = ['button', 'tab', 'switch', 'radio'];

// Host elements a keyboard can land on, in the order they are drawn, which
// is the order Tab / arrow keys move through them.
function focusableControls(node: Element | null = screen.root, out: Element[] = []): Element[] {
  if (!node) return out;
  if (
    typeof node.type === 'string' &&
    CONTROL_ROLES.includes(node.props.accessibilityRole) &&
    node.props.focusable !== false
  ) {
    out.push(node);
  }
  for (const child of node.children) {
    if (typeof child !== 'string') focusableControls(child, out);
  }
  return out;
}

const nameOf = (el: Element) => el.props.accessibilityLabel as string | undefined;

const TABS = ['Today', 'Medications', 'Messages', 'Schedule', 'Symptoms', 'Account'];

describe('keyboard access', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each(TABS)('every control on the %s tab can take keyboard focus and has a name', async tab => {
    await render(<AppShellNavigator />);
    await fireEvent.press(screen.getByRole('tab', { name: tab }));

    const controls = focusableControls();
    expect(controls.length).toBeGreaterThan(TABS.length);
    for (const el of controls) {
      expect(el.props.focusable).not.toBe(false);
      expect(nameOf(el)).toBeTruthy();
    }
  });

  it('moves through the screen content first, then the theme switch, the access bar and the tabs in order', async () => {
    await render(<AppShellNavigator />);
    const names = focusableControls().map(nameOf);

    const firstContent = names.indexOf('All medications');
    const themeSwitch  = names.indexOf('Dark mode');
    const scrollUp     = names.indexOf('Scroll up');
    const tabs         = TABS.map(t => names.lastIndexOf(t));

    expect(firstContent).toBeGreaterThanOrEqual(0);
    expect(firstContent).toBeLessThan(themeSwitch);
    expect(themeSwitch).toBeLessThan(scrollUp);
    expect(names.slice(scrollUp, scrollUp + 3)).toEqual(['Scroll up', 'Voice input', 'Scroll down']);
    expect(scrollUp).toBeLessThan(tabs[0]);
    // Tabs come last, left to right
    expect(names.slice(-TABS.length)).toEqual(TABS);
  });

  it('shows a visible focus ring on the focused control and removes it on blur', async () => {
    await render(<AppShellNavigator />);
    const tab = screen.getByRole('tab', { name: 'Medications' });
    expect(tab).not.toHaveStyle({ outlineWidth: 3 });

    await fireEvent(tab, 'focus');
    expect(tab).toHaveStyle({ outlineWidth: 3, outlineStyle: 'solid', outlineOffset: 2 });

    await fireEvent(tab, 'blur');
    expect(tab).not.toHaveStyle({ outlineWidth: 3 });
  });

  it('draws the focus ring in the theme text colour, which contrasts with the page in both themes', async () => {
    await render(<ThemeProvider><AppShellNavigator /></ThemeProvider>);
    const button = screen.getAllByRole('button', { name: /^I took this: / })[0];
    await fireEvent(button, 'focus');
    expect(button).toHaveStyle({ outlineColor: '#F5F7FA' }); // dark theme text

    await fireEvent.press(screen.getByRole('switch', { name: 'Dark mode' })); // to light
    const again = screen.getAllByRole('button', { name: /^I took this: / })[0];
    await fireEvent(again, 'focus');
    expect(again).toHaveStyle({ outlineColor: '#1A2133' }); // light theme text
  });

  it('activates a focused tab with its press action (Enter / Space / D-pad centre)', async () => {
    await render(<AppShellNavigator />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Schedule' }));
    expect(screen.getByRole('tab', { name: 'Schedule' })).toBeSelected();
  });

  it('closes the "missed dose" dialog with Escape / Back, returning to the screen (no keyboard trap)', async () => {
    await render(<AppShellNavigator />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Medications' }));
    await fireEvent.press(screen.getAllByRole('button', { name: /^I missed this: / })[0]);
    expect(screen.getByRole('alert')).toBeOnTheScreen();

    // requestClose is what Escape (web) and the Back key (Android) send to
    // the dialog
    await fireEvent(screen.getByRole('alert'), 'requestClose');

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Medications' })).toBeSelected();
  });

  it('closes the undo history panel with Escape / Back (no keyboard trap)', async () => {
    await render(<AppShellNavigator />);
    await fireEvent.press(screen.getAllByRole('button', { name: /^I took this: / })[0]);
    await fireEvent.press(screen.getByRole('button', { name: /undo history/ }));
    expect(screen.getByRole('header', { name: 'Undo history' })).toBeOnTheScreen();

    await fireEvent(screen.getByRole('header', { name: 'Undo history' }), 'requestClose');

    expect(screen.queryByRole('header', { name: 'Undo history' })).toBeNull();
  });
});

describe('focus ring wrapper', () => {
  it('keeps the press fade and still treats aria-disabled as disabled', async () => {
    const onPress = jest.fn();
    await render(
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go" aria-disabled onPress={onPress} />,
    );
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('passes focus and blur on to the caller', async () => {
    const onFocus = jest.fn();
    const onBlur  = jest.fn();
    await render(
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go" onFocus={onFocus} onBlur={onBlur} />,
    );
    await fireEvent(screen.getByRole('button', { name: 'Go' }), 'focus');
    await fireEvent(screen.getByRole('button', { name: 'Go' }), 'blur');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  describe('on the web', () => {
    const original = Platform.OS;
    beforeAll(() => { Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true }); });
    afterAll(() => { Object.defineProperty(Platform, 'OS', { value: original, configurable: true }); });

    it('shows the ring for keyboard focus (:focus-visible) but not after a mouse click', () => {
      const event = (focusVisible: boolean) =>
        ({ target: { matches: (q: string) => q === ':focus-visible' && focusVisible } }) as never;
      expect(isKeyboardFocus(event(true))).toBe(true);
      expect(isKeyboardFocus(event(false))).toBe(false);
    });

    it('falls back to showing the ring when the browser cannot tell', () => {
      expect(isKeyboardFocus(undefined)).toBe(true);
      const throws = { target: { matches: () => { throw new Error('unsupported'); } } } as never;
      expect(isKeyboardFocus(throws)).toBe(true);
    });
  });
});
