import { useEffect, type RefObject } from 'react';

type Options = {
  rootRef: RefObject<HTMLElement | null>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onStepDays?: (delta: number) => void;
  enabled?: boolean;
};

export function useKeyboardNav({ rootRef, onPrev, onNext, onToday, onStepDays, enabled = true }: Options) {
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;

      if (e.key === 'PageUp') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        onNext();
      } else if (e.key === 't' || e.key === 'T') {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        onToday();
      } else if (
        onStepDays &&
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')
      ) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const delta = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' ? -7 : 7;
        e.preventDefault();
        onStepDays(delta);
      }
    }

    root.addEventListener('keydown', onKey);
    return () => root.removeEventListener('keydown', onKey);
  }, [rootRef, onPrev, onNext, onToday, onStepDays, enabled]);
}
