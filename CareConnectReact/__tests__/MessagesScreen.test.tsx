/**
 * Component tests for MessagesScreen — thread list rendering and navigation
 * into a thread.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ScrollProvider } from '../src/context/ScrollContext';
import MessagesScreen from '../src/screens/MessagesScreen';
import { threads, contactById } from '../src/constants/data';
import { dark } from '../src/constants/theme';

function renderScreen(onOpenThread?: (id: number) => void) {
  return render(
    <ScrollProvider>
      <MessagesScreen scheme={dark} onOpenThread={onOpenThread} />
    </ScrollProvider>,
  );
}

describe('MessagesScreen', () => {
  it('shows the conversation count in the subheading', async () => {
    await renderScreen();
    expect(screen.getByText(`${threads.length} conversations`)).toBeTruthy();
  });

  it('renders a row for every thread with contact name and last message preview', async () => {
    await renderScreen();

    threads.forEach(thread => {
      const contact = contactById(thread.contactId);
      const lastMessage = thread.messages[thread.messages.length - 1];
      expect(screen.getByText(contact.name)).toBeTruthy();
      expect(screen.getByText(lastMessage.text)).toBeTruthy();
    });
  });

  it('calls onOpenThread with the correct thread id when a row is tapped', async () => {
    const onOpenThread = jest.fn();
    await renderScreen(onOpenThread);

    const secondThread = threads[1];
    const secondContact = contactById(secondThread.contactId);
    await fireEvent.press(screen.getByText(secondContact.name));

    expect(onOpenThread).toHaveBeenCalledWith(secondThread.id);
  });

  describe('accessibility', () => {
    it('exposes each thread row as a single named button summarizing sender, role, and preview', async () => {
      await renderScreen();

      const thread = threads[0];
      const contact = contactById(thread.contactId);
      const lastMessage = thread.messages[thread.messages.length - 1];

      const row = screen.getByRole('button', { name: new RegExp(`^${contact.name}, ${contact.role}`) });
      expect(row).toHaveAccessibleName(new RegExp(lastMessage.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });

    it('includes "unread" in the accessible name of an unread thread', async () => {
      await renderScreen();

      const unreadThread = threads.find(t => t.unread);
      if (!unreadThread) return; // no unread thread in the fixture data — nothing to assert
      const contact = contactById(unreadThread.contactId);

      expect(
        screen.getByRole('button', { name: new RegExp(`^${contact.name}, ${contact.role}, unread`) }),
      ).toBeOnTheScreen();
    });
  });
});
