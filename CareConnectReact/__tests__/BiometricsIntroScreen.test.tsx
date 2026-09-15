/**
 * Component tests for BiometricsIntroScreen — the Face ID opt-in prompt.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import BiometricsIntroScreen from '../src/screens/BiometricsIntroScreen';

function makeNav() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

describe('BiometricsIntroScreen', () => {
  it('renders the heading', async () => {
    await render(<BiometricsIntroScreen navigation={makeNav()} />);
    expect(screen.getByText('Sign in with your face?')).toBeTruthy();
  });

  it('navigates to FaceID when "Yes, use Face ID" is pressed', async () => {
    const navigation = makeNav();
    await render(<BiometricsIntroScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText('Yes, use Face ID'));
    expect(navigation.navigate).toHaveBeenCalledWith('FaceID');
  });

  it('navigates to SignIn when "No, use my password" is pressed', async () => {
    const navigation = makeNav();
    await render(<BiometricsIntroScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText('No, use my password'));
    expect(navigation.navigate).toHaveBeenCalledWith('SignIn');
  });
});
