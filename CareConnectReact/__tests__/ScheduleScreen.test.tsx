/**
 * Component tests for ScheduleScreen — week strip day selection and the
 * filtered appointment list / empty state.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ScrollProvider } from '../src/context/ScrollContext';
import ScheduleScreen from '../src/screens/ScheduleScreen';
import { dark } from '../src/constants/theme';

function renderScreen() {
  return render(
    <ScrollProvider>
      <ScheduleScreen scheme={dark} />
    </ScrollProvider>,
  );
}

// Mirrors ScheduleScreen's WeekStrip date math so the tests work on any
// day of the week, not just whichever day happens to run CI.
const APPT_OFFSETS = [0, 1, 2, 4];
function weekStripOffsets(): number[] {
  const today = new Date();
  const todayWd = today.getDay();
  const mondayOffset = todayWd === 0 ? -6 : 1 - todayWd;
  return Array.from({ length: 7 }, (_, i) => mondayOffset + i);
}

describe('ScheduleScreen', () => {
  it('defaults to "Today" and shows today\'s appointment', async () => {
    await renderScreen();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Dr. Chen — Follow-up')).toBeTruthy();
  });

  it('shows the appointment count in the subheading', async () => {
    await renderScreen();
    expect(screen.getByText('6 appointments this week')).toBeTruthy();
  });

  it('selecting a day with no appointments shows the empty state', async () => {
    await renderScreen();

    const offsets = weekStripOffsets();
    const emptyIndex = offsets.findIndex(o => !APPT_OFFSETS.includes(o));
    const dayCells = screen.getAllByText(/^\d{1,2}$/); // day-of-month numbers
    await fireEvent.press(dayCells[emptyIndex]);

    expect(screen.getByText('No appointments')).toBeTruthy();
    expect(screen.getByText('Enjoy your free day.')).toBeTruthy();
  });

  it('selecting another day with appointments shows them', async () => {
    await renderScreen();

    // The week strip only shows the current Mon–Sun week, so which
    // non-zero APPT offset is visible depends on today's weekday.
    const offsets = weekStripOffsets();
    const visibleOffset = [1, 2, 4].find(o => offsets.includes(o));
    if (visibleOffset === undefined) {
      // Weekend edge case: no non-"today" appointment falls inside this
      // week's strip. Nothing to assert.
      return;
    }

    const targetIndex = offsets.indexOf(visibleOffset);
    const dayCells = screen.getAllByText(/^\d{1,2}$/);
    await fireEvent.press(dayCells[targetIndex]);

    const expectedTitles: Record<number, string> = {
      1: 'Physical Therapy',
      2: 'Home Aide Visit',
      4: 'Cardiology Check-in',
    };
    expect(screen.getByText(expectedTitles[visibleOffset])).toBeTruthy();
  });

  describe('accessibility', () => {
    it('marks today\'s day cell as selected by default', async () => {
      await renderScreen();
      expect(screen.getByRole('button', { name: /today/i })).toBeSelected();
    });

    it('moves the selected state to whichever day cell is pressed', async () => {
      await renderScreen();

      const todayCell = screen.getByRole('button', { name: /today/i });
      const otherCells = screen
        .getAllByRole('button')
        .filter(cell => cell !== todayCell);

      await fireEvent.press(otherCells[0]);

      expect(todayCell).not.toBeSelected();
      expect(otherCells[0]).toBeSelected();
    });
  });
});
