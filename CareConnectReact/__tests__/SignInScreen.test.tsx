/**
 * Component tests for SignInScreen — form fields and navigation.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SignInScreen from '../src/screens/SignInScreen';

function makeNav() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

describe('SignInScreen', () => {
  it('pre-fills the email field', async () => {
    await render(<SignInScreen navigation={makeNav()} />);
    expect(screen.getByDisplayValue('maddy@example.com')).toBeTruthy();
  });

  it('updates the password field as the user types', async () => {
    await render(<SignInScreen navigation={makeNav()} />);
    const inputs = screen.getAllByDisplayValue('');
    await fireEvent.changeText(inputs[0], 'secret123');
    expect(screen.getByDisplayValue('secret123')).toBeTruthy();
  });

  it('navigates to Today when Sign in is pressed', async () => {
    const navigation = makeNav();
    await render(<SignInScreen navigation={navigation} />);

    // "Sign in" also appears as the screen heading — the button is the
    // second match (rendered after the heading in the tree).
    const matches = screen.getAllByText('Sign in');
    expect(matches.length).toBe(2);
    await fireEvent.press(matches[1]);
    expect(navigation.navigate).toHaveBeenCalledWith('Today');
  });

  it('navigates to FaceID when the alternate path is pressed', async () => {
    const navigation = makeNav();
    await render(<SignInScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText('Use Face ID instead'));
    expect(navigation.navigate).toHaveBeenCalledWith('FaceID');
  });

  it('goes back when the back button is pressed', async () => {
    const navigation = makeNav();
    await render(<SignInScreen navigation={navigation} />);

    await fireEvent.press(screen.getByText('← Back'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
