import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isLocked) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
    };
  }, [isLocked]);
}
