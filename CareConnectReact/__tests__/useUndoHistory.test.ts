/**
 * Tests for the useUndoHistory hook — the shared undo-stack behind
 * TodayScreen and MedicationsScreen.
 */
import { act, renderHook } from '@testing-library/react-native';
import { useUndoHistory, UndoEntry } from '../src/hooks/useUndoHistory';

describe('useUndoHistory', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with an empty history and no toast', async () => {
    const { result } = await renderHook(() => useUndoHistory());
    expect(result.current.history).toEqual([]);
    expect(result.current.toastEntry).toBeNull();
  });

  it('pushAction adds an entry to the history and shows it as the toast', async () => {
    const { result } = await renderHook(() => useUndoHistory());
    const undo = jest.fn();

    await act(async () => {
      result.current.pushAction('Marked as taken', undo);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].message).toBe('Marked as taken');
    expect(result.current.toastEntry?.message).toBe('Marked as taken');
  });

  it('keeps every action on the stack — pushing more than one does not drop earlier ones', async () => {
    const { result } = await renderHook(() => useUndoHistory());

    await act(async () => {
      result.current.pushAction('First action', jest.fn());
    });
    await act(async () => {
      result.current.pushAction('Second action', jest.fn());
    });
    await act(async () => {
      result.current.pushAction('Third action', jest.fn());
    });

    expect(result.current.history.map((e: UndoEntry) => e.message)).toEqual([
      'Third action',
      'Second action',
      'First action',
    ]);
    // Newest action is the one shown as the toast.
    expect(result.current.toastEntry?.message).toBe('Third action');
  });

  it('the toast auto-dismisses after its duration, but the entry stays in history', async () => {
    const { result } = await renderHook(() => useUndoHistory());

    await act(async () => {
      result.current.pushAction('Marked as taken', jest.fn());
    });
    expect(result.current.toastEntry).not.toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.toastEntry).toBeNull();
    expect(result.current.history).toHaveLength(1);
  });

  it('dismissToast hides the toast without removing the entry from history', async () => {
    const { result } = await renderHook(() => useUndoHistory());

    await act(async () => {
      result.current.pushAction('Marked as taken', jest.fn());
    });
    await act(async () => {
      result.current.dismissToast();
    });

    expect(result.current.toastEntry).toBeNull();
    expect(result.current.history).toHaveLength(1);
  });

  it('undoEntry calls the undo callback and removes only that entry, in any order', async () => {
    const undoFirst  = jest.fn();
    const undoSecond = jest.fn();
    const undoThird  = jest.fn();
    const { result } = await renderHook(() => useUndoHistory());

    await act(async () => { result.current.pushAction('First',  undoFirst); });
    await act(async () => { result.current.pushAction('Second', undoSecond); });
    await act(async () => { result.current.pushAction('Third',  undoThird); });

    const secondId = result.current.history.find((e: UndoEntry) => e.message === 'Second')!.id;

    await act(async () => {
      result.current.undoEntry(secondId);
    });

    expect(undoSecond).toHaveBeenCalledTimes(1);
    expect(undoFirst).not.toHaveBeenCalled();
    expect(undoThird).not.toHaveBeenCalled();
    expect(result.current.history.map((e: UndoEntry) => e.message)).toEqual(['Third', 'First']);
  });

  it('undoing the entry currently shown as the toast also clears the toast', async () => {
    const { result } = await renderHook(() => useUndoHistory());

    await act(async () => {
      result.current.pushAction('Marked as taken', jest.fn());
    });
    const id = result.current.toastEntry!.id;

    await act(async () => {
      result.current.undoEntry(id);
    });

    expect(result.current.toastEntry).toBeNull();
    expect(result.current.history).toHaveLength(0);
  });
});
