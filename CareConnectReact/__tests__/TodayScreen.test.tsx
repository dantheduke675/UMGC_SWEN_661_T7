/**
 * Component tests for TodayScreen — progress card, appointment card, and
 * marking medication slots as taken (with undo).
 */
import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { ScrollProvider } from '../src/context/ScrollContext';
import TodayScreen from '../src/screens/TodayScreen';
import { dark } from '../src/constants/theme';
import { buildSlots, patient } from '../src/constants/data';

function renderScreen() {
  return render(
    <ScrollProvider>
      <TodayScreen scheme={dark} />
    </ScrollProvider>,
  );
}

describe('TodayScreen', () => {
  it('greets the patient by name', async () => {
    await renderScreen();
    expect(screen.getByText(new RegExp(`Good morning, ${patient.name}`))).toBeTruthy();
  });

  it('shows the initial taken/total medication count', async () => {
    await renderScreen();
    const total = buildSlots().length;
    // Two slots ('1-0' and '3-0') are pre-marked as taken.
    expect(screen.getByText(`2 of ${total} taken`)).toBeTruthy();
  });

  it('marks a slot as taken, updates the count, and shows an undo toast', async () => {
    await renderScreen();
    const total = buildSlots().length;

    await fireEvent.press(screen.getAllByText('I took this')[0]);

    expect(screen.getByText(`3 of ${total} taken`)).toBeTruthy();
    expect(screen.getByText('Marked as taken')).toBeTruthy();
    expect(screen.getAllByText('✓ Taken').length).toBeGreaterThan(0);
  });

  it('undo reverts a slot back to not-taken', async () => {
    await renderScreen();
    const total = buildSlots().length;

    await fireEvent.press(screen.getAllByText('I took this')[0]);
    expect(screen.getByText(`3 of ${total} taken`)).toBeTruthy();

    await fireEvent.press(screen.getByText('Undo'));
    expect(screen.getByText(`2 of ${total} taken`)).toBeTruthy();
  });

  it('renders the next appointment card', async () => {
    await renderScreen();
    expect(screen.getByText('Dr. Chen — Follow-up')).toBeTruthy();
    expect(screen.getByText('2:30 PM')).toBeTruthy();
  });

  describe('undo history', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not show the undo history trigger until an action has been taken', async () => {
      await renderScreen();
      expect(screen.queryByText(/Undo history/)).toBeNull();
    });

    it('tracks every taken action on the stack, not just the latest', async () => {
      await renderScreen();

      await fireEvent.press(screen.getAllByText('I took this')[0]);
      await act(async () => { jest.advanceTimersByTime(5000); }); // let the toast fade
      await fireEvent.press(screen.getAllByText('I took this')[0]);
      await act(async () => { jest.advanceTimersByTime(5000); });

      expect(screen.getByText('2 recent actions · Undo history')).toBeTruthy();
    });

    it('opens the full history and can undo an older action while a newer one stays applied', async () => {
      await renderScreen();
      const total = buildSlots().length;

      await fireEvent.press(screen.getAllByText('I took this')[0]);
      await act(async () => { jest.advanceTimersByTime(5000); });
      await fireEvent.press(screen.getAllByText('I took this')[0]);
      await act(async () => { jest.advanceTimersByTime(5000); });

      await fireEvent.press(screen.getByText('2 recent actions · Undo history'));
      expect(screen.getAllByText('Marked as taken')).toHaveLength(2);

      // Undo the older (bottom-of-stack) entry, not the most recent one.
      await fireEvent.press(screen.getAllByText('Undo')[1]);

      // Only one of the two new "taken" actions was undone.
      expect(screen.getByText(`3 of ${total} taken`)).toBeTruthy();
      expect(screen.getByText('1 recent action · Undo history')).toBeTruthy();
    });
  });
});
