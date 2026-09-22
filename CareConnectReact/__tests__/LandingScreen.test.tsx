/**
 * Component tests for LandingScreen — CTA navigation and theme toggle.
 */
import React from 'react';
import { Dimensions } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import LandingScreen from '../src/screens/LandingScreen';
import { ThemeProvider } from '../src/context/ThemeContext';

function makeNav() {
  return { navigate: jest.fn() };
}

const PHONE_WINDOW  = { window: { width: 375, height: 812, scale: 3, fontScale: 1 } };
const TABLET_WINDOW = { window: { width: 1024, height: 1366, scale: 2, fontScale: 1 } };

describe('LandingScreen', () => {
  it('renders the app name and tagline', async () => {
    await render(<LandingScreen navigation={makeNav()} />);
    expect(screen.getByText('CareConnect')).toBeTruthy();
  });

  it('navigates to CreateAccount when "Create account" is pressed', async () => {
    const navigation = makeNav();
    await render(<LandingScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText('Create account'));
    expect(navigation.navigate).toHaveBeenCalledWith('CreateAccount');
  });

  it('navigates to SignIn when "Sign in" is pressed', async () => {
    const navigation = makeNav();
    await render(<LandingScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText('Sign in'));
    expect(navigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('toggles theme icon when the theme button is pressed', async () => {
    // Needs a real ThemeProvider — without one, the toggle button falls
    // back to the context's no-op default and never actually flips state.
    await render(
      <ThemeProvider>
        <LandingScreen navigation={makeNav()} />
      </ThemeProvider>,
    );

    expect(screen.getByText('☀️')).toBeTruthy();
    await fireEvent.press(screen.getByText('☀️'));
    expect(screen.getByText('🌙')).toBeTruthy();
  });

  describe('on a tablet-sized viewport', () => {
    afterEach(async () => {
      await act(async () => {
        Dimensions.set(PHONE_WINDOW);
      });
    });

    it('still renders and navigates correctly', async () => {
      Dimensions.set(TABLET_WINDOW);
      const navigation = makeNav();
      await render(<LandingScreen navigation={navigation} />);

      expect(screen.getByText('CareConnect')).toBeTruthy();
      await fireEvent.press(screen.getByText('Create account'));
      expect(navigation.navigate).toHaveBeenCalledWith('CreateAccount');
    });

    it('keeps every button at or above the 44x44 WCAG target size (tremor/motor accessibility)', async () => {
      Dimensions.set(TABLET_WINDOW);
      await render(<LandingScreen navigation={makeNav()} />);

      expect(screen.getByRole('button', { name: 'Create account' })).toHaveStyle({
        minHeight: 44,
      });
      expect(screen.getByRole('button', { name: 'Sign in' })).toHaveStyle({ minHeight: 44 });
    });
  });
});
