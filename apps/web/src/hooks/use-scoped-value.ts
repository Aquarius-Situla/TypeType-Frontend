import { useCallback, useState } from "react";

type ScopedValue<T> = {
  scopeId: string;
  value: T;
};

export function useScopedValue<T>(scopeId: string, initialValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<ScopedValue<T>>(() => ({ scopeId, value: initialValue }));
  const value = state.scopeId === scopeId ? state.value : initialValue;
  const setValue = useCallback(
    (nextValue: T) => setState({ scopeId, value: nextValue }),
    [scopeId],
  );
  return [value, setValue];
}
