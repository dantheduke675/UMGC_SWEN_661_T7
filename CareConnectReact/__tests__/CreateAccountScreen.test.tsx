/**
 * Component tests for CreateAccountScreen — form fields and role-tile
 * navigation.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CreateAccountScreen from '../src/screens/CreateAccountScreen';

function makeNav() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

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
});
