/**
 * Component tests for CreateAccountScreen — form fields and role-tile
 * navigation.
 */
import React from 'react';
import { Dimensions } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import CreateAccountScreen from '../src/screens/CreateAccountScreen';

function makeNav() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

const PHONE_WINDOW  = { window: { width: 375, height: 812, scale: 3, fontScale: 1 } };
const TABLET_WINDOW = { window: { width: 1024, height: 1366, scale: 2, fontScale: 1 } };

describe('CreateAccountScreen', () => {
  it('pre-fills name and email fields', async () => {
    await render(<CreateAccountScreen navigation={makeNav()} />);
    expect(screen.getByDisplayValue('Maddy Chen')).toBeTruthy();
    expect(screen.getByDisplayValue('maddy@example.com')).toBeTruthy();
  });

  it('navigates to BiometricsIntro when the recipient role tile is pressed', async () => {
    const navigation = makeNav();
    await render(<CreateAccountScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText(/Care recipient/));
    expect(navigation.navigate).toHaveBeenCalledWith('BiometricsIntro');
  });

  it('does not navigate when the caregiver role tile is pressed (not yet implemented)', async () => {
    const navigation = makeNav();
    await render(<CreateAccountScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText(/Caregiver/));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('goes back when the back button is pressed', async () => {
    const navigation = makeNav();
    await render(<CreateAccountScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText('← Back'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  describe('on a tablet-sized viewport', () => {
    afterEach(async () => {
      await act(async () => {
        Dimensions.set(PHONE_WINDOW);
      });
    });

    it('still renders the form and role tiles navigate correctly', async () => {
      Dimensions.set(TABLET_WINDOW);
      const navigation = makeNav();
      await render(<CreateAccountScreen navigation={navigation} />);

      expect(screen.getByDisplayValue('Maddy Chen')).toBeTruthy();
      await fireEvent.press(screen.getByText(/Care recipient/));
      expect(navigation.navigate).toHaveBeenCalledWith('BiometricsIntro');
    });

    it('keeps every button and role tile at or above the 44x44 WCAG target size (tremor/motor accessibility)', async () => {
      Dimensions.set(TABLET_WINDOW);
      await render(<CreateAccountScreen navigation={makeNav()} />);

      expect(screen.getByRole('button', { name: 'Back' })).toHaveStyle({ minHeight: 44 });
      expect(screen.getByRole('button', { name: 'Care recipient' })).toHaveStyle({
        minHeight: 44,
      });
      expect(screen.getByRole('button', { name: 'Caregiver' })).toHaveStyle({ minHeight: 44 });
    });
  });
});
