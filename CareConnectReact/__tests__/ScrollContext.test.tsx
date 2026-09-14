/**
 * Unit tests for ScrollContext — the registry that lets AccessBar scroll
 * whichever screen is currently mounted without knowing its implementation.
 */
import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { ScrollProvider, useScrollContext } from '../src/context/ScrollContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ScrollProvider>{children}</ScrollProvider>;
}

describe('ScrollContext', () => {
  it('calling scrollBy with nothing registered is a no-op', async () => {
    const { result } = await renderHook(() => useScrollContext(), { wrapper });
    expect(() => result.current.scrollBy(100)).not.toThrow();
  });

  it('forwards scrollBy calls to the most recently registered function', async () => {
    const { result } = await renderHook(() => useScrollContext(), { wrapper });
    const fn = jest.fn();

    result.current.register(fn);
    result.current.scrollBy(220);
    expect(fn).toHaveBeenCalledWith(220);

    result.current.scrollBy(-220);
    expect(fn).toHaveBeenCalledWith(-220);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops forwarding once the screen unregisters (register(null))', async () => {
    const { result } = await renderHook(() => useScrollContext(), { wrapper });
    const fn = jest.fn();

    result.current.register(fn);
    result.current.register(null);
    result.current.scrollBy(220);

    expect(fn).not.toHaveBeenCalled();
  });

  it('a newly registered screen replaces the previous one', async () => {
    const { result } = await renderHook(() => useScrollContext(), { wrapper });
    const first = jest.fn();
    const second = jest.fn();

    result.current.register(first);
    result.current.register(second);
    result.current.scrollBy(50);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(50);
  });

  it('the default context (no provider) never throws when unused', async () => {
    const { result } = await renderHook(() => useScrollContext());
    expect(() => result.current.scrollBy(10)).not.toThrow();
    expect(() => result.current.register(() => {})).not.toThrow();
  });
});
