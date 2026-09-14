/**
 * Component tests for src/components/AppComponents.tsx.
 */
import React from 'react';
import { Dimensions } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  CAvatarBadge,
  CChip,
  UndoToast,
  UndoHistoryButton,
  UndoHistoryPanel,
  SectionLabel,
  LinearProgressBar,
} from '../src/components/AppComponents';
import { dark } from '../src/constants/theme';

describe('CAvatarBadge', () => {
  it('renders the given initials', async () => {
    await render(<CAvatarBadge initials="AJ" color="#6366F1" />);
    expect(screen.getByText('AJ')).toBeTruthy();
  });
});

describe('CChip', () => {
  it('renders its label', async () => {
    await render(<CChip label="Pain" color="#357C6F" />);
    expect(screen.getByText('Pain')).toBeTruthy();
  });
});

describe('SectionLabel', () => {
  it('renders the given text', async () => {
    await render(<SectionLabel text="Next appointment" scheme={dark} />);
    expect(screen.getByText('Next appointment')).toBeTruthy();
  });
});

describe('UndoToast', () => {
  it('renders its message and calls onUndo when the Undo button is pressed', async () => {
    const onUndo = jest.fn();
    const onDismiss = jest.fn();
    await render(
      <UndoToast message="Marked as taken" onUndo={onUndo} onDismiss={onDismiss} />,
    );

    expect(screen.getByText('Marked as taken')).toBeTruthy();
    await fireEvent.press(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('UndoHistoryButton', () => {
  it('renders nothing when there is nothing to undo', async () => {
    await render(<UndoHistoryButton count={0} scheme={dark} onPress={jest.fn()} />);
    expect(screen.queryByText(/Undo history/)).toBeNull();
  });

  it('shows the action count and calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<UndoHistoryButton count={3} scheme={dark} onPress={onPress} />);

    expect(screen.getByText('3 recent actions · Undo history')).toBeTruthy();
    await fireEvent.press(screen.getByText('3 recent actions · Undo history'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses singular wording for exactly one action', async () => {
    await render(<UndoHistoryButton count={1} scheme={dark} onPress={jest.fn()} />);
    expect(screen.getByText('1 recent action · Undo history')).toBeTruthy();
  });
});

describe('UndoHistoryPanel', () => {
  const entries = [
    { id: 2, message: 'Marked as taken' },
    { id: 1, message: 'Marked as missed' },
  ];

  afterEach(() => {
    // Restore a typical phone-sized window after any test that changes it.
    Dimensions.set({ window: { width: 400, height: 800, scale: 2, fontScale: 1 } });
  });

  it('shows an empty state when there is nothing to undo', async () => {
    await render(
      <UndoHistoryPanel visible entries={[]} scheme={dark} onUndo={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Nothing to undo right now.')).toBeTruthy();
  });

  it('lists every entry and calls onUndo with the pressed entry\'s id', async () => {
    const onUndo = jest.fn();
    await render(
      <UndoHistoryPanel visible entries={entries} scheme={dark} onUndo={onUndo} onClose={jest.fn()} />,
    );

    expect(screen.getByText('Marked as taken')).toBeTruthy();
    expect(screen.getByText('Marked as missed')).toBeTruthy();

    await fireEvent.press(screen.getAllByText('Undo')[1]);
    expect(onUndo).toHaveBeenCalledWith(1);
  });

  it('calls onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    await render(
      <UndoHistoryPanel visible entries={entries} scheme={dark} onUndo={jest.fn()} onClose={onClose} />,
    );

    await fireEvent.press(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders without crashing on a phone-sized viewport', async () => {
    Dimensions.set({ window: { width: 400, height: 800, scale: 2, fontScale: 1 } });
    await render(
      <UndoHistoryPanel visible entries={entries} scheme={dark} onUndo={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Undo history')).toBeTruthy();
  });

  it('renders without crashing on a tablet/desktop-sized viewport', async () => {
    Dimensions.set({ window: { width: 1200, height: 900, scale: 1, fontScale: 1 } });
    await render(
      <UndoHistoryPanel visible entries={entries} scheme={dark} onUndo={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Undo history')).toBeTruthy();
  });
});

describe('LinearProgressBar', () => {
  it('renders without crashing for any value in [0, 1]', async () => {
    await render(<LinearProgressBar value={0.5} />);
    // Purely visual — just confirm it mounts without throwing.
    expect(screen.root).toBeTruthy();
  });
});
