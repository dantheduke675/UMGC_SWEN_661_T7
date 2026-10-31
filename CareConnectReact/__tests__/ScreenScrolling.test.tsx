/**
 * The Scroll up / Scroll down buttons in the shell's access bar scroll whichever
 * screen is showing (see ScrollContext). Each signed-in screen registers a
 * scroll-by function that starts from where the user has scrolled to, and
 * never scrolls above the top.
 */
import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ScrollProvider, useScrollContext } from '../src/context/ScrollContext';
import TodayScreen from '../src/screens/TodayScreen';
import MedicationsScreen from '../src/screens/MedicationsScreen';
import MessagesScreen from '../src/screens/MessagesScreen';
import ScheduleScreen from '../src/screens/ScheduleScreen';
import SymptomsScreen from '../src/screens/SymptomsScreen';
import AccountScreen from '../src/screens/AccountScreen';

// What the access bar calls, captured from inside the provider
let scrollBy: (delta: number) => void = () => {};
function AccessBarProbe({ onReady }: { onReady: (fn: (delta: number) => void) => void }) {
  const { scrollBy: fn } = useScrollContext();
  useEffect(() => onReady(fn), [onReady, fn]);
  return null;
}
const captureScrollBy = (fn: (delta: number) => void) => { scrollBy = fn; };

type Element = NonNullable<typeof screen.root>;

// The screen's scroll view: the host element that reports scroll events
function scrollHost(node: Element | null = screen.root): Element | null {
  if (!node) return null;
  if (typeof node.type === 'string' && node.props.onScroll) return node;
  for (const child of node.children) {
    if (typeof child === 'string') continue;
    const found = scrollHost(child);
    if (found) return found;
  }
  return null;
}

const SCREENS: [string, React.ComponentType][] = [
  ['Today', TodayScreen],
  ['Medications', MedicationsScreen],
  ['Messages', MessagesScreen],
  ['Schedule', ScheduleScreen],
  ['Symptoms', SymptomsScreen],
  ['Account', AccountScreen],
];

let scrollTo: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo');
});

afterEach(() => {
  scrollTo.mockRestore();
  jest.useRealTimers();
});

describe.each(SCREENS)('%s screen and the access bar scroll buttons', (_, Screen) => {
  async function renderScreen() {
    const view = await render(
      <ScrollProvider>
        <AccessBarProbe onReady={captureScrollBy} />
        <Screen />
      </ScrollProvider>,
    );
    await act(() => jest.runOnlyPendingTimers());
    return view;
  }

  it('scrolls by the requested amount from where the user has scrolled to', async () => {
    await renderScreen();
    const host = scrollHost();
    expect(host).not.toBeNull();

    await fireEvent.scroll(host!, { nativeEvent: { contentOffset: { x: 0, y: 300 } } });
    await act(() => scrollBy(220));
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 520, animated: true });
  });

  it('never scrolls above the top', async () => {
    await renderScreen();
    await fireEvent.scroll(scrollHost()!, { nativeEvent: { contentOffset: { x: 0, y: 100 } } });
    await act(() => scrollBy(-220));
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 0, animated: true });
  });

  it('stops answering the scroll buttons once it is gone', async () => {
    const { unmount } = await renderScreen();
    await unmount();
    scrollTo.mockClear();
    await act(() => scrollBy(220));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
