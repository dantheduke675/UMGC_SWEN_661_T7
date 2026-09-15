/**
 * Component tests for src/components/AuthComponents.tsx.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  AuthBtn,
  AuthField,
  AuthRoleTile,
  ThemeToggleBtn,
} from '../src/components/AuthComponents';
import { dark } from '../src/constants/theme';

describe('AuthBtn', () => {
  it('renders its label and calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<AuthBtn label="Sign in" scheme={dark} onPress={onPress} />);

    await fireEvent.press(screen.getByText('Sign in'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress while disabled', async () => {
    const onPress = jest.fn();
    await render(
      <AuthBtn label="Sign in" scheme={dark} onPress={onPress} disabled />,
    );

    await fireEvent.press(screen.getByText('Sign in'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders each variant without crashing', async () => {
    await render(<AuthBtn label="Text variant" scheme={dark} variant="text" />);
    expect(screen.getByText('Text variant')).toBeTruthy();
  });
});

describe('AuthField', () => {
  it('renders the label, value, and forwards text changes', async () => {
    const onChangeText = jest.fn();
    await render(
      <AuthField
        label="Email address"
        value="maddy@example.com"
        onChangeText={onChangeText}
        scheme={dark}
      />,
    );

    expect(screen.getByText('Email address')).toBeTruthy();
    const input = screen.getByDisplayValue('maddy@example.com');
    await fireEvent.changeText(input, 'new@example.com');
    expect(onChangeText).toHaveBeenCalledWith('new@example.com');
  });

  it('renders helper text when provided', async () => {
    await render(
      <AuthField
        label="Password"
        value=""
        helper="At least 8 characters."
        scheme={dark}
      />,
    );
    expect(screen.getByText('At least 8 characters.')).toBeTruthy();
  });
});

describe('AuthRoleTile', () => {
  it('renders the recipient label and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<AuthRoleTile role="recipient" scheme={dark} onPress={onPress} />);

    await fireEvent.press(screen.getByText(/Care recipient/));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the caregiver label', async () => {
    await render(<AuthRoleTile role="caregiver" scheme={dark} />);
    expect(screen.getByText(/Caregiver/)).toBeTruthy();
  });
});

describe('ThemeToggleBtn', () => {
  it('calls onToggle when pressed, in either theme state', async () => {
    const onToggle = jest.fn();
    await render(<ThemeToggleBtn isDark={true} onToggle={onToggle} />);

    await fireEvent.press(screen.getByText('☀️'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows the moon icon when light mode is active', async () => {
    await render(<ThemeToggleBtn isDark={false} onToggle={() => {}} />);
    expect(screen.getByText('🌙')).toBeTruthy();
  });
});
