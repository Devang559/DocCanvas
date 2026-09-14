import { useCallback, useState } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initial: T) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initial,
    future: [],
  });

  const push = useCallback((next: T) => {
    setState((s) => ({
      past: [...s.past, s.present],
      present: next,
      future: [],
    }));
  }, []);

  const set = useCallback((next: T) => {
    setState((s) => ({ ...s, present: next }));
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      const past = s.past.slice(0, s.past.length - 1);
      return {
        past,
        present: previous,
        future: [s.present, ...s.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      const future = s.future.slice(1);
      return {
        past: [...s.past, s.present],
        present: next,
        future,
      };
    });
  }, []);

  return {
    state: state.present,
    push,
    set,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
