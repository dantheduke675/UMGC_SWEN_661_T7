/**
 * Component tests for FaceIDScreen — the simulated biometric scan and its
 * auto-navigation to Today after success.
 */
import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import FaceIDScreen from '../src/screens/FaceIDScreen';

function makeNav() {
  return { navigate: jest.fn() };
}

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
});
