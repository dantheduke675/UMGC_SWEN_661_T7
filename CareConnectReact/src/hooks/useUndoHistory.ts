/**
 * useUndoHistory
 * Shared undo-stack behavior for screens with reversible actions (TodayScreen,
 * MedicationsScreen). Every action pushed stays in `history` (newest first)
 * until it is undone or replaced — unlike a plain auto-dismissing toast, the
 * user can open the full history and undo anything in it, not just the most
 * recent action.
 */
import { useCallback, useState } from 'react';

export interface UndoEntry {
  id:      number;
  message: string;
  undo:    () => void;
}

const TOAST_DURATION_MS = 5000;

export function useUndoHistory() {
  const [history, setHistory] = useState<UndoEntry[]>([]);
  const [nextId, setNextId]   = useState(0);
  const [toastId, setToastId] = useState<number | null>(null);

  // Push a new undoable action onto the stack and surface it as a toast
  // (the toast fades from view after a few seconds, but the entry itself
  // remains in `history` until undone).
  const pushAction = useCallback(
    (message: string, undo: () => void) => {
      const id = nextId + 1;
      setNextId(id);
      setHistory(prev => [{ id, message, undo }, ...prev]);
      setToastId(id);
      setTimeout(() => {
        setToastId(curr => (curr === id ? null : curr));
      }, TOAST_DURATION_MS);
    },
    [nextId],
  );

  // Undo any entry in the stack (not just the most recent one) and remove
  // it from the history.
  const undoEntry = useCallback((id: number) => {
    setHistory(prev => {
      const entry = prev.find(e => e.id === id);
      entry?.undo();
      return prev.filter(e => e.id !== id);
    });
    setToastId(curr => (curr === id ? null : curr));
  }, []);

  const dismissToast = useCallback(() => setToastId(null), []);

  const toastEntry = history.find(e => e.id === toastId) ?? null;

  return { history, toastEntry, pushAction, undoEntry, dismissToast };
}
