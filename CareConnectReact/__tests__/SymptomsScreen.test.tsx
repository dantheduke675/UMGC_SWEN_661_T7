/**
 * Component tests for SymptomsScreen — expanding the logger, picking a
 * symptom + severity, and submitting a new log entry.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ScrollProvider } from '../src/context/ScrollContext';
import SymptomsScreen from '../src/screens/SymptomsScreen';
import { dark } from '../src/constants/theme';

function renderScreen() {
  return render(
    <ScrollProvider>
      <SymptomsScreen scheme={dark} />
    </ScrollProvider>,
  );
}

describe('SymptomsScreen', () => {
  it('renders the initial log history', async () => {
    await renderScreen();
    expect(screen.getByText('Mild knee ache after morning walk')).toBeTruthy();
    expect(screen.getByText('Brief episode when standing')).toBeTruthy();
  });

  it('the logger form is collapsed by default', async () => {
    await renderScreen();
    expect(screen.queryByText('What are you feeling?')).toBeNull();
  });

  it('tapping "Log a symptom" expands the form', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByText('Log a symptom'));
    expect(screen.getByText('What are you feeling?')).toBeTruthy();
    expect(screen.getByText('Severity')).toBeTruthy();
  });

  it('the submit button is disabled (no-op) until a symptom is selected', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByText('Log a symptom'));

    await fireEvent.press(screen.getByText('Log symptom'));
    // Still on 5 pre-seeded logs — nothing new was added.
    expect(screen.getAllByText(/Today|Yesterday|Mon/).length).toBe(5);
  });

  it('selecting a symptom and submitting adds a new log entry with the default severity', async () => {
    await renderScreen();
    // Two pre-seeded logs (Fatigue, Headache) already carry the default
    // severity badge (3/5) — capture the count before adding a new one.
    const before = screen.getAllByText('3/5').length;

    await fireEvent.press(screen.getByText('Log a symptom'));
    await fireEvent.press(screen.getByText('Breathing'));
    await fireEvent.press(screen.getByText('Log symptom'));

    // A 6th "Today · h:mm AM/PM" style entry should now exist, logged at
    // the default severity (3/5).
    expect(screen.getAllByText(/Today|Yesterday|Mon/).length).toBe(6);
    expect(screen.getAllByText('3/5').length).toBe(before + 1);
  });

  it('submitting collapses the logger and clears the selection', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByText('Log a symptom'));
    await fireEvent.press(screen.getByText('Breathing'));
    await fireEvent.press(screen.getByText('Log symptom'));

    expect(screen.queryByText('What are you feeling?')).toBeNull();
  });
});
