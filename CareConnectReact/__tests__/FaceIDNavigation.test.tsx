/**
 * Regression test for a timer-cleanup bug in FaceIDScreen: the simulated
 * scan schedules two chained timeouts (2000ms "scan complete", then a
 * further 600ms before navigating to Today), but only the first was ever
 * cleared on unmount. Someone with a tremor may need longer than usual to
 * land a tap on "Use my password instead" — if that tap landed in the
 * 2000-2600ms window, the leftover second timer would still fire and
 * silently redirect them to Today a moment after they had already escaped
 * to SignIn. This must be driven through the *real* navigation stack (not
 * an isolated render with a mocked `navigation` prop), because the bug is
 * specifically about what happens to the pending timer when the screen
 * actually unmounts.
 */
import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import App from '../App';

describe('FaceIDScreen navigation timing (tremor/motor accessibility)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not still redirect to Today after the user has escaped to SignIn mid-scan', async () => {
    await render(<App />);

    await fireEvent.press(screen.getByText('Sign in'));
    await fireEvent.press(screen.getByText('Use Face ID instead'));
    expect(screen.getByText('Looking for your face…')).toBeTruthy();

    // Bail out partway through the simulated 2s scan.
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await fireEvent.press(screen.getByText('Use my password instead'));

    // Back on SignInScreen.
    expect(screen.getByDisplayValue('maddy@example.com')).toBeTruthy();

    // Advance well past when the scan-complete → Today redirect would have
    // fired. It must not: the Today tab never appears, and SignIn stays put.
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByText(/Good morning/)).toBeNull();
    expect(screen.getByDisplayValue('maddy@example.com')).toBeTruthy();
  });
});
