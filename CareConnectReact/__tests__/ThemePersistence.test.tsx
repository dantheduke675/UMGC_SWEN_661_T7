/**
 * Regression test: light/dark mode used to reset to dark on every screen
 * because each screen tracked `isDark` in its own local `useState`. The fix
 * lifts that state into a single ThemeContext shared by the whole app, so
 * these tests drive the *real* navigation stack (not a mocked `navigation`
 * prop) to prove the chosen theme actually survives screen transitions.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import App from '../App';

describe('theme persistence across navigation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('carries light mode from Landing through the rest of the sign-up flow', async () => {
    await render(<App />);

    // Starts in dark mode (☀️ is the "switch to light" affordance).
    expect(screen.getByText('☀️')).toBeTruthy();
    await fireEvent.press(screen.getByText('☀️'));
    expect(screen.getByText('🌙')).toBeTruthy(); // now in light mode

    await fireEvent.press(screen.getByText('Create account'));
    // Still light mode on the next screen — no reset back to ☀️/dark.
    expect(screen.getByText('🌙')).toBeTruthy();
    expect(screen.queryByText('☀️')).toBeNull();

    await fireEvent.press(screen.getByText(/Care recipient/));
    // Still light mode on BiometricsIntroScreen.
    expect(screen.getByText('🌙')).toBeTruthy();

    await fireEvent.press(screen.getByText('No, use my password'));
    // Still light mode on SignInScreen.
    expect(screen.getByText('🌙')).toBeTruthy();

    // Toggling back to dark here should also stick.
    await fireEvent.press(screen.getByText('🌙'));
    expect(screen.getByText('☀️')).toBeTruthy();
  });

  it('carries the chosen theme into the post-login tab shell', async () => {
    await render(<App />);

    await fireEvent.press(screen.getByText('☀️')); // switch to light mode
    await fireEvent.press(screen.getByText('Sign in'));

    // On SignInScreen — still light mode.
    expect(screen.getByText('🌙')).toBeTruthy();

    const matches = screen.getAllByText('Sign in');
    await fireEvent.press(matches[matches.length - 1]);

    // Now on the Today tab (AppShellNavigator) — the overlay toggle should
    // still reflect light mode, not have reset to the shell's own default.
    expect(screen.getByText('🌙')).toBeTruthy();

    // The Account screen's own appearance switch should agree too.
    await fireEvent.press(screen.getByText('Account'));
    expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked();
  });
});
