/**
 * Component tests for LandingScreen — CTA navigation and theme toggle.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LandingScreen from '../src/screens/LandingScreen';

function makeNav() {
  return { navigate: jest.fn() };
}

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
    await render(<LandingScreen navigation={makeNav()} />);

    expect(screen.getByText('☀️')).toBeTruthy();
    await fireEvent.press(screen.getByText('☀️'));
    expect(screen.getByText('🌙')).toBeTruthy();
  });
});
