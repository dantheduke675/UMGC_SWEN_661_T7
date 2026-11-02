/**
 * Component tests for SignInScreen — form fields and navigation.
 */
import React from 'react';
import { AccessibilityInfo, Dimensions } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import SignInScreen from '../src/screens/SignInScreen';

function makeNav() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

const PHONE_WINDOW  = { window: { width: 375, height: 812, scale: 3, fontScale: 1 } };
const TABLET_WINDOW = { window: { width: 1024, height: 1366, scale: 2, fontScale: 1 } };

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
    await fireEvent.changeText(screen.getByLabelText('Password'), 'SuperSecret1');
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

  describe('input errors', () => {
    const pressSignIn = () => fireEvent.press(screen.getAllByText('Sign in')[1]);

    it('does not sign in with an empty password, and says so in text next to the field', async () => {
      const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
      const navigation = makeNav();
      await render(<SignInScreen navigation={navigation} />);

      await pressSignIn();

      expect(navigation.navigate).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('⚠ Enter your password.');
      // The field itself carries the error, so it is heard again on return to it
      expect(screen.getByLabelText('Password')).toHaveProp(
        'accessibilityHint',
        expect.stringContaining('Error: Enter your password.'),
      );
      expect(announce).toHaveBeenCalledWith(expect.stringContaining('There is 1 problem with the form.'));
      announce.mockRestore();
    });

    it('explains how to fix an email address without an @ and a domain', async () => {
      await render(<SignInScreen navigation={makeNav()} />);
      await fireEvent.changeText(screen.getByLabelText('Email address'), 'maddy.example.com');
      await fireEvent.changeText(screen.getByLabelText('Password'), 'SuperSecret1');

      await pressSignIn();

      expect(screen.getByRole('alert')).toHaveTextContent(/like name@example\.com/);
    });

    it('reports both problems when both fields are wrong', async () => {
      await render(<SignInScreen navigation={makeNav()} />);
      await fireEvent.changeText(screen.getByLabelText('Email address'), '');

      await pressSignIn();

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toHaveTextContent('⚠ Enter your email address.');
      expect(alerts[1]).toHaveTextContent('⚠ Enter your password.');
    });

    it('clears an error as soon as its field is edited, then signs in', async () => {
      const navigation = makeNav();
      await render(<SignInScreen navigation={navigation} />);
      await pressSignIn();
      expect(screen.getByRole('alert')).toBeOnTheScreen();

      await fireEvent.changeText(screen.getByLabelText('Password'), 'SuperSecret1');
      expect(screen.queryByRole('alert')).toBeNull();

      await pressSignIn();
      expect(navigation.navigate).toHaveBeenCalledWith('Today');
    });
  });

  describe('on a tablet-sized viewport', () => {
    afterEach(async () => {
      await act(async () => {
        Dimensions.set(PHONE_WINDOW);
      });
    });

    it('still renders the form and lets sign-in proceed', async () => {
      Dimensions.set(TABLET_WINDOW);
      const navigation = makeNav();
      await render(<SignInScreen navigation={navigation} />);

      expect(screen.getByDisplayValue('maddy@example.com')).toBeTruthy();
      await fireEvent.changeText(screen.getByLabelText('Password'), 'SuperSecret1');
      const matches = screen.getAllByText('Sign in');
      await fireEvent.press(matches[matches.length - 1]);
      expect(navigation.navigate).toHaveBeenCalledWith('Today');
    });

    it('keeps every button at or above the 44x44 WCAG target size (tremor/motor accessibility)', async () => {
      Dimensions.set(TABLET_WINDOW);
      await render(<SignInScreen navigation={makeNav()} />);

      expect(screen.getByRole('button', { name: 'Back' })).toHaveStyle({ minHeight: 44 });
      expect(screen.getByRole('button', { name: 'Sign in' })).toHaveStyle({ minHeight: 44 });
      expect(screen.getByRole('button', { name: 'Use Face ID instead' })).toHaveStyle({
        minHeight: 44,
      });
    });
  });
});
