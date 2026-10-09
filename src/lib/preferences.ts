import { useState } from 'react';
export function usePreference<T>(
  key: string,
  initial: T,
  valid: (v: unknown) => v is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) ?? 'null');
      return valid(v) ? v : initial;
    } catch {
      return initial;
    }
  });
  const update = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  };
  return [value, update] as const;
}
