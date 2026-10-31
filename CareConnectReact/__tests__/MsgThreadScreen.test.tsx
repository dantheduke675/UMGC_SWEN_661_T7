/**
 * Component tests for MsgThreadScreen — conversation view, quick replies,
 * and (critically) the call button that starts a CallingScreen session.
 */
import React from 'react';
import { FlatList } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import MsgThreadScreen from '../src/screens/MsgThreadScreen';
import { contactById, threadById } from '../src/constants/data';
import { dark } from '../src/constants/theme';

describe('MsgThreadScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the contact name and role in the header', async () => {
    const thread = threadById(1);
    const contact = contactById(thread.contactId);
    await render(<MsgThreadScreen threadId={1} scheme={dark} />);

    expect(screen.getByText(contact.name)).toBeTruthy();
    expect(screen.getByText(contact.role)).toBeTruthy();
  });

  it('renders every message in the thread', async () => {
    const thread = threadById(2);
    await render(<MsgThreadScreen threadId={2} scheme={dark} />);

    thread.messages.forEach(m => {
      expect(screen.getByText(m.text)).toBeTruthy();
    });
  });

  it('calls onBack when the back arrow is pressed', async () => {
    const onBack = jest.fn();
    await render(<MsgThreadScreen threadId={1} scheme={dark} onBack={onBack} />);

    await fireEvent.press(screen.getByText('←'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onCall with the contact id when the call button is pressed', async () => {
    const onCall = jest.fn();
    const thread = threadById(1);
    await render(
      <MsgThreadScreen threadId={1} scheme={dark} onCall={onCall} />,
    );

    await fireEvent.press(screen.getByText('📞'));
    expect(onCall).toHaveBeenCalledTimes(1);
    expect(onCall).toHaveBeenCalledWith(thread.contactId);
  });

  it('does not crash when the call button is pressed without an onCall handler', async () => {
    await render(<MsgThreadScreen threadId={1} scheme={dark} />);
    await expect(fireEvent.press(screen.getByText('📞'))).resolves.not.toThrow();
  });

  it('sends a typed message and appends it to the message list', async () => {
    await render(<MsgThreadScreen threadId={3} scheme={dark} />);

    const input = screen.getByPlaceholderText('Type a message…');
    await fireEvent.changeText(input, 'Feeling great today!');
    await fireEvent(input, 'submitEditing');

    expect(screen.getByText('Feeling great today!')).toBeTruthy();
  });

  describe('keeps the newest message in view', () => {
    let scrollToEnd: jest.SpyInstance;
    beforeEach(() => {
      scrollToEnd = jest.spyOn(FlatList.prototype, 'scrollToEnd');
    });
    afterEach(() => scrollToEnd.mockRestore());

    it('scrolls to the end, animated, after a message is sent', async () => {
      await render(<MsgThreadScreen threadId={1} scheme={dark} />);
      await fireEvent.changeText(screen.getByLabelText('Message'), 'On my way');
      scrollToEnd.mockClear();

      await fireEvent.press(screen.getByRole('button', { name: 'Send message' }));
      // After the new bubble is in the list (next animation frame)
      await act(() => jest.runOnlyPendingTimers());
      expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
    });

    it('jumps to the end whenever the list grows (opening the thread, new messages)', async () => {
      const thread = threadById(1);
      await render(<MsgThreadScreen threadId={1} scheme={dark} />);
      scrollToEnd.mockClear();

      // Bubbles up from a message to the list, as a real layout change does
      await fireEvent(screen.getByText(thread.messages[0].text), 'contentSizeChange', 390, 1600);
      expect(scrollToEnd).toHaveBeenCalledWith({ animated: false });
    });
  });

  it('clears the input after sending', async () => {
    await render(<MsgThreadScreen threadId={3} scheme={dark} />);

    const input = screen.getByPlaceholderText('Type a message…');
    await fireEvent.changeText(input, 'Hello there');
    await fireEvent(input, 'submitEditing');

    expect(screen.getByPlaceholderText('Type a message…').props.value).toBe('');
  });

  it('does not send a blank/whitespace-only message (input is left untouched)', async () => {
    await render(<MsgThreadScreen threadId={3} scheme={dark} />);

    const input = screen.getByPlaceholderText('Type a message…');
    await fireEvent.changeText(input, '   ');
    await fireEvent(input, 'submitEditing');

    // send() bails out before clearing input when the trimmed text is empty.
    expect(screen.getByPlaceholderText('Type a message…').props.value).toBe('   ');
  });

  it('tapping a quick reply sends it as a message', async () => {
    await render(<MsgThreadScreen threadId={2} scheme={dark} />);

    await fireEvent.press(screen.getByText('Thank you!'));
    // The quick reply chip and the newly-sent bubble both show the same text.
    expect(screen.getAllByText('Thank you!').length).toBeGreaterThanOrEqual(2);
  });

  describe('accessibility', () => {
    it('exposes the header back and call controls as named buttons', async () => {
      const contact = contactById(threadById(1).contactId);
      await render(<MsgThreadScreen threadId={1} scheme={dark} />);

      expect(screen.getByRole('button', { name: 'Back' })).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: `Call ${contact.name}` })).toBeOnTheScreen();
    });

    it('exposes the message input under an accessible name', async () => {
      await render(<MsgThreadScreen threadId={1} scheme={dark} />);
      expect(screen.getByLabelText('Message')).toHaveAccessibleName('Message');
    });

    it('disables the send button while the input is empty and enables it once text is typed', async () => {
      await render(<MsgThreadScreen threadId={1} scheme={dark} />);

      const sendBtn = screen.getByRole('button', { name: 'Send message' });
      expect(sendBtn).toBeDisabled();

      await fireEvent.changeText(screen.getByLabelText('Message'), 'Hi there');
      expect(sendBtn).toBeEnabled();
    });

    it('exposes each quick reply as a named button', async () => {
      await render(<MsgThreadScreen threadId={2} scheme={dark} />);
      expect(screen.getByRole('button', { name: 'Thank you!' })).toBeOnTheScreen();
    });
  });
});
