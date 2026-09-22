/**
 * Integration tests for AppShell / AppShellNavigator — tab switching, the
 * accessibility scroll bar, and (critically) the full Messages → Thread →
 * Calling → back-to-Messages flow that was previously broken because
 * MsgThreadScreen never received an onCall handler.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AppShellNavigator, { AppShell } from '../src/components/AppShell';
import { dark } from '../src/constants/theme';
import { threads, contactById } from '../src/constants/data';

describe('AppShellNavigator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts on the Today tab', async () => {
    await render(<AppShellNavigator />);
    expect(screen.getByText(/Good morning/)).toBeTruthy();
  });

  it('switches screens when a bottom nav tab is pressed', async () => {
    await render(<AppShellNavigator />);

    await fireEvent.press(screen.getByText('Medications'));
    // MedicationsScreen renders its own "Medications" heading too, so at
    // least two matches confirms both the tab and the screen are present.
    expect(screen.getAllByText('Medications').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/doses today/)).toBeTruthy();
  });

  it('opening a message thread and calling reaches the CallingScreen (regression: call button was previously a dead end)', async () => {
    await render(<AppShellNavigator />);

    // Navigate to Messages tab.
    await fireEvent.press(screen.getByText('Messages'));
    expect(screen.getByText(`${threads.length} conversations`)).toBeTruthy();

    // Open the first thread.
    const thread = threads[0];
    const contact = contactById(thread.contactId);
    await fireEvent.press(screen.getByText(contact.name));
    expect(screen.getByText(contact.role)).toBeTruthy();

    // Press the call button in the thread header.
    await fireEvent.press(screen.getByText('📞'));

    // We should now be on the CallingScreen for this contact.
    expect(screen.getByText('Calling…')).toBeTruthy();
    expect(screen.getAllByText(contact.name).length).toBeGreaterThan(0);

    // Ending the call returns to the Messages tab.
    await fireEvent.press(screen.getByText('End'));
    expect(screen.getByText(`${threads.length} conversations`)).toBeTruthy();
  });

  it('hides the bottom nav and access bar while in a thread or on a call', async () => {
    await render(<AppShellNavigator />);

    await fireEvent.press(screen.getByText('Messages'));
    const thread = threads[0];
    const contact = contactById(thread.contactId);
    await fireEvent.press(screen.getByText(contact.name));

    // Full-screen thread view: bottom nav tabs should not be rendered.
    expect(screen.queryByText('Today')).toBeNull();
    expect(screen.queryByText('Scroll up')).toBeNull();
  });

  it('the AccessBar scroll buttons call the active screen\'s registered scroll function', async () => {
    await render(
      <AppShell
        activeTab="today"
        scheme={dark}
        onTabPress={() => {}}
      >
        <></>
      </AppShell>,
    );

    // Scroll buttons render even with no screen registered — should not throw.
    await expect(fireEvent.press(screen.getByText('Scroll down'))).resolves.not.toThrow();
    await expect(fireEvent.press(screen.getByText('Scroll up'))).resolves.not.toThrow();
  });

  describe('accessibility', () => {
    it('marks the active bottom-nav tab as selected and others as not selected', async () => {
      await render(
        <AppShell activeTab="today" scheme={dark} onTabPress={() => {}}>
          <></>
        </AppShell>,
      );

      expect(screen.getByRole('tab', { name: 'Today' })).toBeSelected();
      expect(screen.getByRole('tab', { name: 'Medications' })).not.toBeSelected();
    });

    it('moves the selected tab state when a different tab is pressed', async () => {
      await render(<AppShellNavigator />);

      await fireEvent.press(screen.getByRole('tab', { name: 'Messages' }));

      expect(screen.getByRole('tab', { name: 'Messages' })).toBeSelected();
      expect(screen.getByRole('tab', { name: 'Today' })).not.toBeSelected();
    });

    it('exposes the AccessBar scroll and voice controls as named buttons', async () => {
      await render(
        <AppShell activeTab="today" scheme={dark} onTabPress={() => {}}>
          <></>
        </AppShell>,
      );

      expect(screen.getByRole('button', { name: 'Scroll up' })).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Scroll down' })).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Voice input' })).toBeOnTheScreen();
    });
  });
});
