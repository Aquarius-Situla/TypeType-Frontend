import { useRef } from "react";

export function usePreparingWindow(
  preparing: boolean,
  updatedAt: number,
  limitMs: number,
): boolean {
  const since = useRef<number | null>(null);
  if (!preparing) {
    since.current = null;
    return false;
  }
  since.current ??= updatedAt;
  return updatedAt - since.current <= limitMs;
}
