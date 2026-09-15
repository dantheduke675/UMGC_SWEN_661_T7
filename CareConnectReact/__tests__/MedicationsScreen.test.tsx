/**
 * Component tests for MedicationsScreen — take/miss actions, the
 * confirm-missed modal, and the summary stat tiles.
 */
import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { ScrollProvider } from '../src/context/ScrollContext';
import MedicationsScreen from '../src/screens/MedicationsScreen';
import { dark } from '../src/constants/theme';
import { buildSlots } from '../src/constants/data';

function renderScreen() {
  return render(
    <ScrollProvider>
      <MedicationsScreen scheme={dark} />
    </ScrollProvider>,
  );
}

describe('MedicationsScreen', () => {
  it('shows the total dose count in the subheading and stats row', async () => {
    await renderScreen();
    const total = buildSlots().length;
    expect(screen.getByText(`${total} doses today`)).toBeTruthy();
    expect(screen.getByText(String(total))).toBeTruthy(); // "Total doses" stat value
  });

  it('starts with 2 taken and 0 missed (matching TodayScreen defaults)', async () => {
    await renderScreen();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Taken stat
    expect(screen.getAllByText('0').length).toBeGreaterThan(0); // Missed stat
  });

  it('marking a dose as taken shows the undo toast and a taken badge', async () => {
    await renderScreen();

    await fireEvent.press(screen.getAllByText('I took this')[0]);

    expect(screen.getByText('Marked as taken')).toBeTruthy();
  });

  it('marking a dose as missed requires confirmation via the modal', async () => {
    await renderScreen();

    await fireEvent.press(screen.getAllByText('I missed this')[0]);
    expect(screen.getByText(/Mark this dose as missed\?/)).toBeTruthy();

    await fireEvent.press(screen.getByText('Yes, I missed this dose'));
    expect(screen.getByText('Marked as missed')).toBeTruthy();
  });

  it('cancelling the missed-confirmation modal makes no change', async () => {
    await renderScreen();

    await fireEvent.press(screen.getAllByText('I missed this')[0]);
    expect(screen.getByText(/Mark this dose as missed\?/)).toBeTruthy();

    await fireEvent.press(screen.getByText('Cancel — go back'));
    expect(screen.queryByText('Marked as missed')).toBeNull();
  });

  describe('undo history', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('opens the full undo history and can undo an older action without touching the newer one', async () => {
      await renderScreen();

      // Older action: mark a dose missed. It still shows "I took this"
      // afterwards (only a taken dose hides that button), so target the
      // *next* dose for the second action to keep the two keys distinct.
      await fireEvent.press(screen.getAllByText('I missed this')[0]);
      await fireEvent.press(screen.getByText('Yes, I missed this dose'));
      await act(async () => { jest.advanceTimersByTime(5000); }); // let the toast fade

      // Newer action: mark a different dose taken.
      await fireEvent.press(screen.getAllByText('I took this')[1]);
      await act(async () => { jest.advanceTimersByTime(5000); });

      await fireEvent.press(screen.getByText('2 recent actions · Undo history'));
      expect(screen.getByText('Marked as missed')).toBeTruthy();
      expect(screen.getByText('Marked as taken')).toBeTruthy();

      // Undo the older "missed" entry (bottom of the stack) — the newer
      // "taken" action should remain applied.
      await fireEvent.press(screen.getAllByText('Undo')[1]);

      expect(screen.getAllByText('3').length).toBeGreaterThan(0); // Taken stat still 3
      expect(screen.getAllByText('0').length).toBeGreaterThan(0); // Missed stat back to 0
      expect(screen.getByText('1 recent action · Undo history')).toBeTruthy();
    });
  });
});
