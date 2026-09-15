/**
 * Component tests for MsgThreadScreen — conversation view, quick replies,
 * and (critically) the call button that starts a CallingScreen session.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
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
});
