/**
 * Component tests for FaceIDScreen — the simulated biometric scan and its
 * auto-navigation to Today after success.
 */
import React from 'react';
import { Dimensions } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import FaceIDScreen from '../src/screens/FaceIDScreen';

function makeNav() {
  return { navigate: jest.fn() };
}

const PHONE_WINDOW  = { window: { width: 375, height: 812, scale: 3, fontScale: 1 } };
const TABLET_WINDOW = { window: { width: 1024, height: 1366, scale: 2, fontScale: 1 } };

describe('FaceIDScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the scanning spinner initially', async () => {
    await render(<FaceIDScreen navigation={makeNav()} />);
    expect(screen.getByText('Looking for your face…')).toBeTruthy();
  });

  it('shows "Face recognised" after the 2s scan completes', async () => {
    await render(<FaceIDScreen navigation={makeNav()} />);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('✓  Face recognised')).toBeTruthy();
    expect(screen.queryByText('Looking for your face…')).toBeNull();
  });

  it('navigates to Today 600ms after the scan completes', async () => {
    const navigation = makeNav();
    await render(<FaceIDScreen navigation={navigation} />);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(navigation.navigate).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Today');
  });

  it('uses navigation.replace instead of navigate when available', async () => {
    const navigation = { navigate: jest.fn(), replace: jest.fn() };
    await render(<FaceIDScreen navigation={navigation} />);

    await act(async () => {
      jest.advanceTimersByTime(2600);
    });

    expect(navigation.replace).toHaveBeenCalledWith('Today');
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('offers a password fallback', async () => {
    const navigation = makeNav();
    await render(<FaceIDScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText('Use my password instead'));
    expect(navigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  describe('on a tablet-sized viewport', () => {
    afterEach(async () => {
      await act(async () => {
        Dimensions.set(PHONE_WINDOW);
      });
    });

    it('still shows the scanning state and offers the password fallback', async () => {
      Dimensions.set(TABLET_WINDOW);
      const navigation = makeNav();
      await render(<FaceIDScreen navigation={navigation} />);

      expect(screen.getByText('Looking for your face…')).toBeTruthy();
      await fireEvent.press(screen.getByText('Use my password instead'));
      expect(navigation.navigate).toHaveBeenCalledWith('SignIn');
    });

    it('keeps the password-fallback button at or above the 44x44 WCAG target size (tremor/motor accessibility)', async () => {
      Dimensions.set(TABLET_WINDOW);
      await render(<FaceIDScreen navigation={makeNav()} />);

      expect(screen.getByRole('button', { name: 'Use my password instead' })).toHaveStyle({
        minHeight: 44,
      });
    });

    it('still shows the success state after the scan completes', async () => {
      Dimensions.set(TABLET_WINDOW);
      await render(<FaceIDScreen navigation={makeNav()} />);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('✓  Face recognised')).toBeTruthy();
    });
  });
});
