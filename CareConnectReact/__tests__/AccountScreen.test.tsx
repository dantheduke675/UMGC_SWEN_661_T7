/**
 * Component tests for AccountScreen — profile info, care-team messaging
 * shortcut, theme toggle, and sign out.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ScrollProvider } from '../src/context/ScrollContext';
import AccountScreen from '../src/screens/AccountScreen';
import { dark } from '../src/constants/theme';
import { contacts, patient } from '../src/constants/data';

function renderScreen(props: Partial<React.ComponentProps<typeof AccountScreen>> = {}) {
  return render(
    <ScrollProvider>
      <AccountScreen scheme={dark} {...props} />
    </ScrollProvider>,
  );
}

describe('AccountScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the patient profile info', async () => {
    await renderScreen();
    expect(screen.getByText(patient.full)).toBeTruthy();
    expect(screen.getByText('Care recipient')).toBeTruthy();
  });

  it('renders a care-team tile for every contact', async () => {
    await renderScreen();
    contacts.forEach(c => {
      expect(screen.getByText(c.name)).toBeTruthy();
    });
  });

  it('calls onMessages when a care-team message button is tapped', async () => {
    const onMessages = jest.fn();
    await renderScreen({ onMessages });

    await fireEvent.press(screen.getAllByText('💬')[0]);
    expect(onMessages).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleTheme when the appearance switch is tapped', async () => {
    const onToggleTheme = jest.fn();
    await renderScreen({ onToggleTheme, isDark: true });

    // The moon emoji appears twice: once as the static PrefTile icon, once
    // as the ThemeSwitch thumb (the actual pressable) rendered after it.
    const moons = screen.getAllByText('🌙');
    expect(moons.length).toBe(2);
    await fireEvent.press(moons[1]);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('calls onSignOut when Sign out is tapped', async () => {
    const onSignOut = jest.fn();
    await renderScreen({ onSignOut });

    await fireEvent.press(screen.getByText('Sign out'));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  describe('accessibility', () => {
    it('exposes the care-team message button under a per-contact accessible name', async () => {
      await renderScreen();
      expect(
        screen.getByRole('button', { name: `Message ${contacts[0].name}` }),
      ).toBeOnTheScreen();
    });

    it('reflects the isDark prop as the appearance switch\'s checked state', async () => {
      await renderScreen({ isDark: true });
      expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeChecked();
    });

    it('reflects light mode as the appearance switch\'s unchecked state', async () => {
      await renderScreen({ isDark: false });
      expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked();
    });

    it('exposes Sign out as a named button', async () => {
      await renderScreen();
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeOnTheScreen();
    });
  });
});
