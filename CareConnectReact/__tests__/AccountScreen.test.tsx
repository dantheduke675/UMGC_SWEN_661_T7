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
});
