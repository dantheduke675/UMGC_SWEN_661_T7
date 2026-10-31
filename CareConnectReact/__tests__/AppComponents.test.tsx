/**
 * Component tests for src/components/AppComponents.tsx.
 */
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import {
  CAvatarBadge,
  CChip,
  UndoToast,
  UndoHistoryButton,
  UndoHistoryPanel,
  SectionLabel,
  LinearProgressBar,
} from '../src/components/AppComponents';
import { dark, light } from '../src/constants/theme';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CAvatarBadge', () => {
  it('renders the given initials', async () => {
    await render(<CAvatarBadge initials="AJ" color="#6366F1" />);
    expect(screen.getByText('AJ')).toBeTruthy();
  });
});

// WCAG contrast of two '#RRGGBB' colours
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// '#RRGGBBAA' laid over a solid '#RRGGBB'
function over(fill: string, base: string) {
  const alpha = parseInt(fill.slice(7, 9), 16) / 255;
  const ch = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map(i => Math.round(ch(fill, i) * alpha + ch(base, i) * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

describe('primaryText token', () => {
  // The green text colour sits on pale primary tints ('14' to '21') as well as plain cards
  it.each([['dark', dark], ['light', light]] as const)('reads at 4.5:1 on every %s background and primary tint', (_, scheme) => {
    for (const card of [scheme.bg, scheme.surface, scheme.surface2]) {
      expect(contrast(scheme.primaryText, card)).toBeGreaterThanOrEqual(4.5);
      for (const alpha of ['14', '1A', '1F', '21']) {
        expect(contrast(scheme.primaryText, over(scheme.primary + alpha, card))).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('CChip', () => {
  it('renders its label', async () => {
    await render(<CChip label="Pain" color="#357C6F" scheme={dark} />);
    expect(screen.getByText('Pain')).toBeTruthy();
  });

  // The accents the app's chips use (category, appointment types, pending)
  it.each([
    ['dark', dark], ['light', light],
  ] as const)('label clears 4.5:1 against its own tinted fill on every %s background', async (_, scheme) => {
    for (const color of [scheme.primaryText, '#6366F1', '#F59E0B', '#22C55E', '#EF4444', scheme.sub]) {
      const { unmount } = await render(<CChip label="Chip" color={color} scheme={scheme} />);
      const text = StyleSheet.flatten(screen.getByText('Chip').props.style).color as string;
      const fill = StyleSheet.flatten(screen.getByText('Chip').parent!.props.style).backgroundColor as string;
      for (const card of [scheme.bg, scheme.surface, scheme.surface2]) {
        expect(contrast(text, over(fill, card))).toBeGreaterThanOrEqual(4.5);
      }
      await unmount();
    }
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

  afterEach(async () => {
    // Restore a typical phone-sized window after any test that changes it.
    await act(async () => {
      Dimensions.set({ window: { width: 400, height: 800, scale: 2, fontScale: 1 } });
    });
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
    await render(<LinearProgressBar value={0.5} label="Progress" />);
    // Purely visual — just confirm it mounts without throwing.
    expect(screen.root).toBeTruthy();
  });
});

describe('accessibility', () => {
  it('exposes CAvatarBadge under a caller-provided accessible name', async () => {
    await render(<CAvatarBadge initials="AJ" color="#6366F1" label="Aunt Joyce" />);
    expect(screen.getByRole('image', { name: 'Aunt Joyce' })).toBeOnTheScreen();
  });

  it('exposes SectionLabel as a header', async () => {
    await render(<SectionLabel text="Next appointment" scheme={dark} />);
    expect(screen.getByRole('header', { name: 'Next appointment' })).toBeOnTheScreen();
  });

  it('announces UndoToast as an alert with a named Undo button', async () => {
    await render(<UndoToast message="Marked as taken" onUndo={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Marked as taken', { exact: false });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeOnTheScreen();
  });

  it('exposes UndoHistoryButton as a named button', async () => {
    await render(<UndoHistoryButton count={3} scheme={dark} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: /3 recent actions/ })).toBeOnTheScreen();
  });

  it('exposes the UndoHistoryPanel close and per-entry undo controls by name', async () => {
    const entries = [{ id: 1, message: 'Marked as missed' }];
    await render(
      <UndoHistoryPanel visible entries={entries} scheme={dark} onUndo={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Undo: Marked as missed/ })).toBeOnTheScreen();
  });

  it('reports LinearProgressBar as a progressbar with the matching accessibility value', async () => {
    await render(<LinearProgressBar value={0.5} label="Progress" />);
    expect(screen.getByRole('progressbar', { name: 'Progress' })).toHaveAccessibilityValue({ min: 0, max: 100, now: 50 });
  });
});
