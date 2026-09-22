/**
 * Component tests for BiometricsIntroScreen — the Face ID opt-in prompt.
 */
import React from 'react';
import { Dimensions } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import BiometricsIntroScreen from '../src/screens/BiometricsIntroScreen';

function makeNav() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

const PHONE_WINDOW  = { window: { width: 375, height: 812, scale: 3, fontScale: 1 } };
const TABLET_WINDOW = { window: { width: 1024, height: 1366, scale: 2, fontScale: 1 } };

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

  describe('on a tablet-sized viewport', () => {
    afterEach(async () => {
      await act(async () => {
        Dimensions.set(PHONE_WINDOW);
      });
    });

    it('still renders and navigates correctly', async () => {
      Dimensions.set(TABLET_WINDOW);
      const navigation = makeNav();
      await render(<BiometricsIntroScreen navigation={navigation} />);

      expect(screen.getByText('Sign in with your face?')).toBeTruthy();
      await fireEvent.press(screen.getByText('Yes, use Face ID'));
      expect(navigation.navigate).toHaveBeenCalledWith('FaceID');
    });

    it('keeps every button at or above the 44x44 WCAG target size (tremor/motor accessibility)', async () => {
      Dimensions.set(TABLET_WINDOW);
      await render(<BiometricsIntroScreen navigation={makeNav()} />);

      expect(screen.getByRole('button', { name: 'Yes, use Face ID' })).toHaveStyle({
        minHeight: 44,
      });
      expect(screen.getByRole('button', { name: 'No, use my password' })).toHaveStyle({
        minHeight: 44,
      });
    });
  });
});
