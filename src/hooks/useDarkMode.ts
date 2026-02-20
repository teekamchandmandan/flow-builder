import { useEffect, useState } from 'react';

/**
 * Reactive hook that tracks whether the `dark` class is on `<html>`.
 * Uses a MutationObserver so it updates immediately when toggled.
 */
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
