/**
 * Component tests for CallingScreen — connect sequence, elapsed timer,
 * mute / speaker toggles, and ending the call.
 */
import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import CallingScreen from '../src/screens/CallingScreen';
import { contactById } from '../src/constants/data';

describe('CallingScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows "Calling…" before the 2s auto-connect', async () => {
    await render(<CallingScreen contactId={1} onEnd={() => {}} />);
    expect(screen.getByText('Calling…')).toBeTruthy();
  });

  it('renders the contact name and role', async () => {
    const contact = contactById(2);
    await render(<CallingScreen contactId={2} onEnd={() => {}} />);
    expect(screen.getByText(contact.name)).toBeTruthy();
    expect(screen.getByText(contact.role)).toBeTruthy();
  });

  it('transitions to "On call" and starts the elapsed timer after 2s', async () => {
    await render(<CallingScreen contactId={1} onEnd={() => {}} />);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('On call')).toBeTruthy();
    expect(screen.getByText('0:00')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('0:03')).toBeTruthy();
  });

  it('toggles mute label/state when the mute button is pressed', async () => {
    await render(<CallingScreen contactId={1} onEnd={() => {}} />);

    expect(screen.getByText('Mute')).toBeTruthy();
    await fireEvent.press(screen.getByText('Mute'));
    expect(screen.getByText('Unmute')).toBeTruthy();
  });

  it('toggles speaker label/state when the speaker button is pressed', async () => {
    await render(<CallingScreen contactId={1} onEnd={() => {}} />);

    expect(screen.getByText('Earpiece')).toBeTruthy();
    await fireEvent.press(screen.getByText('Earpiece'));
    expect(screen.getByText('Speaker')).toBeTruthy();
  });

  it('calls onEnd when the End button is pressed', async () => {
    const onEnd = jest.fn();
    await render(<CallingScreen contactId={1} onEnd={onEnd} />);

    await fireEvent.press(screen.getByText('End'));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('calls onEnd when the top-left back arrow is pressed', async () => {
    const onEnd = jest.fn();
    await render(<CallingScreen contactId={1} onEnd={onEnd} />);

    await fireEvent.press(screen.getByText('←'));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
